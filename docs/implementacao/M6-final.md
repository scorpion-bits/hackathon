# M6 — App principal em `/` + teste dos 2 cenários + roteiro

> **Sonnet · médio · ~50 min** · Depende de: M1–M5. Meta: terminar até ~05h de 03/10 (congelamento às 08h).

## Objetivo
Quem abre http://localhost:5173 cai no AgroBits novo, e os dois cenários estão testados ponta a ponta. A equipe sai com um roteiro de demo pronto.

## Passos (🤖 AGENT EXECUTION)
1. **Rotas (D-017)**:
   - `frontend/src/App.tsx` passa a ter `/legado/*` → app antigo (`FunctionalApp`), `/*` → `ProtoApp`, e `/prototipo/*` redirecionando para o mesmo caminho sem o prefixo;
   - trocar os `'/prototipo` fixos (`grep -rn "'/prototipo" frontend/src/prototype`) por uma constante `BASE = ''`;
   - remover o `ProtoBanner` ("protótipo");
   - atualizar as URLs em `dev.sh`, `iniciar.sh`, `iniciar.ps1`, `README.md`, `docker-compose.yml` e `CLAUDE.md`.
2. **Teste automatizado** com Playwright (Chromium em `/opt/pw-browsers`), em 390 px e 1280 px, salvo em `tests/e2e_demo.py`:
   - cenário existente: João → início → Resolver → enviar caso → Meus casos → simular resposta → mapa → IA (offline);
   - cenário novo: experimentar → entrevista em outro município → talhão → assuntos aparecem.
3. **Instalação limpa**: clonar numa pasta nova e rodar `./dev.sh`. Tem que subir sem nenhum passo manual.
4. **Busca por números inventados**: `grep` no front por números de fonte aberta fixos; também confirmar que `AGROIA_WEATHER_FIXTURE` não aparece em `dev.sh`, `docker*` ou `iniciar*`.
5. **Roteiro** `docs/demo/roteiro.md`:
   - 3 minutos, clique a clique, com a fala de cada tela (frase do pitch em `docs/10-business-model.md`);
   - os dois cenários;
   - "se a chuva forte não aparecer hoje, mostrar o assunto do Zarc";
   - plano B sem internet;
   - checklist de antes de apresentar.
6. Atualizar o `CLAUDE.md` (§1 e §6: CP7 e CP8) e o `README.md` (o que é real e o que é demo).

## 🧪 Como a equipe testa
👥 **H-009:** alguém que **não desenvolveu** segue `docs/demo/roteiro.md` no celular e no notebook da apresentação e anota no chat cada travada.

## 👥 Ações humanas
1. H-009 (acima), ~20 min.
2. No notebook da apresentação:
   - `git pull`;
   - criar o `.env` (M5);
   - `./iniciar.sh resetar`;
   - testar **com a internet do evento**.
3. H-011: ensaio cronometrado. H-012: até 08h45, conferir repositório, app e PDF entregues.
