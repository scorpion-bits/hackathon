# Tarefas

> Fonte de verdade das tarefas técnicas. Antes de criar: checar duplicidade aqui, no código e nos docs.
> Template completo: `templates/task.md`. Status: BACKLOG · READY · IN_PROGRESS · BLOCKED · REVIEW · DONE · CANCELLED
> Ações humanas (👥) são espelhadas no Hub; tarefas 🤖 ficam só aqui.

## Quadro

| ID | Nome | Tipo | Responsável | Agente / Modelo | Prio | Est. | Depende | Status |
|---|---|---|---|---|---|---|---|---|
| T-000…T-005 | Preparação, contexto, análise de dados, candidatas | 🤖 | Claude | Opus | P0 | — | — | DONE |
| T-010 | Modelo de dados + API backend (contrato em /docs da API) | 🤖 | Claude | Opus | P0 | 1h | — | DONE |
| T-011 | Esqueleto frontend: layout, navegação, tema, cliente API, + Registrar, Painel | 🤖 | Claude | Opus | P0 | 1h | — | DONE |
| T-012 | Pipeline dados abertos (Zarc 25-26/26-27, Agrofit, região) + `data_sources` | 🤖 | Claude | Opus | P0 | 1h | — | DONE |
| T-013 | Seed demo: João, 3 talhões, histórico desde 2025/26 | 🤖 | Claude | Opus | P0 | 45m | — | DONE |
| T-014 | Mapa: desenhar/editar talhão + ficha + Zarc + Planejador (M3, M6) | 🤖 | agente | Frontend / Sonnet | P0 | 1h15 | — | IN_PROGRESS |
| T-015 | Estoque: itens, entradas/saídas, histórico, Agrofit (M5, S4) | 🤖 | agente | Frontend / Sonnet | P0 | 1h15 | — | IN_PROGRESS |
| T-016 | Produção: safras, linha do tempo (M4) — backend DONE | 🤖 | agente | Frontend / Sonnet | P0 | 1h15 | — | IN_PROGRESS |
| T-017 | Painel (DONE) + tela de Alertas (agente) (M2, M7) | 🤖 | Claude + agente | Sonnet | P0 | 1h | — | IN_PROGRESS |
| T-018 | Assistente IA: backend DONE (LLM + offline + rascunho); tela + voz (agente) (M8, S5) | 🤖 | Claude + agente | Opus/Sonnet | P0 | 1h15 | — | IN_PROGRESS |
| T-019 | Clima, Relatórios, Perfil/fontes (S1, S2, S6) | 🤖 | agente | Sonnet | P1 | 1h | — | IN_PROGRESS |
| T-020 | Testes: fluxo principal, Zarc vs CSV, custos, privacidade (7 ok) + 10 perguntas da IA | 🤖 | Claude + Victor | Opus | P0 | contínuo | — | IN_PROGRESS |

## Ações humanas (👥 HUMAN ACTION REQUIRED → espelhar no Hub)

| ID | Ação | Quem | Prazo (BRT) | Status |
|---|---|---|---|---|
| H-001 | Revisar esta estrutura e o processo (CLAUDE.md) | equipe | 02/10 08h30 | READY |
| H-002 | Preencher habilidades da equipe em `planning/agents.md` §Equipe humana | cada integrante | 02/10 08h30 | DONE |
| H-013 | Baixar bases ANA (Pivôs Mapeados CSV, Pivôs Área por Município CSV, Atlas Irrigação 2021 CSV) e push em `data/raw/` | Maria + Fernando | 02/10 10h30 | READY |
| H-014 | Escolher provedor/modelo de IA e providenciar chave (custo da equipe) | Milan + Fernando | 02/10 13h00 | READY |
| H-015 | Thales: rascunho do roteiro do pitch | Thales | 02/10 15h00 | READY |
| H-003 | Às 08h30 (Milan/PO): registrar tema, links dos dados, regras, critérios e respostas da organização (`docs/00-context.md` §Perguntas) | 1 pessoa designada | 02/10 09h00 | BACKLOG |
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
RESOLVIDO: T-001 — ler apresentação (equipe enviou prints)
BLOCKED (antigo): T-001 — ler apresentação do tema (https://jrbeluzo.com.br/hackathon/apresentacao.html)
Desde: 02/10 manhã · Motivo: política de rede do ambiente bloqueia o domínio jrbeluzo.com.br
Alternativas: (1) liberar domínio nas configurações do ambiente (2) colar texto/prints no chat (3) subir HTML/PDF em data/raw/
Precisa de humano? sim

## Concluídas recentemente
- T-000 — estrutura operacional criada.
