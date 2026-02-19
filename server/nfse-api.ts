import https from "https";
import { decrypt } from "./crypto";
import { gunzipSync } from "zlib";

const NFSE_API_BASE = "https://adn.nfse.gov.br";
const DANFSE_API_BASE = "https://adn.nfse.gov.br/danfse";

interface NfseDocument {
  NSU: number;
  ChaveAcesso: string;
  TipoDocumento: "NFSE" | "EVENTO";
  TipoEvento?: string;
  ArquivoXml: string; // base64 gzipped XML
  DataHoraGeracao: string;
}

interface NfseApiResponse {
  StatusProcessamento: string;
  LoteDFe: NfseDocument[];
  Alertas: any[];
  Erros: any[];
  TipoAmbiente: string;
  VersaoAplicativo: string;
  DataHoraProcessamento: string;
}

export interface ParsedNfse {
  chaveAcesso: string;
  nsu: number;
  tipoDocumento: "NFSE" | "EVENTO";
  tipoEvento?: string;
  xmlOriginal: string;
  // Parsed fields
  numeroNota?: string;
  serie?: string;
  emitenteCnpj?: string;
  emitenteNome?: string;
  tomadorCnpj?: string;
  tomadorNome?: string;
  valorServico?: string;
  valorLiquido?: string;
  valorRetencao?: string;
  codigoServico?: string;
  descricaoServico?: string;
  dataEmissao?: Date;
  dataCompetencia?: Date;
  municipioPrestacao?: string;
  ufPrestacao?: string;
  status: "valida" | "cancelada" | "substituida";
  direcao: "emitida" | "recebida";
}

/**
 * Creates an HTTPS agent with mTLS using the client certificate
 */
function createMtlsAgent(certPem: string, keyPem: string): https.Agent {
  return new https.Agent({
    cert: certPem,
    key: keyPem,
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  });
}

/**
 * Extract PEM cert and key from PFX buffer
 */
export async function extractPfxCertAndKey(pfxBuffer: Buffer, password: string): Promise<{ cert: string; key: string; cnpj: string; razaoSocial: string; serialNumber: string; issuer: string; validFrom: Date; validTo: Date }> {
  // Use node-forge for PFX parsing
  const forgeModule = await import("node-forge");
  const forge = forgeModule.default || forgeModule;
  const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) throw new Error("Certificado não encontrado no arquivo PFX");

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) throw new Error("Chave privada não encontrada no arquivo PFX");

  const cert = certBag.cert;
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keyBag.key);

  // Extract subject info
  const subject = cert.subject;
  const cnAttr = subject.getField("CN");
  const cn = cnAttr ? cnAttr.value : "";

  // Parse CNPJ from CN (format: "RAZAO SOCIAL:CNPJ")
  let cnpj = "";
  let razaoSocial = "";
  if (cn.includes(":")) {
    const parts = cn.split(":");
    razaoSocial = parts[0].trim();
    cnpj = parts[1].trim().replace(/[^\d]/g, "");
  } else {
    razaoSocial = cn;
    // Try OU field for CNPJ
    const ouFields = subject.attributes.filter((a: any) => a.shortName === "OU");
    for (const ou of ouFields) {
      const val = String(ou.value || "").replace(/[^\d]/g, "");
      if (val && val.length === 14) {
        cnpj = val;
        break;
      }
    }
  }

  // Format CNPJ
  const cnpjFormatted = cnpj.length === 14
    ? `${cnpj.slice(0,2)}.${cnpj.slice(2,5)}.${cnpj.slice(5,8)}/${cnpj.slice(8,12)}-${cnpj.slice(12)}`
    : cnpj;

  return {
    cert: certPem,
    key: keyPem,
    cnpj: cnpjFormatted,
    razaoSocial,
    serialNumber: cert.serialNumber,
    issuer: cert.issuer.getField("CN")?.value || "",
    validFrom: cert.validity.notBefore,
    validTo: cert.validity.notAfter,
  };
}

/**
 * Fetch documents from NFSe API using mTLS
 */
async function fetchNfseDocumentsSingle(
  certPem: string,
  keyPem: string,
  cnpj: string,
  startNsu: number = 1
): Promise<{ response: NfseApiResponse | null; statusCode: number; rawBody: string }> {
  const cnpjClean = cnpj.replace(/[^\d]/g, "");
  const url = `${NFSE_API_BASE}/contribuintes/DFe/${startNsu}?cnpjConsulta=${cnpjClean}&lote=true`;

  const agent = createMtlsAgent(certPem, keyPem);

  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      agent,
      headers: { "Accept": "application/json" },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        const statusCode = res.statusCode || 0;
        // Sempre tentar parsear o body JSON primeiro, independente do status HTTP
        // A API NFSe retorna JSON válido mesmo em HTTP 404 (NENHUM_DOCUMENTO_LOCALIZADO)
        try {
          const parsed = JSON.parse(data);
          resolve({ response: parsed as NfseApiResponse, statusCode, rawBody: data });
        } catch {
          // Não conseguiu parsear JSON - verificar status HTTP para mensagem de erro
          resolve({ response: null, statusCode, rawBody: data });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Timeout na comunicação com a API Nacional"));
    });
  });
}

