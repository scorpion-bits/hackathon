#!/bin/sh
# Prepara os bancos só quando faltam (ficam em ./data, no seu computador) e sobe a API.
set -e
cd /app
if [ ! -f data/opendata.db ]; then
  echo "▶ Gerando data/opendata.db a partir dos dados abertos (~2 min, só na primeira vez)"
  python scripts/pipeline_opendata.py
fi
if [ "${SYNC:-0}" = "1" ]; then
  echo "▶ Conferindo dados abertos no portal do MAPA"
  python scripts/fetch_opendata.py || echo "  (portal indisponível — seguindo com os dados locais)"
fi
if [ "${RESET:-0}" = "1" ] || [ ! -f data/app.db ]; then
  echo "▶ Criando propriedade de demonstração (data/app.db)"
  python scripts/seed_demo.py
fi
cd backend
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir /app/backend
