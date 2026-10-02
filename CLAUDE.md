# CLAUDE.md — Memória operacional do projeto

> Contém APENAS o estado vigente. Limite: ~250 linhas. Histórico → `docs/archive/`.
> Uma nova conversa deve conseguir retomar o projeto lendo este arquivo + `planning/tasks.md`.

---

## 1. Estado atual

| Campo | Valor |
|---|---|
| Fase | **FASE 2 — IDEAÇÃO** — 4 candidatas em `docs/03-solution.md`, aguardando H-004 |
| Último checkpoint | CP0 — Repositório preparado |
| Próximo checkpoint | CP1 — Problema compreendido |
| Tema | IA e/ou Robótica Agrícola aplicada a Dados Abertos na área da Agricultura |
| Dataset | Regra: ≥1 base "pivô" do MAPA (dados.agricultura.gov.br) ou ANA/Embrapa (Pivôs Centrais 1985–2019); combinar com qualquer base aberta. Ver `docs/00-context.md` |
| Solução escolhida | _pendente_ — recomendação do Claude: **A — AquaPivô** |
| Stack | _não definida_ (opções pré-avaliadas em `docs/05-architecture.md`) |
| Bloqueios | Ambiente sem rede p/ gov.br — humanos baixam dados e fazem push em `data/raw/` (R-13) |

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
| 2 | Dataset analisado | 02/10 10h15 | 🟡 catálogo (arquivos pendentes) |
| 3 | Solução definida (aprovada) | 02/10 11h00 | ⏳ |
| 4 | MVP definido (aprovado) | 02/10 11h30 | ⏳ |
| 5 | Arquitetura definida (aprovada) | 02/10 12h00 | ⏳ |
| 6 | Fluxo principal funcionando | 02/10 17h00 | ⏳ |
| 7 | Demo funcionando | 02/10 20h00 | ⏳ |
| 8 | Testes críticos concluídos | 02/10 21h30 | ⏳ |
| 9 | Pitch pronto | 03/10 08h00 | ⏳ |
| 10 | Entrega final validada | 03/10 08h45 | ⏳ |

Detalhes: `planning/timeline.md`.

---

## 7. Decisões vigentes

_Nenhuma ainda._ Registro completo: `docs/06-decisions.md`.

---

## 8. Mapa do repositório

```
CLAUDE.md            memória operacional (este arquivo)
README.md            apresentação pública do projeto (finalizar no fim)
docs/00..08-*.md     contexto → problema → dados → solução → MVP → arq → decisões → testes → pitch
docs/archive/        histórico removido do CLAUDE.md
planning/            tasks, roadmap, agents, risks, timeline
templates/           modelos: tarefa, handoff, decisão, bloqueio, solução candidata, ação humana
scripts/             ferramentas de apoio (ex.: profile_data.py)
data/raw/            datasets originais (nunca editar)
data/processed/      dados tratados (gerados por script)
src/                 código do produto (vazio até aprovação)
tests/               testes
```

---

## 9. Convenções

- Idioma: docs e commits em português; código (identificadores) em inglês.
- Commits: `tipo(escopo): descrição` — tipos `feat fix docs data test chore refactor`.
- Branch de trabalho: definida pela sessão; nunca push direto em `main` sem acordo da equipe.
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
