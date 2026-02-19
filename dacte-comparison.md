# Comparação DACTE: meudanfe.com.br vs Gerado por Manus

## Diferenças identificadas:

### 1. CABEÇALHO
- **Oficial**: QR Code GRANDE ao lado direito do código de barras
- **Manus**: SEM QR Code visível
- **Oficial**: Número "Nº. 162.971.128" com pontos e "Série 157"
- **Manus**: "Nº DOCUMENTO: 162971128" sem pontos, "SÉRIE: 157"
- **Oficial**: "INSC.SUF.DO DEST" ao lado da data
- **Manus**: "SUFRAMA" label
- **Oficial**: FL "1/1" como campo separado
- **Manus**: FL como campo separado (OK)

### 2. TIPO CT-e / SERVIÇO
- **Oficial**: 4 colunas: TIPO DO CTE | TIPO DO SERVIÇO | (vazio) | (vazio) com labels embaixo
- **Manus**: 4 colunas: TIPO DO CT-E | TIPO DO SERVIÇO | TOMADOR DO SERVIÇO | PROTOCOLO - OK mas labels diferentes
- **Oficial**: "TOMADOR DO SERVIÇO" e "FORMA DE PAGAMENTO" em linha separada abaixo
- **Manus**: Tomador na mesma linha

### 3. IND.DO CT-E GLOBALIZADO
- **Oficial**: Checkboxes "SIM [ ] M [ ] X NÃO" com "INF.DO CT-E GLOBALIZADO" ao lado
- **Manus**: Checkboxes "S [ ] M [X] NÃO" - OK mas layout diferente

### 4. CFOP
- **Oficial**: "CFOP - NATUREZA DA PRESTAÇÃO" com código e descrição na mesma célula
- **Manus**: "CFOP - NATUREZA DA PRESTAÇÃO" - OK

### 5. PROTOCOLO
- **Oficial**: "PROTOCOLO DE AUTORIZAÇÃO DE USO" com número e data
- **Manus**: "PROTOCOLO DE AUTORIZAÇÃO DE USO" - OK

### 6. REMETENTE / DESTINATÁRIO
- **Oficial**: Layout com labels inline: "REMETENTE", "ENDEREÇO", "MUNICÍPIO", "CEP", "CNPJ/CPF", "INSCRIÇÃO ESTADUAL", "FONE", "PAÍS"
- **Manus**: Layout similar mas labels como "IE:" em vez de "INSCRIÇÃO ESTADUAL"
- **Oficial**: CEP alinhado à direita
- **Manus**: CEP alinhado à direita - OK

### 7. EXPEDIDOR / RECEBEDOR
- **Oficial**: Mesmo layout que Remetente/Destinatário com labels inline
- **Manus**: Layout similar - OK mas pode ter diferenças de espaçamento

### 8. TOMADOR DO SERVIÇO
- **Oficial**: Layout com ENDEREÇO, MUNICÍPIO, UF, CEP em linha, CNPJ/CPF, INSCRIÇÃO ESTADUAL, PAÍS, FONE
- **Manus**: Layout similar - OK

### 9. PESOS
- **Oficial**: "PESO AFERIDO (KG)" 
- **Manus**: "PESO CALCULADO (KG)" - ERRADO, deveria ser PESO AFERIDO

### 10. IMPOSTOS
- **Oficial**: "SITUAÇÃO TRIBUTÁRIA" | "BASE DE CALCULO" | "ALÍQ ICMS" | "VALOR ICMS" | "% RED. BC ICMS" | "VALOR ICMS ST"
- **Manus**: "CLASSIFICAÇÃO TRIBUTÁRIA DO SERVIÇO" | "BASE DE CÁLCULO" | "ALÍQUOTA DO ICMS" | "VALOR DO ICMS" | "% RED BC CALC"
- **Diferenças**: Labels diferentes, falta coluna "VALOR ICMS ST"

### 11. DOCUMENTOS ORIGINÁRIOS
- **Oficial**: 2 colunas lado a lado: "TIPO DOC" | "CNPJ/CHAVE/OBS" | "SÉRIE/NRO. DOCUMENTO"
- **Manus**: "DOC." | "CNPJ/CPF/CHAVE" | "SÉRIE/Nº DOCUMENTO" - Labels ligeiramente diferentes

### 12. OBSERVAÇÕES
- **Oficial**: "OBSERVAÇÕES GERAIS" - seção grande
- **Manus**: "OBSERVAÇÕES GERAIS" - OK

### 13. MODAL RODOVIÁRIO
- **Oficial**: "DADOS ESPECÍFICOS DO MODAL RODOVIÁRIO" com RNTRC e texto legislação
- **Manus**: "INFORMAÇÕES ESPECÍFICAS DO MODAL RODOVIÁRIO" - label diferente

### 14. RODAPÉ
- **Oficial**: "USO EXCLUSIVO DO EMISSOR DO CT-E" | "RESERVADO AO FISCO" com texto tributos
- **Manus**: Similar mas sem texto tributos
- **Oficial**: "Impresso em 19/02/2026 09:41:59" no rodapé
- **Manus**: "Código: 2802796" no rodapé

## RESUMO DAS CORREÇÕES NECESSÁRIAS:
1. Adicionar QR Code grande no cabeçalho
2. Número formatado "Nº. 162.971.128" com pontos
3. Label "PESO AFERIDO" em vez de "PESO CALCULADO"
4. Label "SITUAÇÃO TRIBUTÁRIA" em vez de "CLASSIFICAÇÃO TRIBUTÁRIA DO SERVIÇO"
5. Adicionar coluna "VALOR ICMS ST"
6. Label "DADOS ESPECÍFICOS DO MODAL RODOVIÁRIO"
7. Texto tributos no rodapé: "o valor aproximado de tributos..."
8. Data de impressão no rodapé
9. Labels mais curtos nos impostos: "ALÍQ ICMS", "VALOR ICMS", "% RED. BC ICMS"
