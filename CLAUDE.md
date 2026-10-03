# CLAUDE.md — Memória operacional do projeto

> Contém APENAS o estado vigente. Limite: ~250 linhas. Histórico → `docs/archive/`.
> Uma nova conversa deve conseguir retomar o projeto lendo este arquivo + `docs/implementacao/README.md`.

## 0. Retomada após `/clear` (a equipe limpa o chat entre etapas)

1. Leia este arquivo e **`docs/implementacao/README.md`** (plano do MVP real, etapas M1–M7, regras de dados §2).
2. Pegue a etapa 🔄 ou a próxima ⏳ e leia **só o arquivo dela** (`docs/implementacao/Mx-*.md`), que tem contexto,
   arquivos envolvidos, passos, teste e ações humanas.
3. Ao terminar: marque ✅ + hash na tabela, atualize §1 deste arquivo em **1–3 linhas** e responda com o
   **bloco de fechamento** (README do plano, §5): o que mudou, 🧪 como a equipe testa, 👥 passo a passo do que a equipe faz.
4. Scripts de subir (`dev.sh`, `iniciar.*`, `docker/`) **sempre** atualizados na mesma etapa: a equipe testa toda etapa com eles.

**Economia de contexto (obrigatório):** não explore o repositório inteiro; ler arquivos por trecho (`grep`/`sed -n`);
não colar arquivos grandes nem logs longos na conversa (use `tail`); não reabrir etapas ✅; uma etapa por conversa;
se a etapa for grande, divida e registre o ponto de parada no arquivo da etapa antes do contexto acabar.
Este arquivo ≤ 250 linhas: ao atualizar, **substitua** linhas de estado em vez de acrescentar; histórico → `docs/archive/`.

---

## 1. Estado atual

| Campo | Valor |
|---|---|
| Fase | **FASE 5 — CONSTRUÇÃO** · protótipo validado pela equipe (02/10 ~19h) → **implementação real** seguindo `docs/implementacao/` |
| Último checkpoint | CP6 — Fluxo principal funcionando no protótipo |
| Próximo checkpoint | CP7 — Demo funcionando (20h) |
| Tema | IA e/ou Robótica Agrícola aplicada a Dados Abertos na área da Agricultura |
| Dataset | Regra: ≥1 base "pivô" do MAPA (dados.agricultura.gov.br) ou ANA/Embrapa (Pivôs Centrais 1985–2019); combinar com qualquer base aberta. Ver `docs/00-context.md` |
| Solução escolhida | **AgroBits** — dados abertos no centro; contexto do produtor filtra; **a IA não decide**: prepara o caso e leva à assistência técnica pública, de graça (D-008/D-015) |
| Stack | React+TS+Vite+Tailwind · Leaflet/Geoman/Turf · FastAPI+SQLite · IA OpenAI-compatível + modo offline (D-003/D-004) |
| Bloqueios | Nenhum. Internet liberada na sessão (02/10 ~15h). Portal do MAPA exige User-Agent (já tratado) |

**Pronto (02/10 ~18h, tudo na `main`):**
- **Rodar:** `iniciar.bat` (Windows) / `./iniciar.sh` (Linux) — usa Docker se houver; senão cai sozinho no `./dev.sh`,
  **sem sudo** (baixa Node/uv portáteis em `.tools/`). Opções: atualizar, resetar, sincronizar, logs, parar, sem-docker.
- **App AgroBits** `/` (antes `/prototipo`; mobile first, D-016; marca AgroBits isométrica, D-014):
  Login · Entrevista (`?demo=1` pula pro fim; resumo em cartões) · **Início guiado** (um assunto por vez) →
  **Resolver** `/resolver/:id` (dados → caminhos possíveis → **enviar caso ao técnico público**, D-015) ·
  **Meus casos** · **Editar talhões** `/talhoes` (criar/ajustar formato/cultura; estado compartilhado em `farmStore.ts`) ·
  **Mapa vivo** (globo 3D; desktop: guia em 3 passos; celular: 2 botões + 1 cartão + gavetas; `?talhao=N`) ·
  Dados abertos · Minha propriedade · IA (aviso "explica dados, não dá receita") · Meu contexto.
  Dados de exemplo: `prototype/mock.ts`, `resolve.ts` (casos/órgãos), `farmStore.ts`.
