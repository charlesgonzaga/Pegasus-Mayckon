import https from "https";
import fs from "fs";
import forge from "node-forge";

const NFSE_API_BASE = "https://adn.nfse.gov.br";

function parsePfx(pfxPath, password) {
  const pfxBuffer = fs.readFileSync(pfxPath);
  const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
  const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, password);
  const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag];
  const cert = certBag[0].cert;
  const certPem = forge.pki.certificateToPem(cert);
  const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
  const key = keyBag[0].key;
  const keyPem = forge.pki.privateKeyToPem(key);
  const cn = cert.subject.getField("CN")?.value || "";
  let cnpj = "";
  if (cn.includes(":")) {
    cnpj = cn.split(":")[1].trim().replace(/[^\d]/g, "");
  }
  return { certPem, keyPem, cnpj, cn };
}

function fetchApi(certPem, keyPem, cnpj, nsu = 1) {
  return new Promise((resolve, reject) => {
    const cnpjClean = cnpj.replace(/[^\d]/g, "");
    const url = `${NFSE_API_BASE}/contribuintes/DFe/${nsu}?cnpjConsulta=${cnpjClean}&lote=true`;
    const agent = new https.Agent({ cert: certPem, key: keyPem, rejectUnauthorized: true });
    const req = https.get(url, { agent, headers: { "Accept": "application/json" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, dataLength: data.length, body: data.substring(0, 200) });
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

const certificates = [
  { path: "/home/ubuntu/upload/2LSERVIÇOSCOMERCIAISLT,le082730.pfx", password: "le082730" },
  { path: "/home/ubuntu/upload/3ADPARTICIPACOESLTDA,123456Ng.pfx", password: "123456Ng" },
  { path: "/home/ubuntu/upload/ADMINISTRADORACALOCAEL,01119440.pfx", password: "01119440" },
  { path: "/home/ubuntu/upload/ADMINISTRADORACOMETA,01119440.pfx", password: "01119440" },
  { path: "/home/ubuntu/upload/AJAAADMDEBENS,DQEYR1JN2C4CX5.pfx", password: "DQEYR1JN2C4CX5" },
  { path: "/home/ubuntu/upload/BIOQUALIS-MATRIZ,12345678.pfx", password: "12345678" },
  { path: "/home/ubuntu/upload/BIOQUALIS-FILIAL02-F2-,12345678.pfx", password: "12345678" },
];

console.log("=== TESTE PARALELO - 7 certificados ao mesmo tempo ===\n");

// Parse all certs first
const certs = [];
for (const c of certificates) {
  try {
    const parsed = parsePfx(c.path, c.password);
    certs.push({ ...parsed, filename: c.path.split("/").pop() });
    console.log(`OK: ${parsed.cn} (CNPJ: ${parsed.cnpj})`);
  } catch (e) {
    console.log(`ERRO: ${c.path.split("/").pop()} - ${e.message}`);
  }
}

console.log(`\n--- Disparando ${certs.length} requisições SIMULTÂNEAS ---\n`);
const start = Date.now();
const promises = certs.map(c => 
  fetchApi(c.certPem, c.keyPem, c.cnpj).then(r => ({ cn: c.cn, ...r })).catch(e => ({ cn: c.cn, error: e.message }))
);
const results = await Promise.all(promises);
const elapsed = Date.now() - start;

console.log(`\nResultados (${elapsed}ms):`);
for (const r of results) {
  if (r.error) {
    console.log(`  ${r.cn}: ERRO - ${r.error}`);
  } else {
    console.log(`  ${r.cn}: HTTP ${r.statusCode} (${r.dataLength} bytes) - ${r.body.substring(0, 80)}`);
  }
}

console.log(`\n--- Agora testando SEQUENCIAL com 2s delay ---\n`);
const start2 = Date.now();
for (const c of certs) {
  try {
    const r = await fetchApi(c.certPem, c.keyPem, c.cnpj);
    console.log(`  ${c.cn}: HTTP ${r.statusCode} (${r.dataLength} bytes)`);
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.log(`  ${c.cn}: ERRO - ${e.message}`);
  }
}
const elapsed2 = Date.now() - start2;
console.log(`\nTempo total sequencial: ${elapsed2}ms`);

console.log("\n=== FIM ===");
