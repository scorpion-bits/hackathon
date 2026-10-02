// Configuração das camadas de DADOS ABERTOS do "Mapa vivo" (protótipo visual, D-009).
//
// Camadas de satélite: NASA GIBS (Global Imagery Browse Services) — dado aberto, sem chave de API.
// URL REST WMTS: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LAYER}/default/{TIME}/{MATRIX}/{z}/{y}/{x}.{EXT}
//
// ✓ VERIFICADO em 02/10 contra o GetCapabilities e com tiles reais sobre Araraquara (HTTP 200):
//     https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml
//   - latencyDays = atraso observado entre hoje e a data "default" de cada camada;
//     TIME = "default" pede a imagem mais recente disponível.
//   - cores das legendas ainda APROXIMADAS das paletas GIBS (conferir em /colormaps/v1.3/{LAYER}.xml).
import type { LucideIcon } from 'lucide-react'
import { CloudRain, Droplets, Flame, Leaf, Satellite, ShieldAlert, Thermometer } from 'lucide-react'
import { FIELDS, FORECAST, ZARC_MILHO } from '../../mock'

export type Legend = { colors: string[]; labels: string[]; unit?: string; note?: string; discrete?: boolean }

export type GibsSpec = {
  layer: string
  matrix: string
  ext: 'png' | 'jpg'
  /** zoom máximo nativo do TileMatrixSet (GoogleMapsCompatible_LevelN → N). Acima disso o mapa amplia o tile. */
  maxzoom: number
  /** dias de atraso típicos do produto; datas mais novas que isso usam TIME=default. */
  latencyDays: number
  cadence: string
}

export type DataLayer = {
  id: string
  label: string
  /** pergunta em linguagem simples mostrada no guia ("O que você quer saber?") */
  question: string
  icon: LucideIcon
  /** undefined → camada local (Zarc sobre os talhões) */
  gibs?: GibsSpec
  legend: Legend
  source: { chip: string; detail: string }
  /** "O que esta camada significa para você" — linguagem simples, contexto do João. */
  meaning: (date: Date) => string
  origin: 'real' | 'ilustrativo'
  defaultOpacity: number
}

export const GIBS_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
export const GIBS_ATTRIBUTION = 'NASA GIBS / EOSDIS'

