# Dados

| Pasta | Conteúdo | Regra |
|---|---|---|
| `raw/` | Datasets originais, exatamente como baixados | **Nunca editar.** Registrar fonte abaixo |
| `processed/` | Dados limpos/transformados | Gerados **apenas** por scripts em `scripts/` |

## Fontes
| Arquivo | URL de origem | Baixado em | Licença | Tamanho | No Git? |
|---|---|---|---|---|---|
| `raw/zarc/dados-abertos-tabua-de-risco-safra-2016-2017.csv` | dados.agricultura.gov.br — Zarc Tábua de Risco (MAPA/CGRA) _[URL exata: confirmar com equipe]_ | 02/10/2026 | CC-BY _[confirmar]_ | 9,9 MB | sim |
| `raw/zarc/dados-abertos-tabua-de-risco-safra-2017-2018.csv` | idem | 02/10/2026 | CC-BY _[confirmar]_ | 30,9 MB | sim |
| `raw/zarc/dados-abertos-tabua-de-risco-safra-{2019-2020,2020-2021,2021-2022,2022-2023,2023-2024,2025-2026,2026-2027}.csv.zip` | idem (zip; CSVs de 70–220 MB) | 02/10/2026 | CC-BY _[confirmar]_ | 4–13 MB cada | sim |
| `raw/zarc/mapa-dicionario-de-dados-tabua-de-risco-2026.pdf` | idem (dicionário de dados) | 02/10/2026 | — | 0,8 MB | sim |

> Arquivos > 50 MB: não commitar; adicionar ao `.gitignore` e manter o link acima.

| `raw/agrofit/agrofitprodutostecnicos.csv` | MAPA — Agrofit (produtos técnicos) | 02/10/2026 | CC-BY _[confirmar]_ | 0,7 MB | sim |
| `raw/agrofit/agrofitprodutosformulados.csv.zip` | MAPA — Agrofit (produtos formulados; CSV 392 MB) | 02/10/2026 | CC-BY _[confirmar]_ | 9,8 MB | sim |
| `raw/sipeagro/dicionario_aviacao_agricola_*.pdf` | MAPA — SIPEAGRO Aviação Agrícola (dicionários) | 02/10/2026 | — | 1 MB | sim |
| `restricted/sipeagroaviacaoagricola{registro,autorizacao}.csv.zip` | MAPA — SIPEAGRO Aviação Agrícola | 02/10/2026 | CC-BY _[confirmar]_ | 1,2 / 8,2 MB | **não (dado pessoal)** |
| `restricted/dados_abertos_psr_2025*.zip` | MAPA — SISSER/PSR 2025 (seguro rural) | 02/10/2026 | CC-BY _[confirmar]_ | 3–12 MB | **não (nome, CPF parcial, coordenadas)** |
| `restricted/sipeagro{alimentacaoanimal,avesreproducao,multiplicacaoanimal,fertilizante,produtoveterinario,vinhosebebidas}.csv.zip` | MAPA — SIPEAGRO | 02/10/2026 | CC-BY _[confirmar]_ | <3 MB cada | **não (pode conter pessoa física)** |
| `processed/aviacao_*.csv` | Agregado anônimo gerado por `scripts/aggregate_sipeagro_aviacao.py` | 02/10/2026 | — | 0,2 MB | sim |

## Dados pessoais (critério eliminatório)
`data/restricted/` é ignorado pelo git. Essas bases só podem ser usadas **agregadas** (contagem por município/UF);
nunca exibir nome, CPF/CNPJ de pessoa física, e-mail, telefone, responsável técnico ou coordenada de propriedade.
Para reproduzir: baixar os zips do portal do MAPA para `data/restricted/` e rodar os scripts de agregação.

## Descompactar Zarc
```bash
mkdir -p data/interim/zarc && for f in data/raw/zarc/*.zip; do unzip -o -q "$f" -d data/interim/zarc; done
```
`data/interim/` é ignorado pelo git.
