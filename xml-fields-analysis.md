# Campos Importantes do XML CT-e para Relatórios

## Campos do XML que devem aparecer nos relatórios

### IDE (Identificação)
- nCT: Número do CT-e (2134)
- serie: Série (1)
- CFOP: (6932)
- natOp: Natureza da Operação
- dhEmi: Data de Emissão
- tpCTe: Tipo CT-e (0=Normal, 1=Complementar, 2=Anulação, 3=Substituto)
- modal: Modal (01=Rodoviário, 02=Aéreo, 03=Aquaviário, 04=Ferroviário, 05=Dutoviário, 06=Multimodal)
- tpServ: Tipo Serviço (0=Normal, 1=Subcontratação, 2=Redespacho, 3=Redespacho Intermediário, 4=Serviço Vinculado Multimodal)
- xMunIni/UFIni: Município/UF Início (ITAJAI/SC)
- xMunFim/UFFim: Município/UF Fim (SAO PAULO/SP)
- toma3/toma: Tomador (0=Remetente, 1=Expedidor, 2=Recebedor, 3=Destinatário)

### EMIT (Emitente/Transportadora)
- CNPJ: 47463376000104
- xNome: VIA GLASS TRANSPORTES LTDA
- xFant: VIA GLASS
- IE: 420205599119
- UF: SP

### REM (Remetente)
- CNPJ: 30800020000108
- xNome: NEW GLASS IMPORTACAO E EXPORTACAO LTDA
- IE: 258789778
- UF: SC

### DEST (Destinatário)
- CNPJ: 58303946000107
- xNome: QUALYVAX PROJETOS E ESQUADRIAS LTDA
- IE: 151778384112
- UF: SP

### VPREST (Prestação)
- vTPrest: Valor Total Prestação (500.00)
- vRec: Valor a Receber (500.00)
- Comp/xNome: Nome do componente (VALOR FRETE)
- Comp/vComp: Valor do componente (500.00)

### IMP (Impostos)
- ICMS/CST: 90
- ICMS/indSN: 1 (Simples Nacional)
- vTotTrib: 0.00

### INFCARGA (Carga)
- vCarga: Valor da Carga (20607.38)
- proPred: Produto Predominante (INC TEMPERADO COM 3 FUROS)
- xOutCat: Outras Características (KG)
- infQ/tpMed: Tipo Medida (PESO BRUTO)
- infQ/qCarga: Quantidade (5654.1700)
- vCargaAverb: Valor Carga Averbação (20607.38)

### INFDOC (Documentos)
- infNFe/chave: Chave da NFe referenciada

### INFMODAL (Modal)
- rodo/RNTRC: Registro ANTT (55227922)

### COMPL (Complementar)
- xObs: Observações (placa, motorista, apólice)
- ObsCont PLACA: KEI-6C10
- ObsCont CPFMOTORISTA: 04049350955

### PROTCTE (Protocolo)
- nProt: Número do Protocolo (135254264737169)
- dhRecbto: Data Recebimento
- cStat: Status (100=Autorizado)
- xMotivo: Motivo

### Chave de Acesso
- 35251247463376000104570010000021341403369353
