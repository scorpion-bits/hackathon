# M3 — Assuntos calculados com fontes reais

> **Opus · médio · ~1h20** · Depende de: M2. **É o coração do produto.** Leia `README.md` §2 (regras de dados).

## Objetivo
Trocar os 6 assuntos fixos (`mock.ts INSIGHTS` + `resolve.ts PROBLEMS`, ids `i1`–`i6`) por assuntos **calculados no backend**:
**dados de conta** (talhões, culturas, solo declarado, estoque, preocupações) **×** **fontes reais** (Zarc, Open-Meteo, NASA POWER, Agrofit, SIPEAGRO).
Cada assunto leva as evidências com **fonte e data**, de 2 a 3 "caminhos possíveis" (informação, nunca receita) e o órgão de ATER indicado.

## Situação atual
- Formatos que o front já usa (manter os nomes para a M4 ser simples):
  - `Insight`: `priority` (`agir|atencao|oportunidade|info`), `title`, `summary`, `why[]`, `sources[]`, `field`;
  - `Problem`: `question`, `evidence` (`zarc-milho|zarc-soja|rain|seeds|agrofit|drones`), `fieldId`, `evidenceTitle`, `evidenceNote`, `solutions[]`;
  - cada solução tem `{id, title, detail, pros[], cons[], then[], recommended?}`;
  - `BEST_EXPERT` → `cati|senar|prefeitura` (`EXPERTS` em `resolve.ts`).
  - Os textos do protótipo em `resolve.ts` servem de **modelo de redação**; os números devem vir das fontes.
- Serviços prontos:
  - `opendata.zarc_for(geocode, crop, soil, irrigated)`: risco por decêndio 1..36 da safra mais recente;
  - `opendata.agrofit_check(product, crop)`;
  - `opendata.region(geocode)`: SIPEAGRO (drones e aviões por município) e PSR;
  - `weather.forecast(lat, lon)`: Open-Meteo 16 dias, com cache e status;
  - `live.rain_vs_normal(lat, lon)`: NASA POWER;
  - `insights.compute_alerts()` e `plan_planting()`: lógica parecida no app antigo, que pode ser reaproveitada;
  - `farmdata.item_balance()`.

## Passos (🤖 AGENT EXECUTION)
1. `backend/app/services/topics.py`, com uma função por regra. Cada assunto tem uma `key` estável (ex.: `plantio:<field_id>:milho`).

   | kind | Aparece quando | Fonte real | Era |
   |---|---|---|---|
   | `janela_plantio` | talhão com cultura no Zarc e risco do decêndio atual > risco mínimo, ou fora da janela | Zarc | i1 |
   | `janela_aberta` | talhão com cultura e o decêndio atual no risco mínimo | Zarc | i4 |
   | `chuva_forte` | algum dia ≥ 40 mm nos próximos 7 dias | Open-Meteo | i2 |
   | `chuva_vs_normal` | últimos 30 dias < 50% ou > 150% da normal | NASA POWER | (cartão de chuva) |
   | `semente_insuficiente` | saldo de semente da cultura < área × taxa declarada | estoque da conta | i3 |
   | `defensivo_registro` | defensivo no estoque vencendo em ≤ 30 dias; o registro e a cultura são conferidos no **Agrofit real** | Agrofit + estoque | i5 |
   | `servico_drone` | município com drones no SIPEAGRO e o contexto indica falta de máquina ou área inclinada | SIPEAGRO | i6 |

2. Saída de `GET /api/topics`:
   - `{topics:[...], sources_status:{clima:'live|cache|stale|offline', nasa:…}, generated_at}`;
   - cada assunto: `{key, kind, priority, title, summary, question, why[], sources:[{key,name,agency,date}], field_id, evidence:{type,…dados do gráfico}, paths[], expert_id, choice}`.
   - Para o Zarc: `evidence={type:'zarc', series:[36], today_decendio, crop, soil, safra}`; para a chuva: `{type:'rain', days:[{date,mm}]}`; e assim por diante.
   - `GET /api/topics/{key}` devolve um assunto; 404 se ele não existe mais.
   - `POST /api/topics/{key}/choice {choice}` grava em `TopicState`.
3. Textos dos caminhos em `services/topics_text.py`:
   - **modelos de frase preenchidos com os números da fonte**: datas da janela, % de risco, mm previstos;
   - sem IA; nunca produto nem dose; cada um com um único `recommended` ("mais alinhado aos dados oficiais").
4. **Fonte falhou?**
   - A regra dela não gera assunto e `sources_status` indica `offline`.
   - Com cache `stale`, gera o assunto e acrescenta em `why[]` "dado real de <data/hora>".
   - **Nunca usar `AGROIA_WEATHER_FIXTURE` fora dos testes.**
5. Cache de 10 min por conta (dicionário em memória).
6. Testes:
   - João + clima mockado só no teste (`backend/tests/fixtures`) → `janela_plantio` do milho com a série real do Zarc 2026/27 e `janela_aberta` da soja;
   - sem estoque, não aparece `semente_insuficiente`;
   - clima offline → sem `chuva_forte` e `sources_status.clima=='offline'`;
   - a `key` é estável.
7. `docs/09-data-apis.md`: seção curta "Motor de assuntos" com as regras e os limites (vai para o pitch).

## Pronto quando
- `GET /api/topics` do João traz assuntos com números reais.
- Uma conta em outro município recebe assuntos coerentes com o Zarc **de lá**.
- Com a internet cortada, nenhum número inventado aparece.
- `pytest` passa.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → http://localhost:8000/docs → `GET /api/topics` (sem token = João). Os números batem com o "porquê"?
2. Pela tela, a conta nova da M2 (Ribeirão Preto); no /docs, `POST /api/auth/login` com o contato e a senha dela → copiar o `token` → em `GET /api/topics`, preencher o campo `authorization` com `Bearer <token>` (não há botão "Authorize").

## 👥 Ações humanas
Quem entende de campo lê os textos de `services/topics_text.py` (~15 min) e aponta o que soa como receita.

## Observação para a demo
A previsão é real: o assunto "chuva forte" **só aparece se houver chuva forte prevista**. O roteiro (M6) se adapta ao que aparecer.
