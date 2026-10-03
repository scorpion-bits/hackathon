# Fontes de cada número do pitch

Slide = posição na apresentação (`#/n` no endereço). Números do app gerados por `pitch/scripts/build_data.py` em `data/data.js`.

| Slide | Número | Fonte |
|---|---|---|
| 1 | 20,1% receberam orientação técnica (1.025.443 de 5.073.324) | IBGE, Censo Agropecuário 2017, resultados definitivos (Agência IBGE, PDF da apresentação) |
| 2 | Órgãos de governo: 491.607 (2006) → 388.077 (2017), −21% | IBGE, idem |
| 2 | 13.690 extensionistas públicos (2023) | Asbraer, apresentação na CAPADR/Câmara dos Deputados, 2023 |
| 2 | 3,9 milhões (3.897.408) de estabelecimentos da agricultura familiar | IBGE, Censo Agro 2017 — Agricultura familiar |
| 3 | Cobertura por região: N 10,4% · NE 8,2% · SE 28,6% · S 48,6% · CO 23,6% | IBGE 2017, tabela reproduzida pela Asbraer (CAPADR/Câmara dos Deputados, 2023) |
| 3 | Mapa | IBGE, API de malhas (regiões, qualidade mínima) |
| 4 | 9 bases abertas, de 6 fontes (MAPA: Zarc, Agrofit, PSR, SIPEAGRO · Open-Meteo · NASA POWER e GIBS · IBGE · ANA/Embrapa) | o que o app usa de fato (`backend/app/services/`, `docs/09`) |
| 5 | 1.951.698 linhas do Zarc (safras 2025/2026 e 2026/2027), as colunas (Cod_Solo, Cod_Clima, geocodigo, dec1…dec36) e as linhas cruas | MAPA, Tábua de Risco do Zarc (dados.agricultura.gov.br), conferida em 02/10/2026; banco local do app |
| 9 | Sítio Boa Esperança, 10,7 ha, talhões 5,61 · 3,06 · 2,02 ha | conta de demonstração (fictícia): `backend/app/fixtures/demo/joao.json`, área geodésica dos polígonos |
| 9 | 2.044.825 → 6.302 (111 linhas do Zarc de Araraquara + 6.191 do Agrofit) → 7 assuntos | AgroBits `/api/opendata/funnel` e `/api/topics` da conta do João (os assuntos dependem da previsão do dia) |
| 10 | Milho 1ª safra, Araraquara: 40% de risco no plantio de 1–10/out, 20% a partir de 21/10 | Zarc 2026/2027 do MAPA, mostrado pelo app (tela capturada em 03/10/2026) |
| 13 | ODS 2 (metas 2.3, 2.a), 13 (13.1), 10 (10.2) | ONU, Agenda 2030 |
| 14 | Supressão de grupos com menos de 3; consentimento do caso | `scripts/pipeline_opendata.py` (D-007) e `routers/cases.py` |
| 15 | 6 pessoas, 22 decisões, commits, 41 testes da API | este repositório (`git rev-list --count HEAD`, `docs/06-decisions.md`, `cd backend && pytest -q`) |
| vídeo | telas da conta demo (Zarc 40%, 7 assuntos, caso AB-1002) | capturas reais do app em 03/10/2026 (`pitch/scripts/capture_app.py`, `capture_extra.py`) |

Não usar: "4 em cada 5 nunca tiveram" (o Censo mede o período de referência), ganho de produtividade do técnico (não medido),
prazos de resposta dos órgãos (exemplos da demo).
