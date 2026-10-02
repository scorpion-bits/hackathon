// Textos de interface e estado da conta atual (M4, D-022). NENHUM número de fonte aberta mora aqui:
// Zarc, previsão, funil, volumes e contagens vêm da API (src/prototype/api/). PRODUCER e FIELDS são preenchidos
// pelo farmStore com a conta logada; EXAMPLE_FIELDS é só o atalho de demo da entrevista.

export type Origin = 'real' | 'ilustrativo'

/** Conta e propriedade atuais, preenchidas pelo farmStore a partir de /api/me (vazio até carregar). */
export const PRODUCER = {
  name: '', farm: 'Sua propriedade', municipality: '', uf: '', geocode: '', lat: -15.8, lon: -47.9, area_ha: 0,
}

export type Source = {
  key: string; name: string; agency: string; kind: 'arquivo' | 'api' | 'mapa'
  freshness: 'diário' | 'semanal' | 'safra' | 'tempo real' | 'mensal'; whatItTells: string; color: string
  /** chave da fonte na API (`/api/opendata/sources`, `topic.sources[].key`); sem ela, a base ainda não está integrada */
  apiKey?: string
}

/** Fontes de dados abertos monitoradas: só texto de interface. Volumes, datas e contagens vêm da API (D-022). */
export const SOURCES: Source[] = [
  { key: 'zarc', apiKey: 'zarc', name: 'Zoneamento Agrícola de Risco Climático (Zarc)', agency: 'MAPA', kind: 'arquivo', freshness: 'diário', whatItTells: 'Quando plantar cada cultura, em cada município e tipo de solo, e o risco de perder a lavoura pelo clima.', color: '#2E7D4F' },
  { key: 'clima', apiKey: 'open_meteo', name: 'Previsão do tempo (16 dias)', agency: 'Open-Meteo / modelos globais', kind: 'api', freshness: 'tempo real', whatItTells: 'Chuva, temperatura e vento previstos exatamente sobre a sua propriedade.', color: '#2F6E91' },
  { key: 'satelite', apiKey: 'nasa_power', name: 'Chuva por satélite e imagens (NASA POWER e GIBS)', agency: 'NASA', kind: 'mapa', freshness: 'diário', whatItTells: 'Quanto choveu na sua região nos últimos 30 dias contra o normal, e imagens de vegetação, calor e umidade do solo.', color: '#7C5CBF' },
  { key: 'agrofit', apiKey: 'agrofit', name: 'Agrofit — defensivos registrados', agency: 'MAPA', kind: 'arquivo', freshness: 'semanal', whatItTells: 'Quais produtos são registrados para cada cultura e praga, e o quanto são tóxicos.', color: '#9A6516' },
  { key: 'seguro', apiKey: 'psr', name: 'Seguro Rural com subvenção (PSR)', agency: 'MAPA', kind: 'arquivo', freshness: 'mensal', whatItTells: 'Onde e para quais culturas o seguro rural com apoio do governo está chegando.', color: '#C0392B' },
  { key: 'drones', apiKey: 'sipeagro_aviacao', name: 'Aviação agrícola e drones registrados (SIPEAGRO)', agency: 'MAPA', kind: 'arquivo', freshness: 'semanal', whatItTells: 'Quantos drones e aviões agrícolas operam na sua região — serviços disponíveis perto de você.', color: '#3B82A6' },
  { key: 'pivos', name: 'Agricultura irrigada por pivôs centrais', agency: 'ANA / Embrapa', kind: 'mapa', freshness: 'safra', whatItTells: 'Onde a irrigação cresce — pressão sobre a água da sua bacia.', color: '#0E7490' },
]

/** Talhão como as telas do mapa o leem. `status` e `zarc` vêm da API (farmStore); `zarc` = risco Zarc por decêndio (36 valores). */
export type MapField = {
  id: number; name: string; crop: string; area: number; soil: string; status: string; color: string
  zarc: number[] | null; poly: number[][]
}
/** Talhões da conta atual: preenchidos pelo farmStore a partir de /api/fields (começa vazio, nunca com exemplo). */
export const FIELDS: MapField[] = []

/** Talhões de exemplo da demo rápida da entrevista (`?demo=1`): dado de conta fictício, no formato da entrevista. */
export const EXAMPLE_FIELDS = [
  { id: 1, name: 'Talhão 1', crop: 'Soja', area: 5.36, soil: 'Argiloso', color: '#2E7D4F',
    poly: [[-48.2385, -21.8316], [-48.2360, -21.8316], [-48.2359, -21.8297], [-48.2384, -21.8296]] },
  { id: 2, name: 'Talhão 2', crop: 'Milho', area: 3.08, soil: 'Argiloso', color: '#B7791F',
    poly: [[-48.2358, -21.8316], [-48.2339, -21.8315], [-48.2339, -21.8301], [-48.2358, -21.8302]] },
  { id: 3, name: 'Talhão 3', crop: 'Feijão irrigado', area: 2.05, soil: 'Textura média', color: '#3B82A6',
    poly: [[-48.2372, -21.8335], [-48.2356, -21.8335], [-48.2356, -21.8324], [-48.2372, -21.8324]] },
]

export const CONTEXT_MD = `# Contexto do produtor — AgroBits
> Gerado na entrevista inicial em 02/10/2026 · atualizado automaticamente a cada registro.
> Usado pelos agentes para FILTRAR os dados abertos e sugerir só o que é útil. Você pode editar.

## Perfil
- Tipo: produtor familiar
- Renda bruta anual com a produção: R$ 150 mil a R$ 360 mil
- Orçamento para a próxima safra: R$ 30 mil a R$ 60 mil
- Crédito/seguro: usa PRONAF · não tem seguro rural
- Internet: instável (preferir respostas curtas, modo leve)
- Linguagem: simples, sem termos técnicos

## Localização
- Município: Araraquara/SP (IBGE 3503208)
- Coordenada da sede: -21.832, -48.236

## Propriedade (desenhada no mapa)
| Talhão | Área | Cultura | Solo | Manejo |
|---|---|---|---|---|
| Talhão 1 | 5,36 ha | Soja | argiloso | sequeiro |
| Talhão 2 | 3,08 ha | Milho (verão) | argiloso | sequeiro |
| Talhão 3 | 2,05 ha | Feijão | textura média | irrigado (aspersão) |

## Recursos
- Máquinas: trator 75 cv, plantadeira 4 linhas, pulverizador de barra 600 L
- Sem drone · sem estação meteorológica

## Preocupações (em ordem)
1. Seca / falta de chuva
2. Custo de insumos
3. Pragas e doenças

## Objetivos
- Reduzir perdas por clima
- Saber o custo de cada talhão
- Acessar seguro rural

## Filtros aplicados aos dados abertos
- Zarc: município 3503208 · culturas [soja, milho 1ª safra, feijão] · solos [argiloso, médio] · manejo [sequeiro, irrigado]
- Agrofit: culturas [soja, milho, feijão] · priorizar classe toxicológica 4–5
- Clima: coordenada da sede · alertas: chuva ≥ 50 mm/dia, mínima ≤ 3 °C
- Satélite: raio de 10 km
- Região: drones e seguro rural do município e vizinhos
`
