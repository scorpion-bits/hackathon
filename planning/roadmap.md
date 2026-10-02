# Roadmap

> Visão por fase. Detalhe horário em `timeline.md`. Tarefas em `tasks.md`.

| Fase | Objetivo | Saída | Gate (aprovação 👥) | Checkpoint |
|---|---|---|---|---|
| 0 — Preparação | Repo, processo, agentes, templates prontos | Esta estrutura | H-001 | CP0 ✅ |
| 1 — Descoberta | Entender problema e dados | `01-problem.md`, `02-data-analysis.md` | — | CP1, CP2 |
| 2 — Ideação | 3–5 soluções comparadas + recomendação | `03-solution.md` | **H-004 escolher solução** | CP3 |
| 3 — MVP | MUST/SHOULD/COULD/NÃO FAZER + demo flow | `04-mvp.md` | **H-005 aprovar MVP** | CP4 |
| 4 — Arquitetura | Stack, estrutura, contratos, tarefas | `05-architecture.md`, `tasks.md` | **H-006 aprovar stack** | CP5 |
| 5 — Construção | Fluxo principal ponta a ponta primeiro | `src/`, `data/processed/` | — | CP6, CP7 |
| 6 — Qualidade | Testes críticos, bugs da demo | `tests/`, `07-testing.md` | H-009 teste manual | CP8 |
| 7 — Pitch | PDF + roteiro + ensaio | `08-pitch.md`, PDF | H-011 ensaio | CP9 |
| 8 — Entrega | README final, repo limpo, submissão | Entrega | **H-012 validar entrega** | CP10 |

## Princípios de sequenciamento
1. **Fatia vertical primeiro:** um caminho mínimo dado → tela funcionando antes de ampliar.
2. **Demo-first:** o demo flow guia a ordem de implementação.
3. **Pitch em paralelo** a partir do CP4, não no fim.
4. **Feature freeze** às 20h00 de 02/10 (só correções e polimento depois).
5. **Code freeze** às 08h00 de 03/10.
