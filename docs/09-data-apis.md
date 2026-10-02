# 09 — APIs de dados abertos: buscar a versão mais recente em vez de baixar à mão

> Pergunta da equipe (02/10 ~13h40): "existe API para pegar a última versão do dado, sem precisar baixar e subir no repositório?"
> ✅ **Atualização 02/10 ~17h40 — testado com internet:** CKAN do MAPA, Open-Meteo, NASA POWER, IBGE Malhas e NASA GIBS
> responderam (HTTP 200). Implementado: `scripts/fetch_opendata.py` + `backend/app/services/live.py`. Ver "Estado da implementação" no fim.

## Resposta curta
**Sim, para quase tudo — mas o melhor desenho é híbrido:**
1. **Dados pequenos e que mudam toda hora → API ao vivo** (com cache): clima, satélite, limites de município.
2. **Arquivos grandes (Zarc ~200 MB/safra, Agrofit ~390 MB) → não existe "API de consulta" no portal do MAPA**, mas o portal
   (`dados.agricultura.gov.br`) é um **CKAN**, que tem **API de metadados**: o sistema pergunta diariamente "esse arquivo mudou?"
   e só baixa quando muda (`last_modified`), roda o pipeline e **registra a data/versão** (regra de ética: fonte + data de extração).
3. **Manter os arquivos atuais no repositório como plano B offline** para a demo (internet do laboratório é risco R-06).

Para o pitch: *"o AgroBits consulta as APIs oficiais todo dia; quando o MAPA publica uma nova portaria do Zarc, as
recomendações do produtor mudam sozinhas."*

## Fonte por fonte

| Fonte | API? | Endpoint (exemplo) | Chave? | Uso no AgroBits | Confiança |
|---|---|---|---|---|---|
| **Zarc (MAPA)** | Metadados via **CKAN** + download do CSV consolidado (atualização **diária**, segundo o dicionário de dados) | `https://dados.agricultura.gov.br/api/3/action/package_show?id=6d3d141c-885e-41a4-ab7f-dc8ff323b96f` · arquivo: `.../resource/a8875ff8-fe4d-4c3c-b1a1-3b19c32916f1/download/dados-abertos-tabua-de-risco.csv` | não | Sincronização diária → `opendata.db` | alta (URL consta no dicionário oficial) |
| **Agrofit (MAPA)** | CKAN (arquivo) **ou** API Agrofit via **Embrapa AgroAPI** | `https://dados.agricultura.gov.br/api/3/action/package_search?q=agrofit` · AgroAPI: `https://www.agroapi.cnptia.embrapa.br` | AgroAPI: cadastro gratuito + token | Checagem de defensivos por cultura/praga | média |
| **SIPEAGRO / PSR (MAPA)** | CKAN (arquivos) | `package_search?q=sipeagro` · `package_search?q=sisser` | não | Agregados regionais (sem dado pessoal) | média |
| **Embrapa AgroAPI** (Agritec, ClimAPI, **SATVeg**) | **Sim** (REST) | Agritec: zoneamento/cultivares/produtividade · SATVeg: **série de NDVI por ponto** | cadastro + token (plano gratuito com limite — verificar) | NDVI do talhão ao longo do tempo; zoneamento por API | média |
| **Previsão do tempo — Open-Meteo** | **Sim** | `https://api.open-meteo.com/v1/forecast?latitude=-21.83&longitude=-48.24&daily=precipitation_sum` | não | Já usado (clima, alertas, planejador) | alta |
| **NASA POWER** (clima histórico) | **Sim** | `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M&latitude=..&longitude=..&start=20250101&end=20251231&community=AG&format=JSON` | não | "Este ano está mais seco que a média?" | alta |
| **NASA GIBS** (imagens de satélite em mosaico) | **Sim** (WMTS, direto no navegador) | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{camada}/default/{data}/{matriz}/{z}/{y}/{x}.png` | não | Camadas do **Mapa vivo** (temperatura, vegetação, chuva, umidade, fogo) | alta (nomes das camadas: verificar) |
| **IBGE — Malhas** | **Sim** | `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/3503208?formato=application/vnd.geo+json` | não | Contorno do município no mapa; mapa de risco Zarc por município | alta |
| **IBGE — SIDRA (Produção Agrícola Municipal)** | **Sim** | `https://apisidra.ibge.gov.br/values/t/5457/n6/3503208/v/214/p/last` | não | "Produtividade média do município" para comparar | alta |
| **ANA — Pivôs centrais / Atlas Irrigação** | Portal ArcGIS Hub → **FeatureServer com consulta por área** | `https://dadosabertos.ana.gov.br` (cada conjunto expõe GeoJSON e `.../FeatureServer/0/query?geometry=...`) | não | Só os pivôs num raio de 10 km da propriedade | média |
| **INPE — Queimadas** | Arquivos diários abertos + WFS (TerraBrasilis) | `https://terrabrasilis.dpi.inpe.br` · `https://queimadas.dgi.inpe.br` | não | Focos de calor perto da propriedade | média |
| **INMET** | API (dados de estações exigem token) | `https://apitempo.inmet.gov.br` | sim (token por e-mail) | Estação mais próxima (observado) | média |
| **dados.gov.br** (catálogo nacional) | API própria | `https://dados.gov.br/dados/api/...` | sim (chave de acesso) | Descobrir novos conjuntos | baixa/média |