/**
 * Fetch documents from NFSe API with retry and backoff for 429/5xx errors
 */
export async function fetchNfseDocuments(
  certPem: string,
  keyPem: string,
  cnpj: string,
  startNsu: number = 1
): Promise<NfseApiResponse> {
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 3000; // 3 seconds base delay for retry

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { response, statusCode, rawBody } = await fetchNfseDocumentsSingle(certPem, keyPem, cnpj, startNsu);

      // Se conseguiu parsear JSON, verificar o StatusProcessamento
      if (response) {
        // JSON válido - a API respondeu normalmente (mesmo com HTTP 404)
        // StatusProcessamento pode ser "DOCUMENTOS_LOCALIZADOS" ou "NENHUM_DOCUMENTO_LOCALIZADO"
        return response;
      }

      // Não conseguiu parsear JSON - tratar por status HTTP
      if (statusCode === 429) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt); // Backoff exponencial: 3s, 6s, 12s
          console.log(`[API NFSe] 429 Too Many Requests - aguardando ${delay}ms antes de retry ${attempt + 1}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error("API sobrecarregada (429) - muitas requisições simultâneas. Tente novamente em alguns minutos.");
      }
      if (statusCode === 403) {
        throw new Error("Acesso negado pela API Nacional (403) - verifique o certificado");
      }
      if (statusCode === 401) {
        throw new Error("Certificado não autorizado pela API Nacional (401)");
      }
      if (statusCode >= 500) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.log(`[API NFSe] Erro ${statusCode} - aguardando ${delay}ms antes de retry ${attempt + 1}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`API Nacional indisponível (HTTP ${statusCode})`);
      }
      // Resposta HTML ou inválida
      if (rawBody.trim().startsWith("<")) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.log(`[API NFSe] Resposta HTML inválida - aguardando ${delay}ms antes de retry ${attempt + 1}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error("API retornou resposta inválida (HTML) - tente novamente em alguns minutos");
      }
      throw new Error(`Erro na API Nacional (HTTP ${statusCode}): ${rawBody.substring(0, 100)}`);
    } catch (error: any) {
      // Erros de rede (ECONNRESET, ECONNREFUSED, etc.) - retry
      if (attempt < MAX_RETRIES && (error.message.includes("ECONNRESET") || error.message.includes("ECONNREFUSED") || error.message.includes("socket") || error.message.includes("ETIMEDOUT"))) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(`[API NFSe] Erro de rede: ${error.message} - aguardando ${delay}ms antes de retry ${attempt + 1}/${MAX_RETRIES}`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Falha após múltiplas tentativas de comunicação com a API Nacional");
}

/**
 * Decode a GZip+Base64 XML document
 */
export function decodeXml(base64GzipXml: string): string {
  const gzipBuffer = Buffer.from(base64GzipXml, "base64");
  const xmlBuffer = gunzipSync(gzipBuffer);
  return xmlBuffer.toString("utf-8");
}

/**
 * Parse NFSe XML to extract key fields
 */
export function parseNfseXml(xml: string, clienteCnpj: string): Partial<ParsedNfse> {
  const getTag = (tag: string): string => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
    const match = xml.match(regex);
    return match?.[1]?.trim() ?? "";
  };

  const emitenteCnpj = getTag("CNPJ") || "";
  const cnpjClean = String(clienteCnpj).replace(/[^\d]/g, "");
  const emitenteCnpjClean = String(emitenteCnpj).replace(/[^\d]/g, "");

  // Determine direction: if emitter CNPJ matches client, it's emitida
  const direcao = emitenteCnpjClean === cnpjClean ? "emitida" : "recebida";

  // Parse dates
  let dataEmissao: Date | undefined;
  const dhEmi = getTag("dhEmi") || getTag("dhProc");
  if (dhEmi) {
    try { dataEmissao = new Date(dhEmi); } catch { }
  }

  let dataCompetencia: Date | undefined;
  const dCompet = getTag("dCompet");
  if (dCompet) {
    try { dataCompetencia = new Date(dCompet + "T00:00:00"); } catch { }
  }

  // Extract tomador info - look for toma section
  let tomadorCnpj = "";
  let tomadorNome = "";
  const tomaMatch = xml.match(/<toma>([\s\S]*?)<\/toma>/i);
  if (tomaMatch) {
    const tomaXml = tomaMatch[1];
    const cnpjMatch = tomaXml.match(/<CNPJ>([^<]*)<\/CNPJ>/i);
    const nomeMatch = tomaXml.match(/<xNome>([^<]*)<\/xNome>/i);
    tomadorCnpj = cnpjMatch?.[1] ?? "";
    tomadorNome = nomeMatch?.[1] ?? "";
  }

  // Extract emitente name
  const emitMatch = xml.match(/<emit>([\s\S]*?)<\/emit>/i);
  let emitenteNome = "";
  if (emitMatch) {
    const nomeMatch = emitMatch[1].match(/<xNome>([^<]*)<\/xNome>/i);
    emitenteNome = nomeMatch?.[1] ?? "";
  }

  return {
    numeroNota: getTag("nNFSe") || getTag("nDPS"),
    serie: getTag("serie"),
    emitenteCnpj,
    emitenteNome,
    tomadorCnpj,
    tomadorNome,
    valorServico: getTag("vServ") || getTag("vServPrest") || undefined,
    valorLiquido: getTag("vLiq") || undefined,
    valorRetencao: getTag("vTotalRet") || undefined,
    codigoServico: getTag("cTribNac") || getTag("cServ"),
    descricaoServico: getTag("xDescServ"),
    dataEmissao,
    dataCompetencia,
    municipioPrestacao: getTag("xLocPrestacao") || getTag("xLocIncid"),
    ufPrestacao: getTag("UF"),
    direcao: direcao as "emitida" | "recebida",
  };
}

/**
 * Download all documents for a client, starting from a given NSU
 * Returns parsed documents ready for database insertion
 * 
 * @param options.competenciaInicio - Optional: filter by competência start (YYYY-MM format)
 * @param options.competenciaFim - Optional: filter by competência end (YYYY-MM format)
 * @param options.smartStartNsu - NSU inteligente: pular diretamente para o NSU mais próximo do período
 * @param options.isCancelled - Function to check if download was cancelled
 * @param options.onPageInfo - Callback com info de paginação (páginas consultadas, total docs na página)
 */
export async function downloadAllDocuments(
  certPem: string,
  keyPem: string,
  cnpj: string,
  startNsu: number = 1,
  onProgress?: (downloaded: number) => void,
  options?: {
    competenciaInicio?: string; // YYYY-MM
    competenciaFim?: string;    // YYYY-MM
    dataInicio?: string;        // YYYY-MM-DD (filtro exato por dia)
    dataFim?: string;           // YYYY-MM-DD (filtro exato por dia)
    smartStartNsu?: number;     // NSU inteligente para pular ao período
    isCancelled?: () => Promise<boolean>;
    onPageInfo?: (info: { pagesQueried: number; docsInPage: number; currentNsu: number }) => void;
  }
): Promise<ParsedNfse[]> {
  const allDocs: ParsedNfse[] = [];
  // Usar smartStartNsu se fornecido (pula direto ao período), senão usa startNsu normal
  let currentNsu = options?.smartStartNsu && options.smartStartNsu > 0 ? options.smartStartNsu : startNsu;
  let hasMore = true;
  let pagesQueried = 0;
  // Contador de páginas consecutivas sem nenhuma nota no período (para early termination)
  let consecutivePagesOutOfRange = 0;
  const MAX_EMPTY_PAGES = 3; // Parar após 3 páginas consecutivas sem notas no período

  // Parse period filters
  let periodoInicio: Date | null = null;
  let periodoFim: Date | null = null;
  if (options?.dataInicio) {
    const [y, m, d] = options.dataInicio.split("-").map(Number);
    periodoInicio = new Date(y, m - 1, d, 0, 0, 0);
  } else if (options?.competenciaInicio) {
    const [y, m] = options.competenciaInicio.split("-").map(Number);
    periodoInicio = new Date(y, m - 1, 1);
  }
  if (options?.dataFim) {
    const [y, m, d] = options.dataFim.split("-").map(Number);
    periodoFim = new Date(y, m - 1, d, 23, 59, 59);
  } else if (options?.competenciaFim) {
    const [y, m] = options.competenciaFim.split("-").map(Number);
    periodoFim = new Date(y, m, 0, 23, 59, 59);
  }

  const hasPeriodFilter = !!(periodoInicio || periodoFim);

  while (hasMore) {
    // Check cancellation
    if (options?.isCancelled) {
      const cancelled = await options.isCancelled();
      if (cancelled) break;
    }

    const response = await fetchNfseDocuments(certPem, keyPem, cnpj, currentNsu);
    pagesQueried++;

    if (response.StatusProcessamento !== "DOCUMENTOS_LOCALIZADOS" || !response.LoteDFe?.length) {
      hasMore = false;
      break;
    }

    options?.onPageInfo?.({
      pagesQueried,
      docsInPage: response.LoteDFe.length,
      currentNsu,
    });

    let docsAddedThisPage = 0;
    let allDocsAfterPeriod = true; // Track if ALL docs in this page are after the period
    let allDocsBeforePeriod = true; // Track if ALL docs in this page are before the period

    for (const doc of response.LoteDFe) {
      try {
        const xmlOriginal = decodeXml(doc.ArquivoXml);
        const parsed = parseNfseXml(xmlOriginal, cnpj);

        const isCancel = doc.TipoDocumento === "EVENTO" && doc.TipoEvento === "CANCELAMENTO";

        // If period filter is active, check competência
        if (hasPeriodFilter) {
          const docDate = parsed.dataCompetencia || parsed.dataEmissao;
          if (docDate) {
            const isBeforePeriod = periodoInicio ? docDate < periodoInicio : false;
            const isAfterPeriod = periodoFim ? docDate > periodoFim : false;
            if (!isAfterPeriod) allDocsAfterPeriod = false;
            if (!isBeforePeriod) allDocsBeforePeriod = false;
            if (isBeforePeriod || isAfterPeriod) continue;
          } else {
            // Sem data, não podemos determinar - não é "after" nem "before"
            allDocsAfterPeriod = false;
            allDocsBeforePeriod = false;
          }
        }

        allDocs.push({
          chaveAcesso: doc.ChaveAcesso,
          nsu: doc.NSU,
          tipoDocumento: doc.TipoDocumento,
          tipoEvento: doc.TipoEvento,
          xmlOriginal: doc.ArquivoXml,
          status: isCancel ? "cancelada" : "valida",
          direcao: parsed.direcao ?? "emitida",
          ...parsed,
        });
        docsAddedThisPage++;
      } catch (e) {
        console.error(`Error parsing document NSU ${doc.NSU}:`, e);
      }
    }

    currentNsu = Math.max(...response.LoteDFe.map(d => d.NSU)) + 1;
    onProgress?.(allDocs.length);

    // EARLY TERMINATION: Se temos filtro de período e TODOS os docs da página
    // estão APÓS o período, significa que já passamos do período desejado.
    // NSUs são sequenciais/cronológicos, então não haverá mais notas no período.
    if (hasPeriodFilter && periodoFim) {
      if (allDocsAfterPeriod && response.LoteDFe.length > 0) {
        consecutivePagesOutOfRange++;
        console.log(`[API NFSe] Página ${pagesQueried}: todas as ${response.LoteDFe.length} notas estão APÓS o período. ` +
          `Consecutivas fora do período: ${consecutivePagesOutOfRange}/${MAX_EMPTY_PAGES}`);
        if (consecutivePagesOutOfRange >= MAX_EMPTY_PAGES) {
          console.log(`[API NFSe] Early termination: ${MAX_EMPTY_PAGES} páginas consecutivas após o período. Parando consulta.`);
          break;
        }
      } else {
        consecutivePagesOutOfRange = 0;
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`[API NFSe] Consulta finalizada: ${pagesQueried} página(s) consultada(s), ${allDocs.length} nota(s) no período`);
  return allDocs;
}

/**
 * Get DANFSe PDF URL (direct URL - requires mTLS)
 */
export function getDanfseUrl(chaveAcesso: string): string {
  return `${DANFSE_API_BASE}/${chaveAcesso}`;
}

/**
 * Download DANFSe PDF via mTLS using the client certificate
 * Returns the PDF as a Buffer, or null if not available
 */
export async function fetchDanfsePdf(
  certPem: string,
  keyPem: string,
  chaveAcesso: string
): Promise<Buffer | null> {
  const url = `${DANFSE_API_BASE}/${chaveAcesso}`;
  const agent = createMtlsAgent(certPem, keyPem);

  return new Promise((resolve) => {
    const req = https.get(url, {
      agent,
      headers: { "Accept": "application/pdf" },
    }, (res) => {
      if (res.statusCode !== 200) {
        // DANFSe may not be available for all notes
        console.log(`DANFSe not available for ${chaveAcesso}: HTTP ${res.statusCode}`);
        res.resume(); // consume response
        resolve(null);
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        // Verify it's actually a PDF (starts with %PDF)
        if (pdfBuffer.length > 4 && pdfBuffer.toString("utf-8", 0, 4) === "%PDF") {
          resolve(pdfBuffer);
        } else {
          console.log(`DANFSe response for ${chaveAcesso} is not a valid PDF`);
          resolve(null);
        }
      });
    });

    req.on("error", (err) => {
      console.error(`Error fetching DANFSe for ${chaveAcesso}:`, err.message);
      resolve(null);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`DANFSe timeout for ${chaveAcesso}`);
      resolve(null);
    });
  });
}