- **App antigo** `/legado` + backend FastAPI (38 testes: `cd backend && pytest -q`).
- **Dados ao vivo:** `scripts/fetch_opendata.py` (CKAN MAPA, hash; 02/10 idênticos ao portal) · `services/live.py`
  (NASA POWER: set/26 93 mm × normal 48 mm; IBGE malhas) · Open-Meteo · NASA GIBS (camadas verificadas). Ver `docs/09`.
- **Modelo de negócio:** A — público, ATER (CATI/Senar/prefeitura), gratuito ao produtor. Ver `docs/10-business-model.md`.

**M1 ✅ (26481b7):** contas reais (cadastro/login com hash, token), botões demo João (recarrega fixtures) e conta nova; `/api/me`; tudo filtrado pela conta; banco recriado sozinho ao mudar `SCHEMA_VERSION`.
**M2 ✅ (4f8e4e8):** entrevista grava fazenda/talhões/respostas (`/api/onboarding`, culturas → nomes do Zarc em `services/context.py`); editor e telas leem/gravam `/api/fields` (`farmStore.ts`); conta sem talhões vê o convite de primeiro acesso.
**M3 ✅ (8cbc8af):** `GET /api/topics` — 7 regras (`services/topics.py`, textos em `topics_text.py`) × Zarc/Open-Meteo/NASA/Agrofit/SIPEAGRO; fonte fora → assunto some + `sources_status`; escolha em `POST /api/topics/{key}/choice`.
**M4 ✅ (4c02bdc):** telas do roteiro ligadas à API (hooks em `frontend/src/prototype/api/`: `resource.ts`, `topics.ts`, `cases.ts`, `opendata.ts`); casos em `routers/cases.py` (`/api/cases`, `/api/experts`, demo-reply, reset só demo); `/api/opendata/funnel` e `sources` com contagem real; `resolve.ts` apagado, `mock.ts` sem número de fonte aberta; `SourceStatus` mostra "dado real de <data>"/"indisponível".
**M5 ✅ (3035906):** `/api/assistant/*` por conta; ferramentas `get_topics`/`explain_topic`; prompt "explica, não decide, sem dose"; offline responde ao roteiro (Zarc, chuva, defensivo→técnico, "o que faço?"); `AGROBITS_LLM_*` (+`AGROIA_*`); `Assistant.tsx` ligado à API (`demo.ts` apagado); scripts mostram "IA: ligada/offline"; 37 testes.
**M6 ✅ (e4aa180):** AgroBits em `http://localhost:5173/` (app antigo em `/legado`, `/prototipo/*` redireciona); sem banner de protótipo; quem não entrou vai a `/entrar`; `tests/e2e_demo.py` (Playwright, 390 e 1280 px, 2 cenários); roteiro em `docs/demo/roteiro.md`; contagens da animação da entrevista agora vêm da API.
**M7 ✅ (4683ca9):** pivôs ANA/Embrapa ao vivo (`/api/opendata/pivots`, card em Dados abertos); radar da entrevista só lista fonte com dado (Zarc por município, ANA respondeu), sem "raio 10 km"/"crédito"; Mapa vivo abre no Zarc, avisa "sem imagem" (pixel vazio na sede) e afasta para a região nas camadas NASA.
**Pitch ✅ (03/10 ~03h):** `pitch/` (Reveal local, 12 slides, notas com falas, tecla T claro/escuro, vídeo 10 s `assets/video/agrobits-10s.mp4`, PDF `pitch/dist/`); tela do técnico `/tecnico/caso/:id` (`/api/cases/{id}/brief`); chave da avaliação em `.env.avaliacao` (revogar após o evento); fontes do app locais (`frontend/public/fonts`).
**Próximo:** H-009 (teste por quem não desenvolveu) + H-011 ensaio cronometrado do pitch. MVP real em 6 etapas, `docs/implementacao/README.md` (M1 contas → M2 entrevista/talhões → M3 assuntos reais →
M4 telas → M5 IA → M6 app em `/` + roteiro; M7 ANA opcional) → **pitch (Thales) + PDF** → congelamento 03/10 08h.
**Regra de dados (D-022):** dado de fonte aberta/externa é SEMPRE real (fonte fora → aviso, ou último dado real com data);
fictício só dado de conta (contas demo `is_demo`, fixtures nas mesmas tabelas). Cenários: conta nova × conta existente (João).
**Pendências 👥:** validar fluxo de casos com técnico da CATI (via mentor) · confirmar % de assistência técnica (Censo Agro 2017).

