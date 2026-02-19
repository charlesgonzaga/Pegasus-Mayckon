# Análise DACTE Oficial - meudanfe.com.br

## Diferenças encontradas entre o nosso DACTE e o oficial:

### 1. RECIBO (topo)
- Oficial: "DECLARO QUE RECEBI OS VOLUMES..." em caixa com bordas
- Oficial: NOME e RG em linhas separadas, ASSINATURA/CARIMBO abaixo
- Oficial: TÉRMINO DA PRESTAÇÃO - DATA/HORA e INÍCIO DA PRESTAÇÃO - DATA/HORA
- Oficial: CT-E com Nº. 162.971.128 e Série 157 (número formatado com pontos)
- **Nosso**: Número sem formatação de pontos

### 2. CABEÇALHO
- Oficial: Emitente à esquerda SEM borda (fundo cinza claro)
- Oficial: DACTE no centro com "Documento Auxiliar do Conhecimento de Transporte Eletrônico" por extenso
- Oficial: MODELO | SÉRIE | NÚMERO | FL | DATA E HORA DE EMISSÃO | INSC.SUF.DO DEST
- Oficial: QR Code à direita (grande, bem visível)
- Oficial: CHAVE DE ACESSO com formatação espaçada
- Oficial: "Consulta em http://www.cte.fazenda.gov.br/portal"
- **Nosso**: Layout similar mas QR Code não aparece em alguns casos

### 3. TIPO DO CTE / SERVIÇO
- Oficial: TIPO DO CTE | TIPO DO SERVIÇO | CHAVE DE ACESSO (com barcode acima)
- Oficial: IND.DO CT-E GLOBALIZADO com checkboxes [ ] SIM [X] NÃO
- Oficial: INF.DO CT-E GLOBALIZADO ao lado
- **Nosso**: Similar

### 4. CFOP
- Oficial: "CFOP - NATUREZA DA PRESTAÇÃO" (label completo)
- Oficial: "5353 - PRESTAÇÕES DE SERVIÇOS DE TRANSPORTE" (CFOP + descrição)
- Oficial: PROTOCOLO DE AUTORIZAÇÃO DE USO com número + data
- **Nosso**: Similar mas sem descrição do CFOP

### 5. INÍCIO/TÉRMINO PRESTAÇÃO
- Oficial: Cidades em negrito
- **Nosso**: Similar

### 6. REMETENTE / DESTINATÁRIO
- Oficial: Labels em NEGRITO (REMETENTE, ENDEREÇO, MUNICÍPIO, CNPJ/CPF, PAÍS)
- Oficial: Dados ao lado dos labels (não abaixo)
- Oficial: Layout lado a lado com bordas
- Oficial: CEP alinhado à direita
- Oficial: INSCRIÇÃO ESTADUAL como label (não IE)
- **Nosso**: Layout similar mas labels diferentes

### 7. EXPEDIDOR / RECEBEDOR
- Oficial: Mesmo layout que Remetente/Destinatário
- Oficial: Mostra mesmo quando vazio (com vírgula e traço)

### 8. TOMADOR DO SERVIÇO
- Oficial: Largura total, com MUNICÍPIO, UF, CEP na mesma linha
- Oficial: CNPJ/CPF e INSCRIÇÃO ESTADUAL na mesma linha
- Oficial: PAÍS e FONE na mesma linha

### 9. PRODUTO PREDOMINANTE
- Oficial: PRODUTO PREDOMINANTE | OUTRAS CARACTERÍSTICAS DA CARGA | VALOR TOTAL DA CARGA
- Oficial: PESO BRUTO (KG) | PESO BASE CÁLCULO (KG) | PESO AFERIDO (KG) | CUBAGEM(M3) | QTDE(VOL)

### 10. COMPONENTES DO VALOR
- Oficial: Tabela 3x2 (NOME | VALOR repetido 3x)
- Oficial: VALOR TOTAL DO SERVIÇO e VALOR A RECEBER à direita

### 11. INFORMAÇÕES RELATIVAS AO IMPOSTO
- Oficial: SITUAÇÃO TRIBUTÁRIA | BASE DE CALCULO | ALÍQ ICMS | VALOR ICMS | % RED. BC ICMS | VALOR ICMS ST
- **Nosso**: Falta coluna VALOR ICMS ST

### 12. DOCUMENTOS ORIGINÁRIOS
- Oficial: TIPO DOC | CNPJ/CHAVE/OBS | SÉRIE/NRO. DOCUMENTO (repetido 2x)

### 13. OBSERVAÇÕES GERAIS
- Oficial: Área grande para observações

### 14. DADOS ESPECÍFICOS DO MODAL RODOVIÁRIO
- Oficial: RNTRC DA EMPRESA em negrito grande
- Oficial: "ESTE CONHECIMENTO DE TRANSPORTE ATENDE À LEGISLAÇÃO DE TRANSPORTE RODOVIÁRIO EM VIGOR"

### 15. RODAPÉ
- Oficial: USO EXCLUSIVO DO EMISSOR DO CT-E | RESERVADO AO FISCO
- Oficial: "o valor aproximado de tributos incidentes sobre o preço deste serviço é de R$3,05"
- Oficial: "Impresso em 19/02/2026 09:41:59"

## Conclusão
O nosso DACTE já está muito próximo do oficial. As principais diferenças são cosméticas:
1. Falta formatação do número com pontos (162.971.128)
2. Falta coluna VALOR ICMS ST
3. Falta texto "ESTE CONHECIMENTO DE TRANSPORTE ATENDE À LEGISLAÇÃO..."
4. Falta "Impresso em DD/MM/YYYY HH:MM:SS" no rodapé
5. Labels usam "IE" em vez de "INSCRIÇÃO ESTADUAL"
6. QR Code precisa ser maior e mais visível
