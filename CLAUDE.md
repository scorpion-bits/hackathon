# CLAUDE.md — Memória operacional do projeto

> Contém APENAS o estado vigente. Limite: ~250 linhas. Histórico → `docs/archive/`.
> Uma nova conversa deve conseguir retomar o projeto lendo este arquivo + `planning/tasks.md`.

---

## 1. Estado atual

| Campo | Valor |
|---|---|
| Fase | **FASE 5 — CONSTRUÇÃO** · etapa atual: **protótipo visual** em `/prototipo` (D-009), validando UX antes de ligar ao backend |
| Último checkpoint | CP5 — Arquitetura aprovada |
| Próximo checkpoint | CP6 — Fluxo principal funcionando (17h) |
| Tema | IA e/ou Robótica Agrícola aplicada a Dados Abertos na área da Agricultura |
| Dataset | Regra: ≥1 base "pivô" do MAPA (dados.agricultura.gov.br) ou ANA/Embrapa (Pivôs Centrais 1985–2019); combinar com qualquer base aberta. Ver `docs/00-context.md` |
| Solução escolhida | **AgroIA** — dados abertos no centro; contexto do produtor (entrevista) filtra e a IA recomenda (D-001/D-008) |
| Stack | React+TS+Vite+Tailwind · Leaflet/Geoman/Turf · FastAPI+SQLite · IA OpenAI-compatível + modo offline (D-003/D-004) |
| Bloqueios | Nenhum. Internet liberada na sessão (02/10 ~15h). Portal do MAPA exige User-Agent (já tratado) |

**Pronto (02/10 ~15h40, tudo na `main`):**
- Rodar: `git pull && ./dev.sh` (API+interface) · `./dev.sh --proto` (só protótipo) · `--reset` (demo) · `--sync` (confere MAPA).
- **Protótipo** `/prototipo`: Login · Entrevista (`?demo=1` pula pro fim, resumo em cartões) · Início guiado
  (um assunto por vez → `/prototipo/resolver/:id`: dados → soluções → próximo) · Mapa vivo (globo 3D, guia em 3 passos,
  `?talhao=N`) · Dados abertos · Minha propriedade · IA · Meu contexto. Dados de exemplo em `prototype/mock.ts` e `prototype/resolve.ts`.
- **App funcional** `/` + backend FastAPI (9 telas, 12 testes: `cd backend && pytest -q`).
- **Dados ao vivo:** `scripts/fetch_opendata.py` (Zarc, Agrofit, SIPEAGRO, PSR via CKAN; 02/10: idênticos ao portal) ·
  `services/live.py` (NASA POWER: set/26 93 mm × normal 48 mm; IBGE malhas) · Open-Meteo · NASA GIBS (camadas verificadas). Ver `docs/09-data-apis.md`.

**Próximo:** revisão da equipe no protótipo → decidir o que ligar ao backend (recomendado: entrevista → contexto salvo → filtra
recomendações) → pitch (Thales) com números reais.

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
| 6 | Fluxo principal funcionando | 02/10 17h00 | 🟡 protótipo pronto; falta ligar ao backend |
| 7 | Demo funcionando | 02/10 20h00 | ⏳ |
| 8 | Testes críticos concluídos | 02/10 21h30 | ⏳ |
| 9 | Pitch pronto | 03/10 08h00 | ⏳ |
| 10 | Entrega final validada | 03/10 08h45 | ⏳ |

Detalhes: `planning/timeline.md`.

---

## 7. Decisões vigentes

D-001…D-007 (AgroIA, MVP+planejador+voz, stack, IA plugável, persona João/Araraquara, solo→Zarc, supressão <3) ·
D-008 dados abertos no centro + contexto do produtor · D-009 protótipo visual antes de reimplementar ·
D-010 atualização por API/CKAN · D-011 entregas na `main` · D-012 início guiado + tela Resolver · D-013 mapa com guia em 3 passos.
Ver `docs/06-decisions.md`.

---

## 8. Mapa do repositório

```
CLAUDE.md            memória operacional (este arquivo)
README.md            apresentação + como rodar
dev.sh               sobe tudo (--proto, --reset, --sync)
docs/00..09-*.md     contexto → problema → dados → solução → MVP → arq → decisões → testes → pitch → APIs
planning/            tasks, roadmap, agents, risks, timeline
backend/app/         FastAPI: routers/, services/ (opendata, weather, live, insights), assistant/ (IA + modo offline)
frontend/src/        app funcional (pages/, components/) + prototype/ (protótipo visual, mock.ts, resolve.ts)
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
