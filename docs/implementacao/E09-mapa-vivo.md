# E09 — Mapa vivo com talhões e riscos reais

> Modelo: **Sonnet** · Esforço: **médio** · ~40 min · Depende de: E05, E06 · Se der tempo (sem ela, o mapa mostra os talhões reais da E05 com os riscos de exemplo).

## Objetivo
O mapa vivo passa a mostrar dados reais:
- talhões e **riscos** do produtor, vindos dos assuntos e do Zarc;
- o **contorno real do município** (IBGE);
- a chuva real.

As camadas de satélite (NASA GIBS) já são reais.

## Contexto necessário
- `pages/LiveMap.tsx`: globo maplibre.
  - `homeCenter()` e `allPoints()` leem os talhões, e o `?talhao=N` foca um deles.
  - Renderiza `<MobileUI/>` no celular e `Guide`, `Panels` no desktop.
- `components/livemap/`:
  - `layers.ts`: camadas GIBS verificadas, cada uma com uma `question`;
  - `MobileUI.tsx`: gavetas lugar, camadas, info e talhão;
  - `Panels.tsx`: `FieldCard`, `Timeline`, `Controls`;
  - `Guide.tsx`: `Legend`, `Place`.
  - Eles usam `FIELDS` e o `risk` de `mock.ts`.
- APIs: `GET /api/fields` (E05), `GET /api/topics` (E06), `GET /api/opendata/boundary?geocode=` (IBGE malhas), `GET /api/climate/rain-history`.

## Passos (🤖 AGENT EXECUTION)
1. O risco de cada talhão vem dos assuntos `janela_plantio`/`janela_aberta` do talhão: o risco do decêndio atual. Sem assunto, mostrar "sem dado".
2. A camada "Município" usa o GeoJSON do IBGE (`/api/opendata/boundary`) em vez de um contorno aproximado, se for esse o caso hoje (conferir).
3. O `FieldCard` e a gaveta do talhão mostram cultura, área, risco com fonte e data, e o link "Resolver" para o assunto do talhão.
4. Tirar a dependência de `FIELDS`/`risk` do mock nesses componentes (passar por props ou pelo store).

## Pronto quando
Uma conta em outro município abre o mapa já centrado nos **seus** talhões, com o contorno do **seu** município e riscos coerentes.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → Mapa vivo (celular e computador) → tocar em um talhão → o cartão mostra o risco e "Resolver".
2. Com uma conta em outro município: o mapa abre lá.
3. 👥 Em uma máquina com internet boa, ligar as camadas de satélite uma a uma e anotar se alguma não carrega.

## 👥 Ações humanas
Passo 3 acima.

## Scripts de subir
Sem mudanças.
