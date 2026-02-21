#!/bin/sh
# ==============================================================================
# entrypoint.sh - Script de inicialização do container Pegasus
# 1. Aguarda MySQL estar pronto (verificação TCP simples)
# 2. Aplica migrations pendentes automaticamente
# 3. Inicia o servidor Node.js
# ==============================================================================
set -e

echo "[Entrypoint] Iniciando Pegasus..."

# Extrair host e porta do DATABASE_URL para o check TCP
# Formato esperado: mysql://user:pass@host:port/db
DB_HOST=$(echo "$DATABASE_URL" | sed 's|.*@\([^:]*\):.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed 's|.*:\([0-9]*\)/.*|\1|')

echo "[Entrypoint] Aguardando MySQL em ${DB_HOST}:${DB_PORT}..."

TIMEOUT=60
ELAPSED=0

until node -e "
const net = require('net');
const s = net.createConnection(${DB_PORT}, '${DB_HOST}');
s.on('connect', () => { s.destroy(); process.exit(0); });
s.on('error', () => { s.destroy(); process.exit(1); });
setTimeout(() => { s.destroy(); process.exit(1); }, 2000);
" 2>/dev/null; do
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "[Entrypoint] ERRO: MySQL não ficou disponível em ${TIMEOUT}s. Abortando."
    exit 1
  fi
  echo "[Entrypoint] MySQL não disponível ainda, aguardando 3s... (${ELAPSED}s/${TIMEOUT}s)"
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

echo "[Entrypoint] MySQL disponível!"

# Aplicar migrations via drizzle-orm
echo "[Entrypoint] Aplicando migrations..."
node /app/run-migrations.mjs

# Iniciar servidor Node.js
echo "[Entrypoint] Iniciando servidor..."
exec node /app/dist/index.js
