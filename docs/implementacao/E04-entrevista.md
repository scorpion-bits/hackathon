# E04 — Entrevista salva no backend

> Modelo: **Sonnet** · Esforço: **alto** · ~45 min · Depende de: E01–E03 · Essencial.

## Objetivo
Ao concluir a entrevista, o backend grava o contexto do produtor e passa a ter tudo de que precisa:
- a **fazenda** (município IBGE, coordenada, área);
- os **talhões** (polígonos desenhados, cultura, solo, irrigação);
- as **respostas** (perfil, renda, crédito, máquinas, preocupações, objetivos, preferências).

É isso que os assuntos (E06) vão usar para filtrar os dados abertos.

## Contexto necessário
- Tela: `frontend/src/prototype/pages/Interview.tsx`.
  - `?demo=1` carrega `DEMO_ANSWERS` e pula para o fim.
  - `onFinish` hoje chama `setFarmFields(a.fields)`, que guarda os talhões só no navegador (`farmStore.ts`).
- Tipos: `components/interview/types.ts`:
  - `Answers` traz `municipality {name, uf, ibge, lat, lon}`, `fields: FieldDraft[]` e várias listas;
  - `FieldDraft` traz `ring` [lng, lat] fechado, `crop` (`soja|milho|feijao|…`), `soil` (`argiloso|medio|arenoso`) e `irrigation` (`nao|aspersao|…`).
- Opções e rótulos ficam em `components/interview/options.ts`; o resumo amigável, em `components/interview/ContextSummary.tsx`.
- O backend usa os nomes de cultura do **Zarc** (ex.: "Milho 1ª Safra", "Soja", "Feijão"), conforme `services/opendata.py:zarc_crops()` e `zarc_for()`.
- Modelo `Interview` (respostas JSON) criado na E01; `farmdata.polygon_area_ha(geometry)` calcula a área.

## Passos (🤖 AGENT EXECUTION)
1. Backend `POST /api/onboarding` (body = `Answers`, mesmo formato do front):
   - validar com Pydantic (campos opcionais, como no front);
   - criar ou atualizar a `Farm` do produtor atual: `geocode=municipality.ibge`, nome padrão "Minha propriedade" (ou o informado), `lat/lon` = centro dos talhões ou do município;
   - **substituir** os talhões pelos `fields`: `ring` vira GeoJSON Polygon e a área é recalculada no servidor;
   - mapear a cultura com uma tabela `CROP_TO_ZARC` em `services/context.py` (`milho`→"Milho 1ª Safra", `soja`→"Soja", `feijao`→"Feijão"…), conferindo com `zarc_crops(geocode)`;
   - `irrigated = irrigation != 'nao'`;
   - gravar `Interview.answers` inteiro;
   - devolver `{farm, fields}`.
2. Backend `GET /api/onboarding` devolve as respostas salvas, para "Meu contexto" e para refazer a entrevista com tudo preenchido.
3. Front:
   - `Interview.tsx` faz `onFinish` → `apiPost('/onboarding', answers)` com um estado "salvando…";
   - se der certo, `invalidate` em `me`, `fields` e `topics` e vai para a tela de resultado ou início;
   - se falhar, mantém o comportamento antigo (`setFarmFields`) e mostra o aviso "salvo só neste aparelho".
4. `?demo=1` continua funcionando, agora salvando as respostas do João.
5. Testes:
   - o onboarding cria a fazenda e 3 talhões com áreas dentro de ±2%;
   - refazer a entrevista substitui os talhões em vez de duplicar;
   - um município sem Zarc não quebra (cultura fica com o rótulo do front).

## Pronto quando
- Uma conta nova faz a entrevista, desenha 2 talhões, termina, recarrega a página, e os talhões continuam lá (vindos da API).
- Os testes passam.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → criar conta → fazer a entrevista com seu município → desenhar 1 ou 2 talhões → concluir.
2. Fechar o navegador, abrir de novo e entrar com a mesma conta: "Minha propriedade" mostra os talhões que você desenhou.
3. Em http://localhost:8000/docs → `GET /api/onboarding` (com o token): aparecem suas respostas.

## 👥 Ações humanas
Nenhuma.

## Scripts de subir
Sem mudanças, a não ser que algum modelo mude (nesse caso, aumente `SCHEMA_VERSION`).
