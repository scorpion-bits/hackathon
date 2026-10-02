# Tarefas

> Fonte de verdade das tarefas técnicas. Antes de criar: checar duplicidade aqui, no código e nos docs.
> Template completo: `templates/task.md`. Status: BACKLOG · READY · IN_PROGRESS · BLOCKED · REVIEW · DONE · CANCELLED
> Ações humanas (👥) são espelhadas no Hub; tarefas 🤖 ficam só aqui.

## Quadro

| ID | Nome | Tipo | Responsável | Agente / Modelo | Prio | Est. | Depende | Status |
|---|---|---|---|---|---|---|---|---|
| T-000 | Preparar estrutura operacional do repo | 🤖 | Claude | Orquestrador / Opus | P0 | 1h | — | DONE |
| T-001 | Registrar tema, dataset e regras em `00-context.md` | 🤖 | Claude | Orquestrador / Opus | P0 | 15m | H-003 | BACKLOG |
| T-002 | Baixar datasets para `data/raw/` e rodar `profile_data.py` | 🤖 | Claude | Data Engineer / Sonnet | P0 | 20m | T-001 | BACKLOG |
| T-003 | Análise de dados: qualidade, variáveis, insights (`02-data-analysis.md`) | 🤖 | Claude | Data Analyst / Opus | P0 | 45m | T-002 | BACKLOG |
| T-004 | Problema, público, hipóteses (`01-problem.md`) | 🤖 | Claude | Product Analyst / Opus | P0 | 30m | T-001 | BACKLOG |
| T-005 | 3–5 soluções candidatas + comparação + recomendação (`03-solution.md`) | 🤖 | Claude | Orquestrador / Opus | P0 | 30m | T-003, T-004 | BACKLOG |

> Tarefas de MVP/arquitetura/implementação só são criadas após H-004 (aprovação da solução).

## Ações humanas (👥 HUMAN ACTION REQUIRED → espelhar no Hub)

| ID | Ação | Quem | Prazo (BRT) | Status |
|---|---|---|---|---|
| H-001 | Revisar esta estrutura e o processo (CLAUDE.md) | equipe | 02/10 08h30 | READY |
| H-002 | Preencher habilidades da equipe em `planning/agents.md` §Equipe humana (stack que cada um domina) | cada integrante | 02/10 08h30 | READY |
| H-003 | Às 08h30: registrar tema, links dos dados, regras, critérios e respostas da organização (`docs/00-context.md` §Perguntas) | 1 pessoa designada | 02/10 09h00 | BACKLOG |
| H-004 | Escolher a solução entre as candidatas (CP3) | equipe | 02/10 11h00 | BACKLOG |
| H-005 | Aprovar escopo do MVP (CP4) | equipe | 02/10 11h30 | BACKLOG |
| H-006 | Aprovar arquitetura/stack (CP5) | equipe | 02/10 12h00 | BACKLOG |
| H-007 | Validar problema/solução com mentor | 1–2 pessoas | 02/10 até 12h00 | BACKLOG |
| H-008 | Definir apresentadores do pitch | equipe | 02/10 18h00 | BACKLOG |
| H-009 | Teste manual do demo flow (alguém que não desenvolveu) | 1 pessoa | 02/10 21h00 | BACKLOG |
| H-010 | Confirmar se haverá trabalho remoto entre 22h00 e 07h45 e quem participa | equipe | 02/10 18h00 | BACKLOG |
| H-011 | Ensaio do pitch cronometrado | apresentadores | 03/10 08h15 | BACKLOG |
| H-012 | Validar e submeter entrega final (repo + protótipo + PDF) | responsável pela entrega | 03/10 08h45 | BACKLOG |

## Bloqueios ativos
_Nenhum._ (formato: `templates/blocked.md`)

## Concluídas recentemente
- T-000 — estrutura operacional criada.
