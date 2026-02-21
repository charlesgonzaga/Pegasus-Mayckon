# ==============================================================================
# Dockerfile - Pegasus (Gestão NFSe e CT-e)
# Multi-stage build para aplicação fullstack Node.js (React + Express/tRPC)
# Entry point: server/_core/index.ts → dist/index.js
# ==============================================================================

# --- Stage 1: Base com dependências nativas ---
FROM node:20-alpine AS base

# Dependências nativas para compilar 'canvas' (chartjs-node-canvas)
RUN apk add --no-cache \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    python3 \
    g++ \
    make \
    pkgconf

# Habilitar pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# --- Stage 2: Instalar dependências (todas, incluindo devDeps para o build) ---
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Instala todas as dependências (incluindo devDeps necessárias para o build)
RUN pnpm install --frozen-lockfile

# --- Stage 3: Build da aplicação ---
FROM deps AS build

COPY . .

# Build do frontend (Vite) e backend (esbuild via script "build")
# Resultado: dist/public/ (frontend) + dist/index.js (backend)
RUN pnpm run build

# --- Stage 4: Instalar apenas dependências de produção ---
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Instalar SOMENTE as dependências de produção (sem devDeps)
RUN pnpm install --frozen-lockfile --prod

# --- Stage 5: Imagem de produção ---
FROM node:20-alpine AS production

# Dependências de runtime para 'canvas' (sem compiladores)
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman \
    fontconfig \
    ttf-freefont

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copiar package.json e lockfile
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Copiar somente as dependências de produção
COPY --from=prod-deps /app/node_modules ./node_modules

# Copiar build compilado (frontend + backend)
COPY --from=build /app/dist ./dist

# Copiar migrations do Drizzle (aplicadas em runtime pelo run-migrations.mjs)
COPY drizzle/ ./drizzle/

# Copiar shared types (usados pelo backend em produção)
COPY shared/ ./shared/

# Script de migrations standalone
COPY run-migrations.mjs ./

# Script de entrypoint (aguarda MySQL, roda migrations, inicia servidor)
COPY entrypoint.sh ./
RUN chmod +x /app/entrypoint.sh

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Volume para persistência dos arquivos gerados (XMLs, PDFs, ZIPs)
VOLUME ["/app/pegasus_storage"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD wget -qO- http://localhost:3000/ || exit 1

# Iniciar via entrypoint: aguarda DB → migrations → servidor
CMD ["/app/entrypoint.sh"]
