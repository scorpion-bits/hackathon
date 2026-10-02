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

warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }
TOOLS="$ROOT/.tools"   # ferramentas portáteis baixadas sem sudo (fora do git)
ARCH=$(uname -m)
fetch() { # url destino
  if command -v curl >/dev/null; then curl -fsSL "$1" -o "$2"; else wget -qO "$2" "$1"; fi
}

# Python ≥ 3.10 com venv funcionando; senão usa o "uv" (baixado em .tools, sem sudo), que traz o próprio Python.
py_ok() { "$1" -c 'import sys, venv, ensurepip; sys.exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; }
get_uv() {
  [[ -x "$TOOLS/uv" ]] && return
  say "Baixando o uv (gerenciador de Python portátil, sem sudo)"
  mkdir -p "$TOOLS"
  local t="uv-${ARCH/arm64/aarch64}-unknown-linux-gnu"
  fetch "https://github.com/astral-sh/uv/releases/latest/download/$t.tar.gz" "$TOOLS/uv.tgz"
  tar -xzf "$TOOLS/uv.tgz" -C "$TOOLS" && mv "$TOOLS/$t/uv" "$TOOLS/uv" && rm -rf "$TOOLS/$t" "$TOOLS/uv.tgz"
}

# Node ≥ 20; senão baixa o Node 22 oficial para .tools/node (sem sudo).
node_ok() { command -v node >/dev/null && [[ $(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0) -ge 20 ]]; }
get_node() {
  if [[ ! -x "$TOOLS/node/bin/node" ]]; then
    say "Baixando o Node.js 22 portátil para .tools/node (sem sudo)"
    mkdir -p "$TOOLS"
    local a; case "$ARCH" in x86_64) a=x64 ;; aarch64|arm64) a=arm64 ;; *) fail "Arquitetura $ARCH sem Node portátil" ;; esac
    local base="https://nodejs.org/dist/latest-v22.x"
    local file; file=$(fetch "$base/SHASUMS256.txt" /dev/stdout | grep -o "node-v[0-9.]*-linux-$a.tar.xz" | head -1)
    [[ -n "$file" ]] || fail "Não consegui achar o Node para baixar (sem internet?)"
    fetch "$base/$file" "$TOOLS/node.tar.xz"
    rm -rf "$TOOLS/node" && mkdir -p "$TOOLS/node" && tar -xJf "$TOOLS/node.tar.xz" -C "$TOOLS/node" --strip-components=1 && rm "$TOOLS/node.tar.xz"
  fi
  export PATH="$TOOLS/node/bin:$PATH"
}

# ---------- Backend ----------
if [[ $PROTO -eq 0 ]]; then
  VENV=""
  for d in venv .venv; do [[ -x "$d/bin/python" ]] && "$d/bin/python" -c 'import fastapi' 2>/dev/null && VENV="$d" && break; done
  for d in venv .venv; do [[ -z "$VENV" && -x "$d/bin/python" ]] && "$d/bin/python" -m pip --version >/dev/null 2>&1 && VENV="$d"; done
  if [[ -z "$VENV" ]]; then
    rm -rf .venv
    PY=$(command -v python3 || true)
    if [[ -n "$PY" ]] && py_ok "$PY" && "$PY" -m venv .venv 2>/dev/null; then
      say "Ambiente Python criado em .venv ($("$PY" --version))"
    else
      rm -rf .venv
      warn "python3 ausente, antigo (< 3.10) ou sem o módulo venv — usando o uv (sem sudo)"
      get_uv
      "$TOOLS/uv" venv --quiet --seed --python 3.11 .venv || fail "Não consegui criar o ambiente Python"
    fi
    VENV=.venv
  fi
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"

  if changed backend/requirements.txt "$VENV/.agroia-req"; then
    say "Instalando dependências Python"
    python -m pip install -q -r backend/requirements.txt
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

  if [[ $RESET -eq 1 ]]; then
    say "Recriando contas de demonstração (data/app.db)"
    python scripts/seed_demo.py
  else
    # recria sozinho se o banco não existe ou o esquema mudou (SCHEMA_VERSION em backend/app/db.py)
    python scripts/seed_demo.py --if-needed
  fi

  [[ -f .env ]] && { set -a; source .env; set +a; }
fi

# estado da IA a partir do .env (sem expor a chave)
ia_status() {
  local key model
  key=$(grep -hE '^(AGROBITS|AGROIA)_LLM_API_KEY=.+' .env 2>/dev/null | tail -1 | cut -d= -f2-)
  model=$(grep -hE '^(AGROBITS|AGROIA)_LLM_MODEL=.+' .env 2>/dev/null | tail -1 | cut -d= -f2-)
  if [[ -n "$key" && -n "$model" ]]; then echo "IA: ligada ($model)"; else echo "IA: modo offline (sem chave) — veja docs/implementacao/M5-ia.md"; fi
}

# ---------- Frontend ----------
node_ok || { [[ -x "$TOOLS/node/bin/node" ]] && export PATH="$TOOLS/node/bin:$PATH"; }
node_ok || { warn "Node.js ausente ou antigo (precisa ≥ 20)"; get_node; }
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
echo "   $(ia_status)"
if [[ $PROTO -eq 0 ]]; then
  echo "   App funcional:     http://localhost:5173"
  echo "   API (docs):        http://localhost:8000/docs"
fi
echo
if command -v xdg-open >/dev/null; then xdg-open http://localhost:5173/prototipo >/dev/null 2>&1 || true; fi

wait -n 2>/dev/null || wait
