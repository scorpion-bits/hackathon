# E13 — QA ponta a ponta + roteiro da demo

> Modelo: **Opus** · Esforço: **alto** · ~1h · Depende de: todas as essenciais · Essencial. Meta: até 03/10 ~06h (antes do congelamento das 08h).

## Objetivo
Garantir que a demo funciona **do zero, em uma máquina limpa**, com e sem internet, e que a equipe tem um roteiro fechado.

## Passos (🤖 AGENT EXECUTION)
1. **Teste automatizado do fluxo** com Playwright (o Chromium já está em `/opt/pw-browsers`), em 390 px e 1280 px:
   entrar como João → início → Resolver → enviar caso → Meus casos → simular resposta → mapa vivo → IA (offline).
   Guardar o script em `tests/e2e_demo.py` e as capturas em `docs/demo/`.
2. **Instalação limpa:** clonar o repositório numa pasta nova e rodar `./dev.sh` (sem Docker). Tem que subir do zero, sem passo manual.
3. **Sem internet:** simular a queda (variáveis `AGROIA_WEATHER_FIXTURE=1`, proxy desligado) e conferir que:
   - os assuntos com fonte ao vivo somem com aviso;
   - o resto funciona;
   - a IA cai para o modo offline.
4. **Teste de regressão:** `cd backend && pytest -q`, `cd frontend && npm run build`, sem avisos de TypeScript.
5. Escrever `docs/demo/roteiro.md`:
   - roteiro de 3 minutos, clique a clique, com a fala de cada tela (frase do pitch em `docs/10-business-model.md`);
   - plano B para cada ponto que pode falhar;
   - checklist de antes de apresentar: `./iniciar.sh resetar`, aba aberta, celular espelhado, `.env` com a chave.
6. Revisar textos de todas as telas: nenhum nome de pessoa real; instituições marcadas como exemplo de integração; nenhuma receita.
7. Atualizar o `CLAUDE.md` (§1 e §6: CP7 e CP8) e o `README.md` (como rodar e o que está real ou de exemplo).

## Pronto quando
O fluxo automatizado passa nos dois tamanhos de tela; a instalação limpa sobe sozinha; o roteiro existe e foi ensaiado (👥).

## 🧪 Como a equipe testa
👥 **Teste manual por alguém que NÃO desenvolveu (H-009):** seguir `docs/demo/roteiro.md` no celular e no notebook da apresentação e anotar no chat qualquer travada.

## 👥 Ações humanas
1. H-009: teste manual por quem não desenvolveu (~20 min).
2. No notebook da apresentação:
   - `git pull`, criar o `.env` (passo a passo da E11) e `./iniciar.sh resetar`;
   - deixar aberto e **testar com a internet do evento**.
3. H-011: ensaio cronometrado do pitch, usando a demo real.
4. H-012: até 08h45, conferir que o repositório, o protótipo e o PDF estão entregues.

## Scripts de subir
Conferir que `iniciar.sh resetar` deixa a demo no estado inicial (casos vazios, assuntos abertos, talhões do João).
