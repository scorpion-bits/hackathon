#!/bin/sh
# Instala dependências só quando o package-lock.json muda (node_modules fica num volume do Docker) e sobe o Vite.
set -e
cd /app
HASH=$(sha1sum package-lock.json | cut -d' ' -f1)
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$HASH" ]; then
  echo "▶ Instalando dependências da interface (npm ci)"
  npm ci --no-audit --no-fund
  echo "$HASH" > node_modules/.lock-hash
fi
exec npx vite --host 0.0.0.0 --port 5173