**Restrições-chave:** agenda CEPIN (visão computacional, preditivo, otimização, automação/robótica);
ética (citar fonte+data, mostrar incerteza, sem dado pessoal); IA paga = custo da equipe → preferir gratuito.

---

## 2. Evento

- 1ª Hackathon de Dados Abertos — IFSP Araraquara
- Horários em **BRT (UTC-3)**:
  - 02/10 08h30 — instruções + tema + base de dados
  - 02/10 09h00–22h00 — desenvolvimento presencial
  - 03/10 07h45 — retorno
  - 03/10 **09h00 — PRAZO FINAL** (congelamento interno: 08h00)
- Entregáveis obrigatórios:
  1. Protótipo funcional
  2. Repositório GitHub
  3. PDF de apresentação / pitch
- Equipe: 6 humanos + Claude (orquestrador) + agentes.

---

## 3. Papéis (nunca confundir)

| Quem | Faz |
|---|---|
| **Equipe humana** | Decide estratégia, valida, prioriza, fala com mentores, testa manualmente, apresenta |
| **Claude (orquestrador)** | Analisa, recomenda, planeja, coordena agentes, codifica, revisa, testa, documenta |
| **Agentes** | Executam tarefas delimitadas; não decidem fora do escopo |
| **Hub** | Organização da equipe humana (responsáveis, horários, decisões, checkpoints) |
| **GitHub** | Fonte de verdade técnica (código, docs, tarefas técnicas, decisões) |

---

## 4. Regra de ouro — decisões

**Decisão estratégica = aprovação humana obrigatória antes de implementar.**

Estratégico: direção do produto, problema, público, arquitetura, stack, escopo do MVP,
modelo de dados, funcionalidade central, estratégia de demo, proposta de valor.

Fluxo: analisar alternativas → recomendar → motivos → riscos → esforço → **aguardar** →
registrar em `docs/06-decisions.md` → executar.

Operacional (pode decidir sozinho): nomes, organização interna, refatoração simples,
bugfix, lib trivial, testes, docs, ajustes visuais pequenos.

> Quanto maior o impacto e o custo de reversão, maior a necessidade de aprovação.

Sinalização em toda comunicação:
- `👥 HUMAN ACTION REQUIRED` — exige equipe (vai para o Hub)
- `🤖 AGENT EXECUTION` — executável por Claude/agentes (não vai para o Hub)

---

## 5. Pipeline de trabalho

```
PROBLEMA → DADOS → INSIGHTS → HIPÓTESES → SOLUÇÕES → [APROVAÇÃO] → MVP → ARQUITETURA
→ [APROVAÇÃO] → TAREFAS → EXECUÇÃO → TESTES → DOCS → DEMO → PITCH
```

Ao receber `TEMA / DATASET / REGRAS`, produzir (e então PARAR):
1. Contexto 2. Problema 3. Dados 4. Insights 5. Hipóteses 6. Oportunidades
7. Soluções candidatas (3–5) 8. Comparação (tabela de notas) 9. Recomendação

Ferramenta pronta para a análise inicial: `python3 scripts/profile_data.py data/raw/`
(gera `docs/data-profile.md`).

---

## 6. Checkpoints

| CP | Marco | Meta (BRT) | Status |
|---|---|---|---|
| 0 | Repositório preparado | antes de 02/10 08h30 | ✅ |
| 1 | Problema compreendido | 02/10 09h30 | ✅ |
| 2 | Dataset analisado | 02/10 10h15 | ✅ |
| 3 | Solução definida (aprovada) | 02/10 11h00 | ✅ |
| 4 | MVP definido (aprovado) | 02/10 11h30 | ✅ |
| 5 | Arquitetura definida (aprovada) | 02/10 12h00 | ✅ |
| 6 | Fluxo principal funcionando | 02/10 17h00 | ✅ no protótipo (backend ligado só no app funcional) |
| 7 | Demo funcionando | 02/10 20h00 | ✅ app em `/` + roteiro (falta H-009) |
| 8 | Testes críticos concluídos | 02/10 21h30 | ✅ `pytest` 38 + `tests/e2e_demo.py` (falta H-009 humano) |
| 9 | Pitch pronto | 03/10 08h00 | ✅ `pitch/` + PDF (falta ensaio H-011) |
| 10 | Entrega final validada | 03/10 08h45 | ⏳ |

