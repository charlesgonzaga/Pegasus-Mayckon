import { parseNfseXmlCompleto, parseNfseXmlCompletoRaw } from "./nfse-xml-parser.ts";
import { readFileSync } from "fs";

const xml = readFileSync("/home/ubuntu/upload/NF768_42082031234479946000102000000000076826010625562967.xml", "utf-8");
const cnpj = "34479946000102";

console.log("=== TESTE NOTA 768 - ANTES DA CORREÇÃO ===\n");

const parsed = parseNfseXmlCompleto(xml, cnpj);
const raw = parseNfseXmlCompletoRaw(xml, cnpj);

// Valores esperados do DANFE/PDF:
const esperados = {
  numeroNfse: "768",
  emitenteNome: "ATENA MEDICINA DA MULHER S/S",
  emitenteCnpj: "34.479.946/0001-02",
  tomadorNome: "PHD-PATOLOGIA HUMANA DIAGN. LTDA",
  tomadorCnpj: "04.911.059/0002-73",
  valorServico: "26.537,44",
  bcIssqn: "26.537,44",
  aliquotaAplicada: "2.00%",
  issqnApurado: "530,75",
  irrf: "398,06",           // vRetIRRF
  csll: "265,37",           // vRetCSLL (Contribuições Sociais Retidas)
  pis: "172,49",            // vPis
  cofins: "796,12",         // vCofins
  valorLiquido: "24.905,40",
  tributosFederais: "3.569,29",
  tributosMunicipais: "559,94",
  retencaoIssqn: "Não Retido", // tpRetISSQN=1
};

let ok = 0, erros = 0;

for (const [campo, esperado] of Object.entries(esperados)) {
  const valor = parsed[campo] || "";
  const match = valor.includes(esperado) || valor === esperado;
  if (match) {
    console.log(`  ✅ ${campo}: ${valor}`);
    ok++;
  } else {
    console.log(`  ❌ ${campo}: "${valor}" (esperado: "${esperado}")`);
    erros++;
  }
}

console.log("\n=== RAW VALUES ===");
console.log("  irrf (raw):", raw.irrf);
console.log("  csll (raw):", raw.csll);
console.log("  pis (raw):", raw.pis);
console.log("  cofins (raw):", raw.cofins);
console.log("  cp (raw):", raw.cp);
console.log("  totalTributacaoFederal:", parsed.totalTributacaoFederal);
console.log("  tributosFederais:", parsed.tributosFederais);
console.log("  tributosEstaduais:", parsed.tributosEstaduais);
console.log("  tributosMunicipais:", parsed.tributosMunicipais);

console.log(`\n${"=".repeat(60)}`);
console.log(`RESULTADO: ${ok} OK | ${erros} ERROS`);
console.log(`${"=".repeat(60)}`);