export const DATA_LAYERS: DataLayer[] = [
  {
    id: 'cor', question: 'Foto do satélite', label: 'Satélite de ontem', icon: Satellite,
    // verificar no notebook com internet
    gibs: { layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', matrix: 'GoogleMapsCompatible_Level9', ext: 'jpg', maxzoom: 9, latencyDays: 1, cadence: 'diário' },
    legend: { colors: [], labels: [], note: 'Cores naturais: nuvens em branco, mata em verde-escuro, queimadas em marrom.' },
    source: { chip: 'NASA GIBS · VIIRS (Suomi NPP)', detail: 'Reflectância corrigida, cor verdadeira, ~375 m' },
    meaning: () => 'É a “foto” de ontem vista do espaço. Serve para ver nuvens de chuva chegando e manchas de queimada perto do Sítio Boa Esperança.',
    origin: 'real', defaultOpacity: 0.85,
  },
  {
    id: 'temp', question: 'Está muito quente?', label: 'Temperatura do solo', icon: Thermometer,
    // verificar no notebook com internet
    gibs: { layer: 'MODIS_Terra_Land_Surface_Temp_Day', matrix: 'GoogleMapsCompatible_Level7', ext: 'png', maxzoom: 7, latencyDays: 1, cadence: 'diário (dia)' },
    legend: { colors: ['#3b0f70', '#2c7fb8', '#41b6c4', '#a1dab4', '#ffffb2', '#fd8d3c', '#e31a1c', '#800026'], labels: ['−10', '10', '25', '40', '55'], unit: '°C na superfície' },
    source: { chip: 'NASA GIBS · MODIS Terra', detail: 'Temperatura da superfície terrestre (dia), 1 km' },
    meaning: () => 'A terra da sua região passou de 35 °C à tarde nesta semana. Seu feijão do Talhão 3 está florindo (51 dias): calor forte na flor derruba vagens — irrigue cedo, antes das 9 h.',
    origin: 'ilustrativo', defaultOpacity: 0.7,
  },
  {
    id: 'ndvi', question: 'A lavoura está verde?', label: 'Vegetação (NDVI)', icon: Leaf,
    // verificar no notebook com internet (produto de 8 dias: GIBS encaixa a data no período)
    gibs: { layer: 'MODIS_Terra_NDVI_8Day', matrix: 'GoogleMapsCompatible_Level9', ext: 'png', maxzoom: 9, latencyDays: 1, cadence: 'a cada 8 dias' },
    legend: { colors: ['#8c5a2b', '#c9a46a', '#efe3b0', '#b8d97a', '#6bb34a', '#2b8a2b', '#0d5a12'], labels: ['0', '0,2', '0,4', '0,6', '0,8+'], unit: 'índice de verde (NDVI)' },
    source: { chip: 'NASA GIBS · MODIS Terra', detail: 'Índice de vegetação NDVI, composição de 8 dias, 250 m' },
    meaning: () => 'Quanto mais verde, mais planta viva. Seus Talhões 1 e 2 aparecem “marrons” porque estão sem lavoura, esperando o plantio — normal. O Talhão 3 (feijão) aparece verde: lavoura saudável.',
    origin: 'ilustrativo', defaultOpacity: 0.7,
  },
  {
    id: 'chuva', question: 'Vai chover?', label: 'Chuva', icon: CloudRain,
    // verificar no notebook com internet (IMERG é de 30 min; só a data → GIBS usa 00:00 UTC)
    gibs: { layer: 'IMERG_Precipitation_Rate', matrix: 'GoogleMapsCompatible_Level6', ext: 'png', maxzoom: 6, latencyDays: 1, cadence: '30 min' },
    legend: { colors: ['#b9e3f7', '#6cbcea', '#2f80d1', '#3346b0', '#7b2fa8', '#c2228f', '#f0326a'], labels: ['0,1', '1', '5', '15', '50'], unit: 'mm/h' },
    source: { chip: 'NASA GIBS · GPM IMERG', detail: 'Taxa de precipitação por satélite (passado) · previsão: Open-Meteo' },
    meaning: () => {
      const total = FORECAST.reduce((s, f) => s + f.rain, 0)
      return `Choveu pouco na região de Araraquara na última semana. Para os próximos 7 dias a previsão soma ≈${total} mm, quase tudo na quinta (≈62 mm): não aplique defensivo na quarta e proteja o Talhão 2, que está com o solo exposto.`
    },
    origin: 'ilustrativo', defaultOpacity: 0.75,
  },
  {
    id: 'umidade', question: 'O solo está seco?', label: 'Umidade do solo', icon: Droplets,
    // SMAP L4: em 02/10 a imagem mais recente era de 28/09 (~4 dias de atraso)
    gibs: { layer: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture', matrix: 'GoogleMapsCompatible_Level6', ext: 'png', maxzoom: 6, latencyDays: 4, cadence: 'diário (modelo + satélite)' },
    legend: { colors: ['#7a4a17', '#b98a4c', '#e8d5a0', '#d9ecd6', '#8fd0c4', '#3fa49a', '#0b5f5a'], labels: ['seco', '', 'médio', '', 'úmido'], unit: 'água na zona das raízes (0–100 cm)' },
    source: { chip: 'NASA GIBS · SMAP L4', detail: 'Umidade do solo na zona das raízes, 9 km' },
    meaning: () => 'Em setembro choveu 93 mm na sua região, quase o dobro do normal para o período (48 mm · NASA POWER, consultado em 02/10). O solo deve ter boa umidade — mesmo assim, o risco oficial do milho só cai para 20% a partir de 21/10.',
    origin: 'ilustrativo', defaultOpacity: 0.7,
  },
  {
    id: 'fogo', question: 'Tem fogo perto?', label: 'Focos de fogo', icon: Flame,
    // VIIRS Thermal Anomalies no GIBS é só vetor (MVT); usamos o raster do satélite geoestacionário GOES-Leste
    // (cobre o Brasil, imagem a cada 10 min). Subdiário: TIME com só a data devolve a imagem daquele dia.
    gibs: { layer: 'GOES-East_ABI_FireTemp', matrix: 'GoogleMapsCompatible_Level7', ext: 'png', maxzoom: 7, latencyDays: 0, cadence: 'a cada 10 min' },
    legend: { colors: ['#fff36b', '#ffae00', '#ff3b1f'], labels: ['', 'temperatura de fogo', ''], unit: 'pixel ≈ 2 km', note: 'Também monitorado pelo INPE (BDQueimadas).' },
    source: { chip: 'NASA GIBS · GOES-Leste', detail: 'Temperatura de fogo (ABI), 2 km · INPE BDQueimadas' },
    meaning: () => 'Nenhum foco de fogo a menos de 10 km da sua propriedade nos últimos 7 dias. É época seca: mantenha os aceiros limpos, principalmente perto do Talhão 1.',
    origin: 'ilustrativo', defaultOpacity: 1,
  },
  {
    id: 'zarc', question: 'Quando plantar?', label: 'Risco climático (Zarc)', icon: ShieldAlert,
    legend: { discrete: true, colors: [RISK_COLOR(20), RISK_COLOR(30), RISK_COLOR(40), RISK_COLOR(0)], labels: ['20%', '30%', '40%', 'fora'], unit: 'risco oficial de perder a lavoura pelo clima', note: 'Cinza = fora da janela indicada (sem zoneamento para a data).' },
    source: { chip: 'Zarc · MAPA', detail: 'Zoneamento Agrícola de Risco Climático, safra 2026/27, Araraquara' },
    meaning: (date) => {
      const r = riskFor(FIELDS[1], date)
      const when = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      return r === 0
        ? `Plantando milho em ${when}, o Talhão 2 fica fora da janela oficial — sem acesso ao Proagro e ao seguro com subsídio. A janela abre em 1º/10.`
        : `Plantando milho em ${when}, o Talhão 2 tem ${r}% de risco de perda pelo clima. A partir de 21/10 o risco cai para 20%. Soja (Talhão 1) e feijão (Talhão 3) já estão em 20%.`
    },
    origin: 'real', defaultOpacity: 0.8,
  },
]

export function RISK_COLOR(risk: number) {
  return risk === 0 ? '#6b7280' : risk <= 20 ? '#2E7D4F' : risk <= 30 ? '#D69E2E' : '#C0392B'
}

/** Decêndio do ano (0..35) — o Zarc é publicado por decêndio. */
export function decendio(d: Date) {
  const day = d.getDate()
  return d.getMonth() * 3 + (day <= 10 ? 0 : day <= 20 ? 1 : 2)
}

/** Risco Zarc do talhão na data: milho usa a série real por decêndio; demais usam o valor do mock. */
export function riskFor(field: (typeof FIELDS)[number], date: Date) {
  return field.crop === 'Milho' ? ZARC_MILHO[decendio(date)] : field.risk
}

// ---------- datas ----------
export const DAY_OFFSETS = Array.from({ length: 15 }, (_, i) => i - 7) // −7 … +7
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const pad = (n: number) => String(n).padStart(2, '0')

export function addDays(base: Date, n: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const weekday = (d: Date) => WD[d.getDay()]
export const shortDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`

/** TIME do GIBS para um deslocamento de dias; futuro ou dentro da latência → "default" (mais recente). */
export function gibsTime(spec: GibsSpec, today: Date, offset: number, latest: boolean) {
  if (latest || offset > -spec.latencyDays) return 'default'
  return isoDate(addDays(today, offset))
}

export function gibsTileUrl(spec: GibsSpec, time: string) {
  return `${GIBS_BASE}/${spec.layer}/default/${time}/${spec.matrix}/{z}/{y}/{x}.${spec.ext}`
}

/** Previsão (mock.FORECAST) indexada por deslocamento 0..6 a partir de hoje. */
export const forecastAt = (offset: number) => (offset >= 0 ? FORECAST[offset] : undefined)
