#!/usr/bin/env bash
# AgroBits — sobe tudo com Docker (Linux / macOS).
#
#   ./iniciar.sh              sobe API + interface e abre o navegador
#   ./iniciar.sh atualizar    git pull + sobe
#   ./iniciar.sh resetar      recria a propriedade de demonstração e sobe
#   ./iniciar.sh sincronizar  confere o portal do MAPA (baixa só o que mudou) e sobe
#   ./iniciar.sh logs         mostra os logs ao vivo (Ctrl+C sai dos logs, não derruba)
#   ./iniciar.sh parar        derruba tudo
set -euo pipefail
cd "$(dirname "$0")"

say()  { printf '\033[1;32m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || fail "Docker não encontrado. Instale: https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || fail "Docker Compose não encontrado (precisa do 'docker compose', versão 2)."
docker info >/dev/null 2>&1 || fail "O Docker está instalado mas não está rodando. Abra o Docker Desktop (ou: sudo systemctl start docker) e tente de novo."

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
  -h|--help|ajuda) sed -n '2,10p' "$0"; exit 0 ;;
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

URL="http://localhost:5173/prototipo"
say "Pronto!"
echo "   Protótipo:  $URL"
echo "   App:        http://localhost:5173"
echo "   API (docs): http://localhost:8000/docs"
echo "   Parar:      ./iniciar.sh parar   ·   Logs: ./iniciar.sh logs"
if command -v xdg-open >/dev/null; then xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null; then open "$URL" || true; fi