## Como fica a arquitetura de dados

```
          ┌──────────── todo dia 06:00 (tarefa agendada) ────────────┐
CKAN MAPA ─► mudou? ─► baixa CSV ─► pipeline_opendata.py ─► opendata.db (+ data/versão de cada fonte)
                                                                │
Open-Meteo / NASA POWER / IBGE ─► consulta ao vivo + cache 1h ──┤
NASA GIBS ─► direto no navegador (tiles do Mapa vivo) ──────────┤
                                                                ▼
                         contexto.md do produtor ─► filtros ─► agentes de IA ─► recomendações com fonte+data
```

## Plano de implementação (proposta — 👥 decidir se entra no hackathon)
| Item | Esforço | Valor p/ banca | Recomendação |
|---|---|---|---|
| `scripts/fetch_opendata.py`: CKAN `package_show` → compara `last_modified` → baixa só o que mudou → roda pipeline → grava `data_sources.extracted_at` | ~45 min (+ teste com internet pela equipe) | alto ("dados sempre atuais", reprodutível) | **FAZER** |
| Camadas NASA GIBS no Mapa vivo | já no protótipo | muito alto (visual) | **FAZER** (verificar nomes) |
| IBGE malhas (contorno do município, mapa de risco) | ~30 min | médio | se sobrar tempo |
| NASA POWER ("mais seco que a média") | ~45 min | alto (insight forte) | se sobrar tempo |
| Embrapa AgroAPI (SATVeg/NDVI do talhão) | 1h+ e depende de cadastro/token | alto, mas arriscado | roadmap |

## Comandos de verificação (rodar no notebook com internet)
```bash
curl -s "https://dados.agricultura.gov.br/api/3/action/package_show?id=6d3d141c-885e-41a4-ab7f-dc8ff323b96f" | head -c 600
curl -s "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&latitude=-21.83&longitude=-48.24&start=20250901&end=20250930&community=AG&format=JSON" | head -c 400
curl -s "https://servicodados.ibge.gov.br/api/v3/malhas/municipios/3503208?formato=application/vnd.geo+json" | head -c 300
curl -s -o /dev/null -w "%{http_code}\n" "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2026-09-20/GoogleMapsCompatible_Level9/6/36/23.png"
```
Me mandem a saída — com isso confirmo endpoints e nomes de camadas.

