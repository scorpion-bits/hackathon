# M7 — *Opcional:* pivôs centrais da ANA na região

> **Sonnet · baixo · ~30 min** · Depende de: M3. Só se houver folga. **Não exige ação da equipe:** a base é consultada online.

## Por quê
A base "pivô" da ANA/Embrapa é uma das duas bases que o regulamento indica. Usá-la, além das bases do MAPA, fortalece o pitch.

## Fonte (verificada em 02/10 ~20h, aberta, sem chave)
Serviço ArcGIS REST da ANA (SNIRH): `https://www.snirh.gov.br/arcgis/rest/services/SPR/`
- `Irrigada_Pivos_por_Municipios/MapServer/0/query?where=cdmun=<IBGE>&outFields=*&returnGeometry=false&f=json`
  → área irrigada (`arha_1985…arha_2019`) e quantidade de pivôs (`qtpivo_*`) por município, de 1985 a 2019.
  - Nomes de campo truncados: `qtpivo_198`…`qtpivo_206` correspondem aos anos na mesma ordem das camadas. Confirmar na resposta.
- `Pivos_2019/MapServer/0`: polígonos dos pivôs mapeados (consulta espacial; testar os parâmetros, porque o envelope simples devolveu 400).
- **Araraquara (3503208): 0 pivôs de 1985 a 2019** (dado real). Mostrar os municípios vizinhos é o que dá contexto.

## Passos (🤖 AGENT EXECUTION)
1. `live.py`: criar `pivots_by_municipality(geocodes)` usando `cached_json` (TTL de 7 dias, porque a base é de 2019) e lista de vizinhos por distância (IBGE malhas ou a tabela de municípios que já existe).
2. `GET /api/opendata/pivots`: o município da conta e os vizinhos (série 1985–2019), com fonte "ANA/Embrapa — Levantamento de Pivôs Centrais 2019".
3. Front: um cartão em "Dados abertos" ("Irrigação por pivôs na sua região") e uma linha nas fontes. Offline → aviso, como nas outras fontes.

## 🧪 Como a equipe testa
`./iniciar.sh atualizar` → Dados abertos → cartão de pivôs: Araraquara com 0 e os vizinhos com números.
