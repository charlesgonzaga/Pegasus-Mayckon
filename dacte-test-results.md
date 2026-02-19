# DACTE Test Results - XML Real

## Dados Extraídos Corretamente:
- Emitente: VIA GLASS TRANSPORTES LTDA (CNPJ, IE, endereço completo)
- Remetente: NEW GLASS IMPORTACAO E EXPORTACAO LTDA (CNPJ, IE, endereço)
- Destinatário: QUALYVAX PROJETOS E ESQUADRIAS LTDA (CNPJ, IE, endereço)
- Tomador: DESTINATÁRIO (com dados completos)
- Número CT-e: 2134, Série: 1, Modelo: 57
- CFOP: 6932
- Modal: RODOVIÁRIO
- Protocolo: 135254264737169
- Produto: INC TEMPERADO COM 3 FUROS
- Peso Bruto: 5.654,1700 KG
- Valor Carga: R$ 20.607,38
- Valor Frete: R$ 500,00
- RNTRC: 55227922
- Observações: Veículo KEI-6C10, Motorista EVALDO WAGNER MARTINS
- Documento NFe referenciado: chave completa
- Código de barras: presente
- QR Code: ausente (não apareceu na imagem)

## Problema Encontrado:
- O QR Code não apareceu no PDF (pode ser que a área esteja muito pequena ou o QR Code falhou)
- O problema original (dados vazios) era porque o XML estava em base64+gzip e não era decodificado

## Correção Aplicada:
- Adicionado decodeCteXml() antes de chamar generateDactePdf() na procedure generateDacte
- Limpados os DACTEs cacheados no banco para forçar regeneração
