import { generateDactePdf } from "./server/cte-dacte.ts";
import { writeFileSync } from "fs";

// XML de exemplo de CT-e para teste
const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<cteProc xmlns="http://www.portalfiscal.inf.br/cte" versao="3.00">
  <CTe>
    <infCte Id="CTe53210705633019000199570010000000031011890123" versao="3.00">
      <ide>
        <cUF>53</cUF>
        <cCT>01189012</cCT>
        <CFOP>6932</CFOP>
        <natOp>Prestação de serviço de transporte iniciada em UF diversa</natOp>
        <mod>57</mod>
        <serie>1</serie>
        <nCT>3</nCT>
        <dhEmi>2021-07-19T18:13:25-03:00</dhEmi>
        <tpCTe>0</tpCTe>
        <tpServ>0</tpServ>
        <UFIni>GO</UFIni>
        <xMunIni>ITUMBIARA</xMunIni>
        <UFFim>SP</UFFim>
        <xMunFim>SANTOS</xMunFim>
        <modal>01</modal>
        <toma3>
          <toma>0</toma>
        </toma3>
      </ide>
      <compl>
        <xObs>CONTROLE 6001477689 XML COM DADOS DE PAGAMENTO DE FRETE PARA O FORNECEDOR ASSOCIAÇÃO BRASILEIRA DOS CAMINHONEIROS DEVE SER USADO COMO ESPELHO PARA CRIAÇÃO DO CT-E/DACTE</xObs>
        <fluxo>
          <xOrig>ITUMBIARA</xOrig>
          <pass><xPass>UBERLANDIA</xPass></pass>
          <pass><xPass>CAMPINAS</xPass></pass>
          <xDest>SANTOS</xDest>
        </fluxo>
      </compl>
      <emit>
        <CNPJ>05633019000199</CNPJ>
        <IE>1234567890</IE>
        <xNome>ASSOCIAÇÃO BRASILEIRA DOS CAMINHONEIROS</xNome>
        <xFant>ABC TRANSPORTES</xFant>
        <enderEmit>
          <xLgr>Rua dos Transportadores</xLgr>
          <nro>1500</nro>
          <xCpl>Galpão 3</xCpl>
          <xBairro>Centro</xBairro>
          <cMun>5209200</cMun>
          <xMun>ITUMBIARA</xMun>
          <CEP>75500000</CEP>
          <UF>GO</UF>
          <fone>6434313000</fone>
        </enderEmit>
      </emit>
      <rem>
        <CNPJ>12345678000190</CNPJ>
        <IE>9876543210</IE>
        <xNome>CARAMURU ALIMENTOS S/A</xNome>
        <enderReme>
          <xLgr>Rodovia BR-153</xLgr>
          <nro>KM 320</nro>
          <xBairro>Distrito Industrial</xBairro>
          <cMun>5209200</cMun>
          <xMun>ITUMBIARA</xMun>
          <CEP>75500000</CEP>
          <UF>GO</UF>
          <xPais>BRASIL</xPais>
          <fone>6434313000</fone>
        </enderReme>
      </rem>
      <dest>
        <CNPJ>98765432000110</CNPJ>
        <IE>5544332211</IE>
        <xNome>TERMINAL PORTUÁRIO DE SANTOS LTDA</xNome>
        <enderDest>
          <xLgr>Av. Portuária</xLgr>
          <nro>500</nro>
          <xBairro>Porto</xBairro>
          <cMun>3548500</cMun>
          <xMun>SANTOS</xMun>
          <CEP>11010000</CEP>
          <UF>SP</UF>
          <xPais>BRASIL</xPais>
          <fone>1332193000</fone>
        </enderDest>
      </dest>
      <vPrest>
        <vTPrest>5831.88</vTPrest>
        <vRec>5831.88</vRec>
        <Comp>
          <xNome>FRETE PESO</xNome>
          <vComp>5027.48</vComp>
        </Comp>
        <Comp>
          <xNome>PEDÁGIO</xNome>
          <vComp>804.40</vComp>
        </Comp>
      </vPrest>
      <imp>
        <ICMS>
          <ICMS45>
            <CST>40</CST>
          </ICMS45>
        </ICMS>
      </imp>
      <infCTeNorm>
        <infCarga>
          <vCarga>73174.23</vCarga>
          <proPred>FARELO SOJA HIPRO MOIDO CARAMURU GR</proPred>
          <xOutCat>KGS</xOutCat>
          <infQ>
            <cUnid>01</cUnid>
            <tpMed>PESO BRUTO</tpMed>
            <qCarga>37625.0000</qCarga>
          </infQ>
          <infQ>
            <cUnid>03</cUnid>
            <tpMed>UNIDADE</tpMed>
            <qCarga>37625.0000</qCarga>
          </infQ>
        </infCarga>
        <infDoc>
          <infNFe>
            <chave>52210100080051000600550010006020028410233</chave>
          </infNFe>
        </infDoc>
        <infModal versaoModal="3.00">
          <rodo>
            <RNTRC>12345678</RNTRC>
          </rodo>
        </infModal>
      </infCTeNorm>
    </infCte>
  </CTe>
  <protCTe versao="3.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>GO1.0</verAplic>
      <chCTe>53210705633019000199570010000000031011890123</chCTe>
      <dhRecbto>2021-07-19T18:22:29-03:00</dhRecbto>
      <nProt>353210010035471</nProt>
      <digVal>abc123</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso do CT-e</xMotivo>
    </infProt>
  </protCTe>
</cteProc>`;

async function main() {
  console.log("Gerando DACTE de teste...");
  try {
    const pdfBuffer = await generateDactePdf(sampleXml);
    writeFileSync("/home/ubuntu/dacte-test.pdf", pdfBuffer);
    console.log("DACTE gerado com sucesso! Tamanho:", pdfBuffer.length, "bytes");
    console.log("Salvo em: /home/ubuntu/dacte-test.pdf");
  } catch (err) {
    console.error("Erro ao gerar DACTE:", err);
  }
}

main();
