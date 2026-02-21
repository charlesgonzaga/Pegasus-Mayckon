# 📋 Retrospectiva — Deploy Pegasus em VPS com Docker

**Data:** 20/02/2026  
**Objetivo:** Containerizar o projeto Pegasus (Gestão NFSe e CT-e) e colocá-lo em funcionamento em uma VPS Linux Ubuntu com Docker.

**Atualizado em:** 20/02/2026 — Revisão pós-mudanças do projeto (storage local, remoção de variáveis opcionais, entry point atualizado)

---

## O que foi feito

### 1. Análise do projeto

Antes de criar qualquer artefato, o projeto foi analisado em profundidade:

- **Stack:** Node.js (pnpm) + React 19 / Vite / TailwindCSS (frontend) + Express / tRPC (backend)
- **Banco de dados:** MySQL via Drizzle ORM, com migrations SQL na pasta `drizzle/`
- **Entry point do servidor:** `server/_core/index.ts` → compilado para `dist/index.js`
- **Dependência nativa crítica:** `chartjs-node-canvas` usa a biblioteca `canvas`, que requer compilação de código nativo C++ (`cairo`, `pango`, `libjpeg` etc.)
- **Gerenciador de pacotes:** `pnpm@10.4.1` com patch customizado do `wouter@3.7.1`
- **Build:** dois passos — `vite build` (frontend → `dist/public/`) + `esbuild` (backend → `dist/index.js`)
- **Storage:** armazenamento local de arquivos na pasta `pegasus_storage/` (sem dependência de S3 ou storage externo)
- **Variáveis de ambiente obrigatórias:** `DATABASE_URL`, `JWT_SECRET`, `PORT`, `MYSQL_*`
- **Variáveis opcionais/não usadas:** `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` — **removidas dos artefatos Docker**

---

### 2. Artefatos criados/atualizados

| Arquivo | Descrição |
|---------|-----------|
| `Dockerfile` | Multi-stage build (4 estágios), com VOLUME para `pegasus_storage/` |
| `docker-compose.yml` | Orquestra app + MySQL 8.0, com volume nomeado `pegasus_storage` |
| `.dockerignore` | Otimiza contexto de build, exclui `pegasus_storage/` e `docs/` |
| `.env.example` | Template limpo com apenas variáveis obrigatórias |
| `docs/DEPLOY_VPS.md` | Guia passo a passo atualizado |

---

### 3. Dockerfile — decisões técnicas

Foram usados **4 estágios** (multi-stage build):

1. **`base`** — Node 20 Alpine com dependências nativas para compilar o `canvas`
2. **`deps`** — Instala todos os pacotes com `pnpm install --frozen-lockfile`
3. **`build`** — Gera o bundle de produção (`vite build` + `esbuild` via `pnpm run build`)
4. **`production`** — Imagem final leve com apenas runtime, sem compiladores; inclui `VOLUME ["/app/pegasus_storage"]` para persistência de arquivos

A escolha do **Node 20 Alpine** foi por ser a imagem mais leve compatível com o pnpm 10.x e as dependências nativas exigidas.

---

## Problemas encontrados e soluções

### ⚠️ Problema 1: Porta 3306 já ocupada na VPS

**Sintoma:**
```
Bind for :::3306 failed: port is already allocated
```

**Causa:** A VPS já possuía outro servidor MySQL rodando, e o `docker-compose.yml` original tentava publicar a porta `3306:3306`.

**Solução:** Remover o mapeamento `ports` do serviço `db`. Como o app e o banco se comunicam dentro da rede Docker interna, a porta não precisa ser exposta externamente. Bastou rodar `docker compose down` e `docker compose up -d` novamente — sem rebuildar.

---

### ⚠️ Problema 2: `npx drizzle-kit migrate` roda silenciosamente sem aplicar nada

**Sintoma:** O comando executava mas não exibia nenhuma saída de migration, terminando rapidamente como se não houvesse nada a fazer.

**Causa:** O `npx` busca o `drizzle-kit` pelo caminho errado dentro do container pnpm.

**Solução:** Usar o script do projeto diretamente via `pnpm`:
```bash
docker compose exec app pnpm db:push
```
Esse comando executa internamente `drizzle-kit generate && drizzle-kit migrate`, com saída correta confirmando as migrations.

---

### ⚠️ Problema 3: Seed do admin falha na primeira inicialização

**Sintoma:** Nos logs do container:
```
[Seed] Erro ao criar admin: Failed query: select ... from `users` ...
```

