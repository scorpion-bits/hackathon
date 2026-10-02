#!/usr/bin/env bash
# Sobe o AgroBits localmente (API + interface) com um comando só.
#
#   ./dev.sh            API (8000) + interface (5173)
#   ./dev.sh --proto    só a interface — basta para o protótipo em /prototipo
#   ./dev.sh --reset    recria a propriedade de demonstração antes de subir
#   ./dev.sh --sync     confere no portal do MAPA se as bases mudaram (baixa só o que mudou)
#
# Na primeira vez cria o venv, instala dependências e gera os bancos; depois só sobe.
# Ctrl+C derruba tudo.
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$PWD"

PROTO=0; RESET=0; SYNC=0
for arg in "$@"; do
  case "$arg" in
    --proto) PROTO=1 ;;
    --reset) RESET=1 ;;
    --sync) SYNC=1 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $arg (use --help)"; exit 1 ;;
  esac
done

say() { printf '\033[1;32m▶ %s\033[0m\n' "$*"; }

# Atualiza só quando o arquivo de dependências muda (guarda um carimbo com o hash).
changed() { # $1 = arquivo de dependências, $2 = carimbo
  local h; h=$(sha1sum "$1" | cut -d' ' -f1)
  [[ -f "$2" && "$(cat "$2")" == "$h" ]] && return 1
  echo "$h" > "$2.new"; return 0
}

# ---------- Backend ----------
if [[ $PROTO -eq 0 ]]; then
  VENV=""
  for d in venv .venv; do [[ -f "$d/bin/activate" ]] && VENV="$d" && break; done
  if [[ -z "$VENV" ]]; then
    say "Criando ambiente Python em .venv"
    python3 -m venv .venv; VENV=.venv
  fi
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"

  if changed backend/requirements.txt "$VENV/.agroia-req"; then
    say "Instalando dependências Python"
    pip install -q -r backend/requirements.txt
    mv "$VENV/.agroia-req.new" "$VENV/.agroia-req"
  fi

  if [[ ! -f data/opendata.db ]]; then
    say "Gerando data/opendata.db a partir dos dados abertos (~2 min, só na primeira vez)"
    python scripts/pipeline_opendata.py
  fi

  if [[ $SYNC -eq 1 ]]; then
    say "Conferindo dados abertos no portal do MAPA"
    python scripts/fetch_opendata.py || echo "  (portal indisponível — seguindo com os dados locais)"
  fi

  if [[ $RESET -eq 1 || ! -f data/app.db ]]; then
    say "Criando propriedade de demonstração (data/app.db)"
    python scripts/seed_demo.py
  fi

  [[ -f .env ]] && { set -a; source .env; set +a; }
fi

# ---------- Frontend ----------
if [[ ! -d frontend/node_modules ]] || changed frontend/package-lock.json frontend/node_modules/.agroia-lock; then
  say "Instalando dependências da interface (npm install)"
  (cd frontend && npm install --no-audit --no-fund)
  [[ -f frontend/node_modules/.agroia-lock.new ]] && mv frontend/node_modules/.agroia-lock.new frontend/node_modules/.agroia-lock
  [[ -f frontend/node_modules/.agroia-lock ]] || sha1sum frontend/package-lock.json | cut -d' ' -f1 > frontend/node_modules/.agroia-lock
fi

# ---------- Subir ----------
PIDS=()
cleanup() {
  trap - INT TERM EXIT
  echo; say "Encerrando..."
  for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

if [[ $PROTO -eq 0 ]]; then
  (cd "$ROOT/backend" && exec uvicorn app.main:app --reload --port 8000) &
  PIDS+=($!)
fi
(cd "$ROOT/frontend" && exec npm run dev -- --port 5173) &
PIDS+=($!)

sleep 3
echo
say "Pronto! (Ctrl+C para parar)"
echo "   Protótipo visual:  http://localhost:5173/prototipo"
if [[ $PROTO -eq 0 ]]; then
  echo "   App funcional:     http://localhost:5173"
  echo "   API (docs):        http://localhost:8000/docs"
fi
echo

wait -n 2>/dev/null || wait
