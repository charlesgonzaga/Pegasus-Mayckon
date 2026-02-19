import { readFileSync, writeFileSync } from "fs";

// Importar o gerador de DACTE
const { generateDactePdf } = await import("./server/cte-dacte.ts");

// Ler o XML real
const xml = readFileSync("/home/ubuntu/upload/CTE2134_35251247463376000104570010000021341403369353.xml", "utf-8");

console.log("Gerando DACTE com XML real...");
console.log("XML length:", xml.length);
console.log("XML starts with:", xml.substring(0, 50));

try {
  const pdfBuffer = await generateDactePdf(xml);
  writeFileSync("/home/ubuntu/dacte-real-test.pdf", pdfBuffer);
  console.log("DACTE gerado com sucesso!");
  console.log("PDF size:", pdfBuffer.length, "bytes");
} catch (err) {
  console.error("Erro ao gerar DACTE:", err);
}
