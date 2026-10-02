# M2 — Entrevista e talhões na API + primeiro acesso

> **Sonnet · médio · ~1h** · Depende de: M1.

## Objetivo
- A entrevista grava a **fazenda, os talhões e as respostas** da conta.
- O editor de talhões e "Minha propriedade" passam a ler e gravar na API.
- A conta nova vê um **primeiro acesso** guiado.

## Situação atual
- `pages/Interview.tsx`:
  - `?demo=1` carrega `DEMO_ANSWERS`;
  - `onFinish` chama `setFarmFields(a.fields)`, que guarda os talhões só no navegador.
- Tipos em `components/interview/types.ts`:
  - `Answers` com `municipality {name, uf, ibge, lat, lon}`, `fields: FieldDraft[]` e listas (preocupações, objetivos, máquinas…);
  - `FieldDraft` com `ring` [lng, lat] fechado, `crop` (`soja|milho|feijao…`), `soil` (`argiloso|medio|arenoso`), `irrigation` (`nao|aspersao…`).
- `farmStore.ts` (`useFarmFields`, `setFarmFields`, `resetFarmFields`) **muta `FIELDS` do `mock.ts`** para as outras telas enxergarem.
  `pages/FieldsEditor.tsx` usa `components/interview/PropertyMap.tsx` (geoman).
- A API já tem `GET/POST /api/fields` e `PUT/DELETE /api/fields/{id}` (com `geometry` GeoJSON, `crop`, `soil`, `irrigated`, `color`, `name`), já por conta desde a M1.
- `opendata.zarc_crops(geocode)` lista as culturas do Zarc no município.

## Passos (🤖 AGENT EXECUTION)
1. Backend:
   - `POST /api/onboarding` (corpo = `Answers`) cria ou atualiza a `Farm` (`geocode`, `municipality`, `uf`, `lat/lon` do centro dos talhões ou do município);
   - **substitui** os talhões, com a área recalculada no servidor (`polygon_area_ha`);
   - grava `Interview`;
   - criar `GET /api/onboarding`.
   - Tabela `CROP_TO_ZARC` (`milho`→"Milho 1ª Safra" etc.) em `services/context.py`, conferida com `zarc_crops(geocode)`.
     Se a cultura não existir no Zarc do município, guardar o nome mesmo assim; a M3 mostrará "sem Zarc para esta cultura aqui".
2. Front:
   - `Interview.tsx` faz `onFinish` → `POST /api/onboarding` (com "salvando…") → `/prototipo`; em caso de erro, mostra a mensagem e **não** finge que salvou;
   - `farmStore.ts`, **mesma interface pública**:
     - lê `GET /api/fields`;
     - `setFarmFields` calcula a diferença e chama POST, PUT e DELETE;
     - continua atualizando `FIELDS` do mock para as telas que ainda dependem dele (até a M4);
   - conversões `FieldDraft` ⇄ API em `api/fields.ts`;
   - "Voltar ao exemplo" no editor só aparece em conta demo e chama `POST /api/auth/demo {scenario:'existente'}`.
3. **Primeiro acesso** (`ForYou.tsx`): se `/api/me` diz `farm: null` ou sem talhões, mostrar um cartão isométrico
   "Vamos configurar sua propriedade" com 3 passos (município → desenhar talhões → culturas) e o botão para a entrevista, no lugar dos assuntos.
   "Minha propriedade" e "Mapa vivo" mostram o mesmo convite quando não há talhões.
4. Testes:
   - o onboarding cria a fazenda e os talhões com áreas dentro de ±2%;
   - refazer a entrevista substitui, sem duplicar;
   - um município sem Zarc para a cultura não quebra.

## Pronto quando
Uma conta nova faz a entrevista em **outro município**, desenha um talhão, recarrega a página, e o talhão continua lá.
Editar ou criar um talhão em "Minha propriedade" fica salvo. `pytest` e `npm run build` passam.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → "Experimentar como novo usuário" → aparece o convite de primeiro acesso.
2. Entrevista: escolha **outro município** (ex.: Ribeirão Preto), desenhe 1 talhão, escolha soja → concluir.
3. F5: o talhão continua lá. Minha propriedade → "Editar talhões" → criar outro → F5 → os dois continuam lá.
4. Sair e entrar como João: os 3 talhões dele estão intactos.

## 👥 Ações humanas
Nenhuma.

## ✅ Feito (02/10 ~22h40)
- Backend: `routers/onboarding.py` (`GET/POST /api/onboarding`; talhões casados por id ou nome, o resto criado/apagado; histórico e casos só perdem o vínculo),
  `services/context.py` (`CROP_TO_ZARC`, `zarc_name`, `crop_key`, `has_zarc`), `Field.irrigation` novo (`SCHEMA_VERSION = 3`),
  `/api/fields` aceita `crop_key` e `irrigation` e devolve `crop_key`; `/api/me` traz `producer.demo_scenario`.
- Front: `api/fields.ts` (conversões), `farmStore.ts` (carrega da API por conta; grava diferença com debounce + fila; estado `useFarmSync`),
  entrevista salva no servidor ("Salvando…", erro sem fingir) e, ao refazer, abre com as respostas gravadas;
  `components/FirstAccess.tsx` (`NeedsFields`) no Início, Minha propriedade e Mapa vivo; "Voltar ao exemplo" só na conta do João.
- Testes: `tests/test_onboarding.py` (área ±2%, refazer sem duplicar, cultura/município sem Zarc, editor, João intacto).
- Pendente para a M4: telas ainda leem status/risco ilustrativos de `mock.ts` (via `FIELDS`); `resolve.ts` usa ids fixos 1–3.
