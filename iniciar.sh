#!/usr/bin/env bash
# AgroBits — sobe tudo com Docker (Linux / macOS).
#
#   ./iniciar.sh              sobe API + interface e abre o navegador
#   ./iniciar.sh atualizar    git pull + sobe
#   ./iniciar.sh resetar      recria a propriedade de demonstração e sobe
#   ./iniciar.sh sincronizar  confere o portal do MAPA (baixa só o que mudou) e sobe
#   ./iniciar.sh logs         mostra os logs ao vivo (Ctrl+C sai dos logs, não derruba)
#   ./iniciar.sh parar        derruba tudo
#   ./iniciar.sh sem-docker   força o modo sem Docker (também é automático se o Docker não estiver disponível)
#
# Sem Docker, chama o ./dev.sh: não precisa de sudo (baixa Node/Python portáteis em .tools/ se faltarem).
set -euo pipefail
cd "$(dirname "$0")"

say()  { printf '\033[1;32m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# ---------- sem Docker: usa o ./dev.sh (mesmas opções) ----------
sem_docker() {
  printf '\033[1;33m! %s\033[0m\n' "$1 — subindo SEM Docker (./dev.sh). Ctrl+C para parar."
  case "${2:-}" in
    atualizar|update) git pull --no-rebase || fail "git pull falhou (alterações locais? rode: git stash -u)"; exec ./dev.sh ;;
    resetar|reset) exec ./dev.sh --reset ;;
    sincronizar|sync) exec ./dev.sh --sync ;;
    parar|stop|logs) echo "No modo sem Docker tudo roda no terminal: use Ctrl+C nele para parar."; exit 0 ;;
    *) exec ./dev.sh ;;
  esac
}
[[ "${1:-}" == "sem-docker" ]] && sem_docker "Modo sem Docker escolhido" "${2:-}"
command -v docker >/dev/null || sem_docker "Docker não encontrado" "${1:-}"
docker compose version >/dev/null 2>&1 || sem_docker "Docker Compose não encontrado" "${1:-}"
docker info >/dev/null 2>&1 || sem_docker "Docker sem permissão ou parado" "${1:-}"

# Bancos criados pelo container ficam com o SEU usuário (não root) — dá para alternar com o ./dev.sh
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"
export RESET=0 SYNC=0

case "${1:-}" in
  parar|stop)  docker compose down; say "Tudo parado."; exit 0 ;;
  logs)        exec docker compose logs -f --tail 50 ;;
  atualizar|update)
    say "Atualizando o código (git pull)"
    git pull --no-rebase || fail "git pull falhou — veja a mensagem acima (alterações locais? rode: git stash -u)" ;;
  resetar|reset)        RESET=1 ;;
  sincronizar|sync)     SYNC=1 ;;
  ""|subir|up) ;;
  -h|--help|ajuda) sed -n '2,13p' "$0"; exit 0 ;;
  *) fail "Opção desconhecida: $1 (use ./iniciar.sh ajuda)" ;;
esac

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  say "Preparando os containers (a 1ª vez demora alguns minutos; depois é rápido)"
  docker compose build
fi
say "Subindo API e interface"
docker compose up -d --force-recreate --no-build

# espera responder (1ª vez a interface instala dependências e a API pode gerar os bancos)
printf '  aguardando'
ok=0
for _ in $(seq 1 180); do
  if curl -fsS -o /dev/null http://localhost:8000/api/farm 2>/dev/null && curl -fsS -o /dev/null http://localhost:5173/ 2>/dev/null; then ok=1; break; fi
  printf '.'; sleep 2
done
echo
[[ $ok == 1 ]] || { docker compose logs --tail 30; fail "Não respondeu em 6 minutos — veja os logs acima (./iniciar.sh logs)."; }

# estado da IA a partir do .env (sem expor a chave)
ia_status() {
  local key model
  key=$(grep -hE '^(AGROBITS|AGROIA)_LLM_API_KEY=.+' .env 2>/dev/null | tail -1 | cut -d= -f2-)
  model=$(grep -hE '^(AGROBITS|AGROIA)_LLM_MODEL=.+' .env 2>/dev/null | tail -1 | cut -d= -f2-)
  if [[ -n "$key" && -n "$model" ]]; then echo "IA: ligada ($model)"; else echo "IA: modo offline (sem chave) — veja docs/implementacao/M5-ia.md"; fi
}

URL="http://localhost:5173"
say "Pronto!"
echo "   Protótipo:  $URL"
echo "   App:        http://localhost:5173"
echo "   $(ia_status)"
echo "   API (docs): http://localhost:8000/docs"
echo "   Parar:      ./iniciar.sh parar   ·   Logs: ./iniciar.sh logs"
if command -v xdg-open >/dev/null; then xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null; then open "$URL" || true; fi
