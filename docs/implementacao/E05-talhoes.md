# E05 — Talhões reais (editor e Minha propriedade)

> Modelo: **Sonnet** · Esforço: **médio** · ~40 min · Depende de: E04 · Essencial.

## Objetivo
Criar, editar o formato, mudar cultura, solo ou irrigação e apagar talhões, gravando na API. Todas as telas que mostram
talhões passam a ler da API: Início, Minha propriedade, Editor, Mapa vivo e IsoFarm.

## Contexto necessário
- Estado atual: `frontend/src/prototype/farmStore.ts`.
  - Funções: `useFarmFields()`, `setFarmFields()`, `resetFarmFields()`.
  - **Muta o array `FIELDS` de `mock.ts` no lugar**, para as telas antigas enxergarem a mudança. O tipo é `FieldDraft`, de `interview/types.ts`.
- O editor `pages/FieldsEditor.tsx` usa `components/interview/PropertyMap.tsx`:
  - geoman para desenhar e "Salvar formato";
  - aceita `?de=propriedade` e `?talhao=N`;
  - tem o botão "Voltar ao exemplo".
- Rotas que já existem no backend (`routers/api.py`):
  - `GET/POST /api/fields`, `PUT/DELETE /api/fields/{id}`;
  - o corpo usa `geometry` (GeoJSON), `crop`, `soil`, `irrigated`, `color`, `name`.
  - Na E01 elas passaram a respeitar o produtor atual.

## Passos (🤖 AGENT EXECUTION)
1. Criar `frontend/src/prototype/api/fields.ts` com as conversões `FieldDraft` ⇄ `Field` da API:
   - `ring` ⇄ `geometry.coordinates[0]`;
   - cultura ⇄ nome Zarc, reaproveitando a mesma tabela da E04, exposta pelo backend em `GET /api/context/options` ou espelhada no front;
   - `irrigation` ⇄ `irrigated`.
2. Reescrever o `farmStore.ts` mantendo a **mesma interface pública**, para não mexer nas telas:
   - `useFarmFields()` lê do cache da API (`useApi('fields', …)`), com fallback no exemplo;
   - `setFarmFields(next)` calcula a diferença (criados, alterados, removidos) e chama POST, PUT e DELETE; depois `invalidate('fields')`;
   - atualização otimista: a tela muda na hora e volta atrás se a API falhar, com o toast "não foi possível salvar";
   - continuar atualizando `FIELDS` do mock enquanto as telas da E09 ainda dependerem dele;
   - "Voltar ao exemplo" só aparece para o João (demo) e chama `POST /api/auth/demo` ou um reset dos talhões do demo.
3. Conferir que Property, ForYou (IsoFarm), Editor e Mapa vivo refletem as edições.
4. Teste no backend: o PUT de um talhão de outra conta devolve 403.

## Pronto quando
Criar um talhão no editor → aparece em Minha propriedade e no Mapa vivo → recarregar a página → continua lá. Apagar → some.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → entrar (conta própria ou João).
2. Minha propriedade → "Editar talhões" → desenhar um talhão novo → escolher a cultura → salvar.
3. Recarregar a página (F5): o talhão continua lá. Abrir o Mapa vivo: ele aparece.
4. Mudar o formato de um talhão e recarregar: o formato novo foi mantido.

## 👥 Ações humanas
Nenhuma.

## Scripts de subir
Sem mudanças.