**Causa:** O app executa o seed do admin **2 segundos após iniciar** (setTimeout no `server/_core/index.ts`). Na primeira vez, as tabelas ainda não existem porque as migrations não foram aplicadas.

**Solução:** Após aplicar as migrations com `pnpm db:push`, reiniciar o container:
```bash
docker compose restart app
```
No próximo boot, as tabelas já existem e o seed cria o admin com sucesso.

---

### ⚠️ Problema 4: Credenciais de admin desconhecidas

**Sintoma:** Tela de login exibindo "E-mail ou senha incorretos".

**Causa:** O `seed-admin.mjs` (script avulso legado) usa credenciais diferentes das credenciais hardcoded em `server/_core/index.ts`.

**As credenciais corretas do admin padrão são:**
- **E-mail:** `pegasus@lan7.com.br`
- **Senha:** `g08120812`

---

### ⚠️ Problema 5: Arquivos gerados não persistem após restart (storage local)

**Sintoma:** XMLs, PDFs e ZIPs gerados pelo sistema desaparecem após `docker compose down && up`.

**Causa:** O diretório `pegasus_storage/` é criado dentro do container mas não está mapeado para um volume externo.

**Solução:** O `Dockerfile` declara `VOLUME ["/app/pegasus_storage"]` e o `docker-compose.yml` mapeia para o volume nomeado `pegasus_storage`. Com isso, os arquivos persistem entre reinícios e atualizações do container.

---

### ℹ️ Observação: `JWSSignatureVerificationFailed` nos logs

**Sintoma:**
```
[Auth] Session verification failed JWSSignatureVerificationFailed: signature verification failed
```

**Causa:** O navegador ainda tinha cookies de sessão assinados com um JWT_SECRET diferente (do ambiente de desenvolvimento). Não é um erro crítico.

**Solução:** Fazer logout no navegador ou limpar os cookies. Os erros desaparecem automaticamente.

---

## Fluxo correto de deploy (resumido)

```bash
# 1. Configurar variáveis
cp .env.example .env && nano .env
# Atenção: DATABASE_URL deve usar "db" como host (nome do serviço Docker)
# Exemplo: mysql://pegasus:senha@db:3306/pegasus

# 2. Build e start
docker compose build
docker compose up -d

# 3. Aguardar MySQL ficar healthy (~30s)
docker compose ps

# 4. Migrations (usar pnpm, não npx!)
docker compose exec app pnpm db:push

# 5. Restart para o seed criar o admin
docker compose restart app

# 6. Verificar
docker compose logs app --tail 20
# Deve conter: [Seed] Admin criado: pegasus@lan7.com.br
```

---

## Mudanças do projeto que impactaram os artefatos Docker

| Mudança no projeto | Impacto nos artefatos |
|-------------------|----------------------|
| Storage migrado para local (`pegasus_storage/`) | Adicionado `VOLUME` no Dockerfile e volume nomeado no compose |
| Variáveis `BUILT_IN_FORGE_API_*` removidas | Removidas do `docker-compose.yml` e do `.env.example` |
| Variáveis de OAuth (`VITE_APP_ID` etc.) não usadas | Removidas do `docker-compose.yml` e `.env.example` |
| Entry point: `server/_core/index.ts` | Comentários do Dockerfile atualizados |
| `db:push` = `drizzle-kit generate && drizzle-kit migrate` | Documentação atualizada |

---

## Lições aprendidas

- **Dependências nativas (canvas) em Alpine:** É necessário instalar runtime libs (`cairo`, `pango`, etc.) tanto no stage de build quanto na imagem de produção — no build para compilar, no runtime para executar.
- **`npx` vs script do projeto:** Em containers com pnpm, prefira sempre usar os scripts definidos no `package.json` via `pnpm run <script>` em vez de `npx <ferramenta>` diretamente.
- **Ordem de inicialização:** Em apps que fazem seed na inicialização, as migrations devem ser aplicadas antes do primeiro boot completo, ou o container deve ser reiniciado após as migrations.
- **Nunca expor a porta do banco desnecessariamente:** O banco de dados não precisa de porta exposta se só é acessado pela própria aplicação.
- **Volumes para dados persistentes:** Qualquer dado gerado em runtime (arquivos, uploads) deve ser mapeado para um volume Docker; caso contrário, é perdido no `down`.
- **HOST do banco no Docker:** Ao usar Docker Compose, o host da `DATABASE_URL` deve ser o nome do serviço (`db`), não `localhost`.
