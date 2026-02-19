# Pesquisa: APIs para Download de DACTE PDF

## Opções encontradas:

### 1. meudanfe.com.br
- Converte XML de CT-e para DACTE em PDF gratuitamente
- Tem API REST para integração
- Aceita: chave de acesso OU XML do CT-e
- Gera o DACTE no formato oficial

### 2. Portal SEFAZ (cte.fazenda.gov.br)
- Consulta pública com reCAPTCHA (não automatizável facilmente)
- Não tem API pública para download de DACTE PDF
- Apenas consulta visual no browser

### 3. SEFAZ-SP (nfe.fazenda.sp.gov.br/cteconsulta)
- Consulta pública de CT-e
- Tem opção "Consulta para Impressão" que gera o DACTE
- Requer reCAPTCHA

### 4. danfeonline.com.br
- Gera DACTE grátis a partir do XML
- Possível API

### Melhor abordagem:
Como já temos o XML do CT-e salvo no banco, a melhor opção é:
1. Usar uma API como meudanfe.com.br para converter XML → DACTE PDF
2. OU gerar localmente com PDFKit replicando o layout oficial exatamente
3. OU usar a consulta da SEFAZ-SP que tem endpoint para impressão

A SEFAZ não disponibiliza API pública direta para gerar DACTE.
O DACTE é gerado a partir do XML - não existe um "DACTE oficial" baixável da SEFAZ.
O que os portais fazem é renderizar o XML no formato DACTE padrão.