## Estado da implementação (02/10, testado com internet)
| Fonte | Como | Onde | Resultado do teste |
|---|---|---|---|
| Zarc, Agrofit, SIPEAGRO aviação, PSR (MAPA) | CKAN `package_show` → hash do conteúdo → baixa só se mudou → `pipeline_opendata.py` | `scripts/fetch_opendata.py` | 6 arquivos (~1 GB) conferidos: **idênticos** aos do repositório. 2ª execução: 2 s |
| Open-Meteo | ao vivo, cache 1 h | `services/weather.py` | 200 |
| NASA POWER (chuva 30 dias × normal) | ao vivo, cache 6 h / 30 dias | `services/live.py` · `GET /api/climate/rain-history` · ferramenta `rain_history` da IA | Araraquara 31/08–29/09: **93 mm × normal 48 mm (mais chuvoso)** |
| IBGE Malhas (contorno do município) | ao vivo, cache 30 dias | `GET /api/opendata/boundary` | 200 (GeoJSON) |
| NASA GIBS (Mapa vivo) | direto no navegador | `frontend/.../livemap/layers.ts` | 6 camadas com tile real sobre Araraquara; fogo trocado para `GOES-East_ABI_FireTemp` (VIIRS é só vetor); SMAP atraso 4 dias |

**Pegadinhas descobertas:** o portal do MAPA devolve **403** para clientes sem User-Agent identificável (o script se identifica
como `AgroBits-hackathon`); e o MAPA **republica todos os arquivos todo dia ~07h** (a data muda mesmo sem mudança), por isso
a comparação é por hash do conteúdo — sem isso, o banco seria reconstruído todo dia à toa.

## Motor de assuntos (M3 — `backend/app/services/topics.py`)
Os assuntos do início guiado são **calculados no backend**: dados da conta (talhões, cultura, solo declarado, estoque,
entrevista) × fontes reais. `GET /api/topics` · `GET /api/topics/{key}` · `POST /api/topics/{key}/choice`.

| Assunto | Aparece quando | Fonte |
|---|---|---|
| `janela_plantio` | talhão sem lavoura em pé; risco do decêndio atual acima do menor risco do Zarc (ou fora da janela) | Zarc (MAPA) |
| `janela_aberta` | talhão sem lavoura em pé; decêndio atual já no menor risco | Zarc (MAPA) |
| `chuva_forte` | algum dia ≥ 40 mm nos próximos 7 dias | Open-Meteo |
| `chuva_vs_normal` | últimos 30 dias < 50% ou > 150% da normal | NASA POWER |
| `semente_insuficiente` | saldo de semente da cultura < área desenhada × taxa declarada (só se a conta controla essa semente) | estoque da conta |
| `defensivo_registro` | defensivo em estoque vencendo em ≤ 30 dias; registro e cultura conferidos no Agrofit | Agrofit + estoque |
| `servico_drone` | município com drones no SIPEAGRO e declive anotado no talhão ou falta de pulverizador | SIPEAGRO (MAPA) |

Limites (honestos, vão para o pitch):
- **A IA não entra aqui.** Os textos são modelos de frase (`topics_text.py`) preenchidos com os números da fonte; nunca indicam produto ou dose.
  Cada assunto tem 2–3 caminhos, um marcado como "mais alinhado aos dados oficiais", e o órgão de ATER indicado (CATI/Senar/prefeitura, como exemplo).
- **Fonte fora do ar → o assunto dela não aparece** e `sources_status` mostra `offline`. Com cópia antiga (`stale`), o assunto sai com
  "Dado real de <data/hora>; a fonte está fora do ar agora". Uma regra que falha não derruba as outras.
- Solo é **declarado** pelo produtor; para culturas zoneadas por água disponível (AD1–AD6), a classe é estimada a partir da textura (avisado na evidência).
- Chuva da NASA é estimativa por satélite (~50 km): tendência da região, não pluviômetro.
- Consultas externas (Open-Meteo, NASA) ficam em cache de 10 min por conta; as regras são recalculadas a cada pedido.
- A previsão é real: "chuva forte" só aparece se houver chuva forte prevista.
