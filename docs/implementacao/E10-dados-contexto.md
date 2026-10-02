# E10 — Dados abertos + Meu contexto reais

> Modelo: **Sonnet** · Esforço: **médio** · ~40 min · Depende de: E04, E06 · Se der tempo.

## Objetivo
- A tela **Dados abertos** mostra as fontes com a data real da última conferência no portal do MAPA (`data/sync_state.json`) e o
  **funil real**: registros analisados → ligados ao município e às culturas → janelas de risco → assuntos.
- A tela **Meu contexto** mostra as respostas salvas da entrevista.

## Contexto necessário
- `pages/OpenData.tsx`: usa `SOURCES` e `FUNNEL` de `mock.ts`; os números de lá foram calculados à mão em 02/10.
- `components/views/SourceSamples.tsx`: amostras.
- `pages/ContextPage.tsx`: usa `CONTEXT_MD` e `components/interview/ContextSummary.tsx` (cartões amigáveis; o .md técnico fica recolhido).
- Backend:
  - `GET /api/opendata/sources` (`opendata.all_sources()`);
  - `data/sync_state.json` traz `checked_at` e o hash por base;
  - `opendata.db` tem as tabelas do pipeline (`scripts/pipeline_opendata.py`).
- `GET /api/onboarding` (E04).

## Passos (🤖 AGENT EXECUTION)
1. `GET /api/opendata/funnel` calcula, para o produtor atual:
   - o total de registros por base;
   - as linhas do Zarc do município e das culturas;
   - as linhas do Agrofit das culturas;
   - as janelas de risco dos talhões;
   - o número de assuntos.
   - Guardar em cache por produtor.
2. `GET /api/opendata/sources` inclui `checked_at` e a frequência de atualização; o front troca `SOURCES` e `FUNNEL` pela API, com fallback.
3. `ContextPage.tsx` lê `GET /api/onboarding`, e o botão "Refazer entrevista" leva para `/prototipo/entrevista` com tudo preenchido.
4. Teste: o funil do João dá números da mesma ordem dos que estão hoje em `mock.ts` (2.338.052 … 458 linhas do Zarc).

## Pronto quando
As duas telas mostram dados da API. Com uma conta em outro município, o funil muda.

## 🧪 Como a equipe testa
`./iniciar.sh atualizar` → Dados abertos (confira as datas) → Meu contexto (suas respostas) → "Refazer entrevista".
Rodar `./iniciar.sh sincronizar` e conferir que a data de conferência muda.

## 👥 Ações humanas
Thales: copiar os números do funil do João para o pitch (eles são reais).

## Scripts de subir
Sem mudanças.
