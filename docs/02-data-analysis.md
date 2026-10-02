# 02 — Análise de dados

> Status: 🟡 **análise de catálogo** (arquivos ainda não baixados — ambiente sem rede p/ gov.br, R-13).
> Tudo marcado _[a verificar]_ depende de abrir os arquivos. Perfil automático: `python3 scripts/profile_data.py data/raw/`.

## Inventário (catálogo da organização, metadados de 24/09/2026)

### MAPA — dados.agricultura.gov.br/dataset (cada uma vale como base "pivô")
| Base | Conteúdo | Formatos | Uso p/ IA | Risco ético |
|---|---|---|---|---|
| Agrofit | Agrotóxicos registrados: produto, cultura, praga-alvo, classe toxicológica | CSV | Busca/recomendação, NLP | baixo (produtos, não pessoas) |
| Zarc — Tábua de Risco | Janelas de plantio por cultura × município × solo | PDF, CSV | Otimização/calendário, risco climático | baixo · arquivo provavelmente grande _[a verificar]_ |
| Zarc — Cultivares | Cultivares indicadas por zona | CSV | Recomendação | baixo |
| SIPEAGRO | Registro de estabelecimentos/produtos agropecuários | CSV, PDF | Estatística cadastral | médio (pode ter razão social/CPF) |
| SIGEF | Campos de produção de sementes, áreas declaradas | CSV, PDF | Série/produção | médio _[a verificar]_ |
| PGA/SIGSIF | Condenação de carcaças + estabelecimentos SIF | CSV, PDF | Saúde animal, anomalias | baixo/médio |
| Controle social (venda direta) | Organizações de controle social de orgânicos | HTML | pouco | — |
| OAC | Certificadoras orgânicas | PDF | pouco | — |
| Produtores Orgânicos | Relação de produtores | **PDF** | difícil (PDF) | **alto (nomes de pessoas físicas)** |
| SISSER | Subvenção ao seguro rural (apólices) | PDF, CSV, XLSX | Preditivo (sinistro), otimização de subsídio | **médio/alto (pode ter nome/CPF de segurado) _[a verificar]_** |
| Agenda de Autoridades | Legado sem descrição | CSV | nenhum | — |
| Thesagro | Thesaurus agrícola | XML | NLP/busca semântica | baixo |
| BINAGRI | Base de conhecimento agro | XLSX | NLP/assistente | baixo |

### ANA / Embrapa — dados.gov.br
| Base | Conteúdo | Formatos | Uso p/ IA | Risco ético |
|---|---|---|---|---|
| **Pivôs Centrais — Pivôs Mapeados** | Geolocalização de cada pivô 1985–2019, município/UF/região hidrográfica | CSV, GeoJSON, KML, ZIP | Série temporal, preditivo, rótulos p/ visão computacional | baixo (equipamento, não pessoa) |
| **Pivôs Centrais — Área por Município** | Área irrigada e nº de pivôs por município | CSV, GeoJSON, KML | Preditivo/ranking | baixo |
| **Atlas de Irrigação 2021** | Área irrigada atual e **potencial**, tipologia, por município/UF | CSV, GeoJSON | Otimização (lacuna potencial × atual) | baixo |
| Arroz Irrigado (3 recortes) | Mapeamento por região/município/áreas | CSV, GeoJSON, KML | Geo/visão | baixo |
| **Cana Irrigada e Fertirrigada (3 recortes)** | Fertirrigação, irrigação plena/déficit/salvamento | CSV, GeoJSON, KML | Geo, regional | baixo |

## Zarc — Tábua de Risco (arquivos analisados ✅ 02/10)
Fonte: MAPA/CGRA, dicionário em `data/raw/zarc/*.pdf`. Perfil: `docs/data-profile.md`.

| Safra | Linhas | Culturas | Municípios | UFs |
|---|---|---|---|---|
| 2016-17 | 53.583 | 5 (Trigo sequeiro, Milho 2ª safra, Algodão, Feijão caupi, Arroz sequeiro) | 3.916 | 15 |
| 2017-18 | 168.540 | 7 (+ Milho, Soja) | 5.508 | 26 |

- **Estrutura:** 1 linha = cultura × ciclo (Grupo I–VI/perene) × solo (arenoso/médio/argiloso ou AD1–AD6) × município (geocódigo IBGE ✅ chave de junção) × portaria.
- **dec1…dec36 = 36 decêndios do ano.** Valores: **0** (plantio não indicado), **20 / 30 / 40** (classe de risco climático de perda, %). Distribuição: 0 = 84%, 20 = 10%, 30 = 3%, 40 = 2%.
- **Qualidade:** colunas Clima, Manejo, Produtividade e Nível de Manejo **100% vazias** nessas safras; 1 linha com decêndios vazios (Senador Guiomard/AC, milho 2ª safra 2016-17); 189 linhas duplicadas.
- **Araraquara (3503208):** 63 linhas — 2016-17: milho 2ª safra, trigo; 2017-18: + soja, milho, arroz. **Sem cana/laranja** nessas safras.
- **Limitação:** safras antigas (2016–2018). O arquivo consolidado atual (`dados-abertos-tabua-de-risco.csv`, atualização diária) deve trazer safras recentes e mais culturas _[a verificar]_.
- **Valor para IA:** matriz pronta "quando plantar × quanto risco" por município/solo → otimização de calendário, camada de risco para gêmeo digital, alvo para modelos.

## Leitura inicial (sem abrir arquivos)
1. **As bases ANA são as mais "prontas para IA":** estruturadas, geográficas, agregadas, sem dado pessoal e com série histórica longa (35 anos) → ética segura e análise rica.
2. **Pivôs + Atlas combinam naturalmente:** mesmo órgão, mesma chave (código IBGE do município) _[a verificar]_; Atlas traz o **potencial**, Pivôs traz a **trajetória**.
3. **Cana fertirrigada tem relevância local:** a região de Araraquara é polo sucroenergético (vinhaça/fertirrigação) — gancho forte para a banca local.
4. **MAPA tem bases boas para "IA de consulta"** (Agrofit, Zarc, Thesagro, BINAGRI), mas várias estão em PDF ou têm risco de dado pessoal (Orgânicos, SISSER).
5. **Zarc é a base MAPA com mais valor analítico** (risco climático por município/cultura), porém tende a ser volumosa.

## Hipóteses (a testar com os dados)
| ID | Hipótese | Como testar |
|---|---|---|
| H1 | A área irrigada por pivôs cresce de forma concentrada em poucas regiões (fronteiras como MATOPIBA, Oeste baiano, Cerrado) | Agregar pivôs por ano × município/região hidrográfica |
| H2 | O crescimento passado prevê bem o crescimento futuro por município (tendência + vizinhança espacial) | Treinar com 1985–2014, validar 2015–2019 |
| H3 | Há municípios onde a área atual já se aproxima do potencial do Atlas → pressão hídrica | Razão atual/potencial |
| H4 | Pivôs se concentram em poucas bacias, gerando risco de conflito pelo uso da água | Agregar por região hidrográfica |
| H5 | Chaves de município são compatíveis entre Pivôs, Atlas e Zarc | Join por código IBGE |

## Qualidade / limitações conhecidas
- Pivôs: série termina em **2019** (7 anos de atraso) → declarar incerteza; detecção por satélite tem erro de omissão/comissão.
- Atlas: retrato de 2021 (não é série).
- Toda conclusão deve citar fonte + data de extração (regra de ética).
