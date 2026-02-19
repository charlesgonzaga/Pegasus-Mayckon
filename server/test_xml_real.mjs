/**
 * Script de análise minuciosa: parseia o XML real da NF35 e compara
 * cada campo com os valores do PDF DANFE
 */
import { readFileSync } from 'fs';

// Ler o XML real
const xml = readFileSync('/home/ubuntu/upload/NF35_42082031244298894000113000000000003526010313700800.xml', 'utf-8');

// Importar o parser
const { parseNfseXmlCompleto, parseNfseXmlCompletoRaw } = await import('./nfse-xml-parser.ts');

// Parsear como emitente (CNPJ da ALUMIFORT)
const resultStr = parseNfseXmlCompleto(xml, '44298894000113');
const resultRaw = parseNfseXmlCompletoRaw(xml, '44298894000113');

// Valores esperados do PDF DANFE
const esperado = {
  // Cabeçalho
  numeroNfse: '35',
  competencia: '15/01/2026',
  dataEmissao: '15/01/2026 08:38:34',
  numeroDps: '35',
  serieDps: '6000',
  
  // Emitente
  emitenteCnpj: '44.298.894/0001-13',
  emitenteInscMunicipal: '332923',
  emitenteTelefone: '4730461406',
  emitenteNome: 'ALUMIFORT FABRICACAO ESQUADRIAS LTDA',
  emitenteEmail: 'fiscal@exclusivacont.com.br',
  emitenteEndereco: 'SAUL SCHEAD DOS SANTOS, 278, SALA 01, SAO VICENTE',
  emitenteMunicipio: 'contem ITAJAÍ ou ITAJAI',
  emitenteUf: 'SC',
  emitenteCep: '88309390',
  emitenteSimplesNacional: 'contem Optante',
  emitenteRegimeApuracao: 'contem Simples Nacional',
  
  // Tomador
  tomadorCnpj: '24.061.289/0001-17',
  tomadorInscMunicipal: '308809',
  tomadorNome: 'OZZY CONSTRUTORA E INCORPORADORA LTDA',
  tomadorEmail: 'marcelo@dpncont.com.br',
  tomadorMunicipio: 'contem ITAJAÍ ou ITAJAI',
  tomadorCep: '88301902',
  
  // Serviço
  codigoTribNacional: '070201',
  descricaoServico: 'contem INSTALAÇÃO DE ESTRUTURA DE ALUMINIO',
  localPrestacao: 'contem ITAJAÍ ou ITAJAI',
  
  // Tributação Municipal
  tributacaoIssqn: 'Operação Tributável',
  municipioIncidenciaIssqn: 'contem ITAJAÍ ou ITAJAI',
  regimeEspecialTributacao: 'Nenhum',
  suspensaoExigibilidade: 'Não',
  valorServico: 26454.77,
  bcIssqn: 26454.77,
  aliquotaAplicada: 2.00,
  retencaoIssqn: 'Retido',
  issqnApurado: 529.10,
  
  // Tributação Federal (DANFE mostra "-" = não informado)
  irrf: 0,
  cp: 0,
  csll: 0,
  pis: 0,
  cofins: 0,
  
  // Valor Total
  valorLiquido: 25925.67,
  issqnRetido: 529.10,
  
  // Totais Aproximados
  tributosFederais: 3558.17,
  tributosEstaduais: 0.00,
  tributosMunicipais: 833.33,
  
  // Direção
  direcao: 'emitida',
  temRetencaoIssqn: true,
  temRetencao: true,
};

console.log('='.repeat(80));
console.log('ANÁLISE MINUCIOSA - NF35 ALUMIFORT');
console.log('='.repeat(80));

let erros = 0;
let ok = 0;

function check(campo, obtido, esperadoVal, tipo = 'exact') {
  let pass = false;
  if (tipo === 'exact') {
    pass = String(obtido) === String(esperadoVal);
  } else if (tipo === 'contains') {
    pass = String(obtido).toUpperCase().includes('ITAJA') || String(obtido).toUpperCase().includes('ITAJAÍ');
  } else if (tipo === 'containsText') {
    pass = String(obtido).toUpperCase().includes(String(esperadoVal).toUpperCase());
  } else if (tipo === 'number') {
    pass = Math.abs(Number(obtido) - Number(esperadoVal)) < 0.01;
  } else if (tipo === 'boolean') {
    pass = obtido === esperadoVal;
  }
  
  if (pass) {
    console.log(`  ✅ ${campo}: ${obtido}`);
    ok++;
  } else {
    console.log(`  ❌ ${campo}: obtido="${obtido}" | esperado="${esperadoVal}"`);
    erros++;
  }
}

console.log('\n📋 CABEÇALHO');
check('numeroNfse', resultStr.numeroNfse, '35');
check('competencia', resultStr.competencia, '2026-01-15', 'containsText');
check('numeroDps', resultStr.numeroDps, '35');
check('serieDps', resultStr.serieDps, '6000');

