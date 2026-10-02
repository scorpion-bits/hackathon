# E06 — Motor de assuntos com dados abertos reais

> Modelo: **Opus** · Esforço: **alto** · ~1h15 · Depende de: E04, E05 · Essencial. **É o coração do produto.**

## Objetivo
Trocar os 6 assuntos fixos do protótipo (`mock.ts INSIGHTS` + `resolve.ts PROBLEMS`, ids `i1`–`i6`) por assuntos **calculados no
backend**. Eles cruzam os **dados abertos** (Zarc, Open-Meteo, NASA POWER, Agrofit, SIPEAGRO) com o **contexto** (talhões, culturas,
solo, preocupações, estoque). Cada assunto traz as evidências com **fonte e data**, os "caminhos possíveis" (informação, não
receita) e o **órgão de assistência técnica** indicado (modelo A, D-015).

## Contexto necessário
- Formato que o front já espera (não mudar sem necessidade):
  - `Insight` em `mock.ts`: `id`, `priority` (`agir|atencao|oportunidade|info`), `title`, `summary`, `why[]`, `sources[]`, `field`, `action`, `origin`;
  - `Problem` em `resolve.ts`: `id`, `question`, `evidence` (`zarc-milho|zarc-soja|rain|seeds|agrofit|drones`), `fieldId`, `evidenceTitle`, `evidenceNote`, `solutions[]`;
  - cada solução tem `{id, title, detail, pros[], cons[], then[], recommended?}`;
  - `BEST_EXPERT` liga o assunto ao órgão: `cati|senar|prefeitura` (lista em `EXPERTS`).
- Serviços prontos no backend:
  - `opendata.zarc_for(geocode, crop, soil, irrigated)`: riscos por decêndio 1..36 da safra mais recente (`latest_safra()`);
  - `opendata.agrofit_check(product, crop)`;
  - `opendata.region(geocode)`: drones e aviação por município (SIPEAGRO) e seguro (PSR);
  - `weather.forecast(lat, lon)`: Open-Meteo, 16 dias;
  - `live.rain_vs_normal(lat, lon)`: NASA POWER, chuva × normal;
  - `insights.compute_alerts()` e `plan_planting()`: lógica parecida no app antigo, que pode ser **reaproveitada**;
  - `farmdata.item_balance()`: saldo do estoque.
- Regras éticas (`CLAUDE.md` §1): citar a fonte e a data, mostrar a incerteza, nada de dado pessoal; agrotóxico → "precisa de receituário agronômico" (Lei 7.802/89).

## Passos (🤖 AGENT EXECUTION)
1. Criar `backend/app/services/topics.py` com uma regra por tipo de assunto. Cada regra devolve 0 ou mais assuntos com uma `key` estável
   (ex.: `plantio:milho:field2`), para que casos e "resolvido" continuem valendo depois de recalcular:

   | Tipo (`kind`) | Quando aparece | Fonte | Equivale a |
   |---|---|---|---|
   | `janela_plantio` | talhão com cultura ainda não plantada e o decêndio atual com risco > o mínimo da safra, ou fora da janela | Zarc | i1 |
   | `janela_aberta` | talhão com cultura e o decêndio atual já no risco mínimo | Zarc | i4 |
   | `chuva_forte` | algum dia com ≥ 40 mm nos próximos 7 dias | Open-Meteo | i2 |
   | `chuva_vs_normal` | últimos 30 dias < 50% ou > 150% da normal (só se "seca" ou "chuva" estiver nas preocupações, ou se for extremo) | NASA POWER | novo |
   | `semente_insuficiente` | estoque de semente da cultura < área × taxa | estoque do produtor | i3 (só com estoque, D-021) |
   | `defensivo_registro` | defensivo no estoque, com registro no Agrofit e vencendo em ≤ 30 dias | Agrofit | i5 |
   | `servico_drone` | o município tem drones registrados e o contexto indica falta de máquina ou área inclinada | SIPEAGRO | i6 |

2. Os textos de "caminhos possíveis" ficam em **modelos de texto** em `services/topics_text.py`, preenchidos com números reais (datas da janela, % de risco, mm).
   - **Sem IA**, para a resposta ser rápida e previsível.
   - Para cada tipo, de 2 a 3 caminhos, no máximo um com `recommended` ("mais alinhado aos dados oficiais").
   - Nunca indicar produto ou dose.
3. Formato de saída (`GET /api/topics`): uma lista ordenada por prioridade e urgência, em que cada item tem:
   - `{key, kind, priority, title, summary, question, why[], sources[{key,name,agency,date}], field_id, evidence:{type, ...dados p/ gráfico}, paths[], expert_id, generated_at}`;
   - em `evidence`: no Zarc, `{series:[36 números], today_decendio, crop, soil}`; na chuva, `{days:[{date, mm}]}`; e assim por diante.
   - `GET /api/topics/{key}` devolve um assunto só, ou 404 se ele deixou de existir.
4. Cache de 10 min por produtor (o Open-Meteo e a NASA já têm cache em `live.cached_json`). **Se uma fonte ao vivo falhar, a regra dela é pulada e as outras seguem**:
   - a resposta inclui `unavailable_sources[]`;
   - o front mostra "previsão indisponível agora".
5. `TopicState`: criar `POST /api/topics/{key}/choice {choice}` e `GET` junto com os assuntos (campo `choice`). Isso substitui o `resolveProblem` local.
6. Testes, usando o João e mockando o clima com um JSON fixo em `backend/tests/fixtures`:
   - aparece `janela_plantio` para o milho do Talhão 2 com os riscos 40/30/20 da safra 2026/27;
   - aparece `janela_aberta` para a soja;
   - `chuva_forte` com 62 mm previstos;
   - sem estoque não aparece `semente_insuficiente`;
   - a `key` é estável entre duas chamadas.
7. Atualizar `docs/09-data-apis.md` (seção "Motor de assuntos") com as regras e os limites. Esses números vão para o pitch.

## Pronto quando
- `GET /api/topics` do João traz pelo menos os equivalentes de i1, i3, i4, i5 e i6, além de i2 quando a previsão indicar chuva forte, com números do banco e da API.
- Uma conta nova em outro município recebe assuntos coerentes com o Zarc **daquele** município.
- Os testes passam.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → http://localhost:8000/docs → `GET /api/topics` (sem token = João): leiam os títulos e os "porquês". Os números fazem sentido?
2. Criar uma conta em **outro município** (ex.: Ribeirão Preto), plantar soja na entrevista e chamar `GET /api/topics` com o token dessa conta.
3. 👥 Agrônomo da equipe (ou quem conhece o campo): revisar os textos dos caminhos em `services/topics_text.py` e apontar o que soa como receita.

## 👥 Ações humanas
- Revisar os textos dos caminhos possíveis (item 3 acima): ~15 min, idealmente com quem entende de campo.

## Scripts de subir
Se algum modelo mudou (`TopicState`), aumente `SCHEMA_VERSION`. Sem dependências novas.
