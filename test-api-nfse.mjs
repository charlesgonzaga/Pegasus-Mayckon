import https from "https";
import fs from "fs";
import forge from "node-forge";

const NFSE_API_BASE = "https://adn.nfse.gov.br";

// Parse PFX to get cert and key
function parsePfx(pfxPath, password) {
  const pfxBuffer = fs.readFileSync(pfxPath);
  const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
  const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, password);

  // Extract certificate
  const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag];
  if (!certBag || certBag.length === 0) throw new Error("No certificate found");
  const cert = certBag[0].cert;
  const certPem = forge.pki.certificateToPem(cert);

  // Extract private key
  const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
  if (!keyBag || keyBag.length === 0) throw new Error("No private key found");
  const key = keyBag[0].key;
  const keyPem = forge.pki.privateKeyToPem(key);

  // Extract CNPJ from subject
  const subject = cert.subject;
  let cnpj = "";
  let cn = "";
  for (const attr of subject.attributes) {
    if (attr.shortName === "CN") cn = attr.value;
  }
  // CNPJ is usually in CN after ":"
  const cnpjMatch = cn.match(/:\s*(\d{14})/);
  if (cnpjMatch) {
    cnpj = cnpjMatch[1];
  } else {
    // Try extracting from OID 2.16.76.1.3.3
    for (const attr of subject.attributes) {
      if (attr.type === "2.16.76.1.3.3") {
        cnpj = String(attr.value).replace(/[^\d]/g, "").substring(0, 14);
        break;
      }
    }
    if (!cnpj) {
      // Try OU fields
      for (const attr of subject.attributes) {
        if (attr.shortName === "OU") {
          const val = String(attr.value).replace(/[^\d]/g, "");
          if (val.length >= 14) {
            cnpj = val.substring(0, 14);
            break;
          }
        }
      }
    }
  }

  return { certPem, keyPem, cnpj, cn, validTo: cert.validity.notAfter };
}

// Test API call
function testApiCall(certPem, keyPem, cnpj, startNsu = 1) {
  return new Promise((resolve, reject) => {
    const url = `${NFSE_API_BASE}/contribuintes/DFe/${startNsu}?cnpjConsulta=${cnpj}&lote=true`;
    console.log(`  URL: ${url}`);

    const agent = new https.Agent({
      cert: certPem,
      key: keyPem,
      rejectUnauthorized: true,
    });

    const req = https.get(url, { agent, headers: { "Accept": "application/json" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        console.log(`  Status HTTP: ${res.statusCode}`);
        console.log(`  Headers: ${JSON.stringify(res.headers, null, 2).substring(0, 500)}`);
        if (data.length > 500) {
          console.log(`  Body (primeiros 500 chars): ${data.substring(0, 500)}`);
        } else {
          console.log(`  Body: ${data}`);
        }
        resolve({ statusCode: res.statusCode, data, headers: res.headers });
      });
    });

    req.on("error", (err) => {
      console.log(`  Erro de conexão: ${err.message}`);
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// Also test alternative URL patterns
function testAlternativeUrl(certPem, keyPem, cnpj) {
  return new Promise((resolve, reject) => {
    // Try without /contribuintes prefix
    const url = `${NFSE_API_BASE}/contribuinte/DFe/1?cnpjConsulta=${cnpj}&lote=true`;
    console.log(`  URL alternativa: ${url}`);

    const agent = new https.Agent({
      cert: certPem,
      key: keyPem,
      rejectUnauthorized: true,
    });

    const req = https.get(url, { agent, headers: { "Accept": "application/json" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        console.log(`  Status HTTP: ${res.statusCode}`);
        if (data.length > 300) {
          console.log(`  Body (primeiros 300 chars): ${data.substring(0, 300)}`);
        } else {
          console.log(`  Body: ${data}`);
        }
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on("error", (err) => {
      console.log(`  Erro: ${err.message}`);
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// Main test
const certificates = [
  { path: "/home/ubuntu/upload/2LSERVIÇOSCOMERCIAISLT,le082730.pfx", password: "le082730" },
  { path: "/home/ubuntu/upload/3ADPARTICIPACOESLTDA,123456Ng.pfx", password: "123456Ng" },
  { path: "/home/ubuntu/upload/ADMINISTRADORACALOCAEL,01119440.pfx", password: "01119440" },
];

console.log("=== TESTE DA API NACIONAL NFSe ===\n");

for (const certInfo of certificates) {
  const filename = certInfo.path.split("/").pop();
  console.log(`\n--- Testando: ${filename} ---`);
  
  try {
    const { certPem, keyPem, cnpj, cn, validTo } = parsePfx(certInfo.path, certInfo.password);
    console.log(`  CN: ${cn}`);
    console.log(`  CNPJ: ${cnpj}`);
    console.log(`  Válido até: ${validTo}`);
    
    if (new Date(validTo) < new Date()) {
      console.log(`  ⚠️ CERTIFICADO VENCIDO!`);
      continue;
    }

    console.log(`\n  [1] Testando URL padrão (contribuintes/DFe):`);
    try {
      await testApiCall(certPem, keyPem, cnpj, 1);
    } catch (e) {
      console.log(`  Falhou: ${e.message}`);
    }

    // Wait 2 seconds between requests
    await new Promise(r => setTimeout(r, 2000));

    console.log(`\n  [2] Testando URL alternativa (contribuinte/DFe):`);
    try {
      await testAlternativeUrl(certPem, keyPem, cnpj);
    } catch (e) {
      console.log(`  Falhou: ${e.message}`);
    }

    // Wait 2 seconds between requests
    await new Promise(r => setTimeout(r, 2000));

  } catch (e) {
    console.log(`  Erro ao processar certificado: ${e.message}`);
  }
}

console.log("\n=== FIM DOS TESTES ===");
