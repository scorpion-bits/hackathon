# Agentes

> Agentes executam tarefas delimitadas delegadas pelo Claude. Não tomam decisões estratégicas.
> Toda delegação usa o bloco abaixo; toda entrega termina com HANDOFF (`templates/handoff.md`).

```
AGENTE:
MODELO:            Opus | Sonnet | Haiku
ESFORÇO:           baixo | médio | alto
PRIORIDADE:        P0 | P1 | P2
DEPENDÊNCIAS:
ENTRADA:           arquivos/docs que deve ler
RESULTADO ESPERADO:
LIMITES:           o que NÃO pode decidir/alterar
```

## Política de modelo
- **Opus:** arquitetura, análise estratégica, integração, revisão crítica, problemas difíceis, decisões de alto impacto.
- **Sonnet:** implementação de features bem especificadas, pipelines de dados, testes de integração, UI.
- **Haiku:** tarefas repetitivas, docs simples, testes básicos, pequenas alterações, formatação.
- Na dúvida entre dois → o menor, com revisão do Claude (Opus).

## Catálogo

| Agente | Modelo padrão | Escopo | Lê | Escreve | Não pode |
|---|---|---|---|---|---|
| **Data Analyst** | Opus | Explorar datasets, estatísticas, qualidade, correlações, insights | `data/raw`, `docs/data-profile.md` | `docs/02-data-analysis.md`, `scripts/analysis_*.py` | Alterar `data/raw`; afirmar causalidade sem evidência |
| **Data Engineer** | Sonnet | Ingestão, limpeza, transformação, pipeline reprodutível | `data/raw`, contratos em `05-architecture.md` | `scripts/pipeline*.py`, `data/processed/` | Mudar o contrato de dados sem aprovação |
| **Product Analyst** | Opus | Problema, público, personas, proposta de valor, hipóteses, priorização | `00`, `01`, `02` | `docs/01-problem.md`, `03-solution.md` (rascunho) | Escolher a solução final |
| **Software Architect** | Opus | Stack, estrutura, APIs, armazenamento, contratos | `03`, `04` | `docs/05-architecture.md`, `06-decisions.md` (proposta) | Aplicar stack sem H-006 |
| **Backend Engineer** | Sonnet | APIs, regras de negócio, processamento, persistência | `05`, tarefas | `src/` (backend), `tests/` | Mudar contrato de API sem avisar o Frontend |
| **Frontend Engineer** | Sonnet | Páginas, componentes, gráficos, responsividade, integração | `04` (demo flow), `05` | `src/` (frontend) | Adicionar páginas fora do MVP |
| **UX/UI Designer** | Sonnet | Fluxo, hierarquia visual, textos de interface, legibilidade em projetor | `04`, telas | sugestões em `tasks.md`, ajustes visuais | Mudar funcionalidade central |
| **QA Engineer** | Sonnet (Haiku p/ testes simples) | Testes do fluxo principal, casos extremos, regressões | `04`, `07`, `src/` | `tests/`, `docs/07-testing.md` | Desabilitar/pular testes para passar |
| **Code Reviewer** | Opus | Revisão crítica antes de merge em pontos de integração | diff | comentários / correções pequenas | Reescrever módulos inteiros |
| **Documentation Engineer** | Haiku | README, setup, como rodar, docs técnicas | repo | `README.md`, `docs/` | Documentar o que não existe |
| **Pitch Strategist** | Opus | Narrativa, slides, números de impacto, roteiro da demo | `01`–`04`, `02` insights | `docs/08-pitch.md`, PDF | Inventar números sem fonte nos dados |

## Equipe humana (👥 H-002 — preencher)

| Nome | Habilidades principais (linguagens, frameworks, dados, design, oratória) | Papel sugerido no hackathon |
|---|---|---|
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |

Papéis humanos sugeridos (ajustar após H-002):
- **Product Owner** — guardião das decisões e do escopo; ponte com mentores.
- **Data lead** — valida insights e números com Claude.
- **Dev lead(s) ×2** — revisam/integram código, rodam o app localmente.
- **Design/QA** — testa manualmente, avalia interface.
- **Pitch lead** — narrativa, slides, ensaio.

## Agentes ativos
_Nenhum._ (registrar: ID da tarefa · agente · modelo · início · status)
