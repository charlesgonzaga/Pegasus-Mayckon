# Análise do PDF CT-e Relatório

## Problemas encontrados:
1. **Páginas em branco**: Páginas 4, 5 e 6 estão em branco - só têm "Página X de 3 | LAN7 - Pegasus" no topo
   - O rodapé diz "Página 1 de 3" mas o PDF tem 6 páginas
   - As 3 páginas extras são criadas pelo switchToPage que adiciona o rodapé em páginas novas em vez de nas existentes
   - O bug: `doc.switchToPage(p)` com `p` baseado em 0, mas o `bufferedPageRange()` retorna `count: 3` e `start: 0`, então itera 0,1,2 mas as páginas reais são 0,1,2 - OK
   - O REAL problema: ao escrever o rodapé com `doc.text()` após switchToPage, o texto está sendo escrito fora da área visível ou criando novas páginas
   - Posição do rodapé: `doc.page.height - 25` = ~570 (landscape A4 height) - pode estar causando overflow

2. **Filtro de empresa não funciona**: Selecionou BRAVAMED mas veio de todas as transportadoras
   - O PDF mostra múltiplos emitentes: ITAJAI-EXPRESSO, BRASPRESS, CDC CARGAS, etc.
   - O filtro clienteId filtra por cliente (quem contratou), não por emitente da transportadora
   - O campo "Empresa" no frontend se refere ao cliente da contabilidade, não ao emitente do CT-e

3. **Relatórios precisam ser dinâmicos**: filtrar por cliente, emitente, modal, direção (tomador/terceiro)