console.log('\n🏢 EMITENTE');
check('emitenteCnpj', resultStr.emitenteCnpj, '44.298.894/0001-13');
check('emitenteInscMunicipal', resultStr.emitenteInscMunicipal, '332923');
check('emitenteTelefone', resultStr.emitenteTelefone, '4730461406');
check('emitenteNome', resultStr.emitenteNome, 'ALUMIFORT FABRICACAO ESQUADRIAS LTDA');
check('emitenteEmail', resultStr.emitenteEmail, 'fiscal@exclusivacont.com.br');
check('emitenteMunicipio', resultStr.emitenteMunicipio, '', 'contains');
check('emitenteUf', resultStr.emitenteUf, 'SC');
check('emitenteCep', resultStr.emitenteCep, '88309390');
check('emitenteSN', resultStr.emitenteSimplesNacional, 'Optante', 'containsText');
check('emitenteRegApur', resultStr.emitenteRegimeApuracao, 'Simples Nacional', 'containsText');

console.log('\n👤 TOMADOR');
check('tomadorCnpj', resultStr.tomadorCnpj, '24.061.289/0001-17');
check('tomadorInscMunicipal', resultStr.tomadorInscMunicipal, '308809');
check('tomadorNome', resultStr.tomadorNome, 'OZZY CONSTRUTORA E INCORPORADORA LTDA');
check('tomadorEmail', resultStr.tomadorEmail, 'marcelo@dpncont.com.br');
check('tomadorMunicipio', resultStr.tomadorMunicipio, '', 'contains');
check('tomadorCep', resultStr.tomadorCep, '88301902');

console.log('\n🔧 SERVIÇO');
check('codigoTribNacional', resultStr.codigoTribNacional, '070201');
check('descricaoServico', resultStr.descricaoServico, 'INSTALAÇÃO DE ESTRUTURA DE ALUMINIO', 'containsText');
check('localPrestacao', resultStr.localPrestacao, '', 'contains');

console.log('\n🏛️ TRIBUTAÇÃO MUNICIPAL');
check('tributacaoIssqn', resultStr.tributacaoIssqn, 'Operação Tributável');
check('municipioIncidencia', resultStr.municipioIncidenciaIssqn, '', 'contains');
check('regimeEspecial', resultStr.regimeEspecialTributacao, 'Nenhum');
check('valorServico (raw)', resultRaw.valorServico, 26454.77, 'number');
check('bcIssqn (raw)', resultRaw.bcIssqn, 26454.77, 'number');
check('aliquotaAplicada (raw)', resultRaw.aliquotaAplicada, 2.00, 'number');
check('retencaoIssqn', resultStr.retencaoIssqn, 'Retido');
check('issqnApurado (raw)', resultRaw.issqnApurado, 529.10, 'number');

console.log('\n💰 TRIBUTAÇÃO FEDERAL');
check('irrf (raw)', resultRaw.irrf, 0, 'number');
check('cp (raw)', resultRaw.cp, 0, 'number');
check('csll (raw)', resultRaw.csll, 0, 'number');
check('pis (raw)', resultRaw.pis, 0, 'number');
check('cofins (raw)', resultRaw.cofins, 0, 'number');

console.log('\n💵 VALOR TOTAL');
check('valorLiquido (raw)', resultRaw.valorLiquido, 25925.67, 'number');
check('issqnRetido (raw)', resultRaw.issqnRetido, 529.10, 'number');
check('valorServicoTotal (raw)', resultRaw.valorServicoTotal, 26454.77, 'number');

console.log('\n📊 TOTAIS APROXIMADOS');
check('tributosFederais (raw)', resultRaw.tributosFederais, 3558.17, 'number');
check('tributosEstaduais (raw)', resultRaw.tributosEstaduais, 0.00, 'number');
check('tributosMunicipais (raw)', resultRaw.tributosMunicipais, 833.33, 'number');

console.log('\n🔄 DIREÇÃO E FLAGS');
check('direcao', resultStr.direcao, 'emitida');
check('temRetencaoIssqn', resultStr.temRetencaoIssqn, true, 'boolean');
check('temRetencao', resultStr.temRetencao, true, 'boolean');

console.log('\n' + '='.repeat(80));
console.log(`RESULTADO: ${ok} OK | ${erros} ERROS`);
console.log('='.repeat(80));

if (erros > 0) {
  console.log('\n⚠️ CAMPOS COM PROBLEMA - DETALHES:');
  // Dump raw values for debugging
  console.log('\nDump completo do resultado raw:');
  for (const [k, v] of Object.entries(resultRaw)) {
    if (typeof v === 'string' && v.length > 100) continue;
    console.log(`  ${k}: ${JSON.stringify(v)}`);
  }
}