Detalhes: `planning/timeline.md`.

---

## 7. Decisões vigentes

D-001…D-007 (AgroBits, MVP+planejador+voz, stack, IA plugável, persona João/Araraquara, solo→Zarc, supressão <3) ·
D-008 dados abertos no centro + contexto do produtor · D-009 protótipo visual antes de reimplementar ·
D-010 atualização por API/CKAN · D-011 entregas na `main` · D-012 início guiado + tela Resolver · D-013 mapa com guia em 3 passos · D-014 nome AgroBits + visual isométrico (logo em `docs/brand/`) · **D-015 modelo A público (ATER)** · D-016 mobile first · D-017 protótipo vira app em `/` · D-018 cadastro c/ senha + botões demo · D-019 resposta do técnico simulada · D-020 Groq + offline · D-021 sementes/fungicida via estoque da conta + Agrofit real · **D-022 regras de dados** (ver `docs/implementacao/README.md` §2).
Ver `docs/06-decisions.md`.

---

## 8. Mapa do repositório

```
CLAUDE.md            memória operacional (este arquivo)
README.md            apresentação + como rodar
iniciar.sh/.bat/.ps1 sobe tudo (Docker ou, sem Docker, via dev.sh) · docker-compose.yml + docker/
dev.sh               modo sem Docker, sem sudo (--proto, --reset, --sync)
docs/implementacao/  PLANO DA IMPLEMENTAÇÃO REAL (índice + 1 arquivo por etapa) — ler após /clear
docs/00..10-*.md     contexto → problema → dados → solução → MVP → arq → decisões → testes → pitch → APIs → modelo de negócio
docs/brand/          logos AgroBits (originais) e paleta
planning/            tasks, roadmap, agents, risks, timeline
backend/app/         FastAPI: routers/, services/ (opendata, weather, live, insights), assistant/ (IA + modo offline)
frontend/src/        app funcional (pages/, components/) + prototype/ (protótipo: pages/, components/ livemap/ interview/, mock.ts, resolve.ts, farmStore.ts)
scripts/             pipeline_opendata.py · fetch_opendata.py · seed_demo.py · aggregate_sipeagro_aviacao.py
data/raw/            bases oficiais (nunca editar) · data/processed/ agregados anônimos · data/restricted/ fora do git
data/sync_state.json versão/hash de cada base conferida no portal do MAPA
```

---

## 9. Convenções

- Idioma: docs e commits em português; código (identificadores) em inglês.
- Commits: `tipo(escopo): descrição` — tipos `feat fix docs data test chore refactor`.
- Branch: entregas vão para a `main` e para a branch da sessão (D-011, acordado com a equipe). Sempre `git pull` antes de push.
- Dados originais intocáveis em `data/raw/`; toda transformação via script reprodutível.
- Toda tarefa em `planning/tasks.md` com ID `T-XXX`; checar duplicidade antes de criar.
- Toda entrega de agente termina com HANDOFF (`templates/handoff.md`).
- Bloqueio > 30 min → registrar BLOCKED (`templates/blocked.md`) e buscar alternativa.
- Nova ideia → classificar FAZER AGORA / BACKLOG / DESCARTAR; nunca implementar direto.
- Filtro de toda funcionalidade: _"Isso aumenta nossa capacidade de resolver o problema
  e demonstrar valor na apresentação?"_ Se não → cortar.
- 80% funcionando > 100% ideal que não fica pronto.

---

## 10. Perguntas abertas para a equipe

Ver `planning/tasks.md` seção "Ações humanas" (H-001…).

---

## 11. Manutenção deste arquivo

A cada checkpoint: atualizar §1, §6, §7; remover o que não afeta decisões futuras;
mover histórico para `docs/archive/YYYY-MM-DD-HHMM-<assunto>.md`.
