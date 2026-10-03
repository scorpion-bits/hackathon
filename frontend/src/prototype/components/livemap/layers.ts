// Configuração das camadas de DADOS ABERTOS do "Mapa vivo" (protótipo visual, D-009).
//
// Camadas de satélite: NASA GIBS (Global Imagery Browse Services) — dado aberto, sem chave de API.
// URL REST WMTS: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LAYER}/default/{TIME}/{MATRIX}/{z}/{y}/{x}.{EXT}
//
// ✓ VERIFICADO em 02/10 contra o GetCapabilities e com tiles reais sobre Araraquara (HTTP 200):
//     https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml
//   - latencyDays = atraso observado entre hoje e a data "default" de cada camada;
//     TIME = "default" pede a imagem mais recente disponível.
//   - imagens reais ("dado oficial"); só as cores das legendas são aproximadas das paletas GIBS (/colormaps/v1.3/{LAYER}.xml).
import type { LucideIcon } from 'lucide-react'
import { CloudRain, Droplets, Flame, Leaf, Satellite, ShieldAlert, Thermometer } from 'lucide-react'
import { useRainNormal, useWeather, weekdayOf, type RainNormal } from '../../api/opendata'
import type { MapField } from '../../mock'

/** Dados ao vivo que os textos das camadas podem citar (nunca números fixos no código). */
export type MeaningCtx = { rain7: number | null; peak: { d: string; mm: number } | null; normal: RainNormal | null; fields: MapField[] }

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
  /** o que significa a imagem vazia (transparente) sobre a propriedade quando isso é um dado (ex.: sem chuva, sem fogo).
   *  Sem isso, vazio = sem imagem (nuvem ou satélite não passou) e a tela avisa. */
  emptyMeans?: string
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
  /** "O que esta camada significa para você" — linguagem simples; só números vindos da API (via `ctx`). */
  meaning: (date: Date, ctx: MeaningCtx) => string
  origin: 'real' | 'ilustrativo'
  defaultOpacity: number
}

export const GIBS_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
export const GIBS_ATTRIBUTION = 'NASA GIBS / EOSDIS'

export const DATA_LAYERS: DataLayer[] = [
  {
    id: 'cor', question: 'Foto do satélite', label: 'Foto do satélite (NASA)', icon: Satellite,
    // verificar no notebook com internet
    gibs: { layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', matrix: 'GoogleMapsCompatible_Level9', ext: 'jpg', maxzoom: 9, latencyDays: 1, cadence: 'diário' },
    legend: { colors: [], labels: [], note: 'Cores naturais: nuvens em branco, mata em verde-escuro, queimadas em marrom. A foto nítida de fundo (Esri) é um mosaico antigo, sem data.' },
    source: { chip: 'NASA GIBS · VIIRS (Suomi NPP)', detail: 'Reflectância corrigida, cor verdadeira, ~375 m' },
    meaning: () => 'É a foto mais recente da NASA vista do espaço (cada ponto ≈ 300 m). Serve para ver nuvens de chuva chegando e manchas de queimada perto da sua propriedade.',
    origin: 'real', defaultOpacity: 0.85,
  },
  {
    id: 'temp', question: 'Está muito quente?', label: 'Temperatura do solo', icon: Thermometer,
    // verificar no notebook com internet
    gibs: { layer: 'MODIS_Terra_Land_Surface_Temp_Day', matrix: 'GoogleMapsCompatible_Level7', ext: 'png', maxzoom: 7, latencyDays: 1, cadence: 'diário (dia)' },
    legend: { colors: ['#3b0f70', '#2c7fb8', '#41b6c4', '#a1dab4', '#ffffb2', '#fd8d3c', '#e31a1c', '#800026'], labels: ['−10', '10', '25', '40', '55'], unit: '°C na superfície' },
    source: { chip: 'NASA GIBS · MODIS Terra', detail: 'Temperatura da superfície terrestre (dia), 1 km' },
    meaning: () => 'Mostra o quanto a superfície da terra está quente durante o dia. Calor forte na floração derruba a produção: confira com o técnico antes de decidir irrigar ou plantar.',
    origin: 'real', defaultOpacity: 0.7,
  },
  {
    id: 'ndvi', question: 'A lavoura está verde?', label: 'Vegetação (NDVI)', icon: Leaf,
    // produto de 8 dias; em 03/10 a imagem mais recente era de 01/10 (datas mais novas dão 404 → usar 'default')
    gibs: { layer: 'MODIS_Terra_NDVI_8Day', matrix: 'GoogleMapsCompatible_Level9', ext: 'png', maxzoom: 9, latencyDays: 3, cadence: 'a cada 8 dias' },
    legend: { colors: ['#8c5a2b', '#c9a46a', '#efe3b0', '#b8d97a', '#6bb34a', '#2b8a2b', '#0d5a12'], labels: ['0', '0,2', '0,4', '0,6', '0,8+'], unit: 'índice de verde (NDVI)' },
    source: { chip: 'NASA GIBS · MODIS Terra', detail: 'Índice de vegetação NDVI, composição de 8 dias, 250 m' },
    meaning: () => 'Quanto mais verde, mais planta viva. Talhão sem lavoura (esperando plantio) aparece “marrom”, o que é normal; lavoura saudável aparece verde.',
    origin: 'real', defaultOpacity: 0.7,
  },
  {
    id: 'chuva', question: 'Vai chover?', label: 'Chuva', icon: CloudRain,
    // IMERG: em 03/10 a imagem mais recente era de 01/10 (datas mais novas dão 404 → usar 'default')
    gibs: { layer: 'IMERG_Precipitation_Rate', matrix: 'GoogleMapsCompatible_Level6', ext: 'png', maxzoom: 6, latencyDays: 2, cadence: '30 min', emptyMeans: 'O satélite não registrou chuva sobre a sua propriedade nesta imagem.' },
    legend: { colors: ['#b9e3f7', '#6cbcea', '#2f80d1', '#3346b0', '#7b2fa8', '#c2228f', '#f0326a'], labels: ['0,1', '1', '5', '15', '50'], unit: 'mm/h' },
    source: { chip: 'NASA GIBS · GPM IMERG', detail: 'Taxa de precipitação por satélite (passado) · previsão: Open-Meteo' },
    meaning: (_d, c) => {
      if (c.rain7 == null) return 'A previsão do tempo está indisponível agora, então não dá para somar a chuva dos próximos 7 dias. A imagem de satélite mostra a chuva que já caiu.'
      const peak = c.peak && c.peak.mm >= 1 ? ` O dia mais chuvoso é ${c.peak.d}, com ${Math.round(c.peak.mm)} mm.` : ''
      return `Para os próximos 7 dias a previsão soma ≈${Math.round(c.rain7)} mm sobre a sua propriedade.${peak} A imagem de satélite mostra a chuva que já caiu.`
    },
    origin: 'real', defaultOpacity: 0.75,
  },
  {
    id: 'umidade', question: 'O solo está seco?', label: 'Umidade do solo', icon: Droplets,
    // SMAP L4: em 02/10 a imagem mais recente era de 28/09 (~4 dias de atraso)
    gibs: { layer: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture', matrix: 'GoogleMapsCompatible_Level6', ext: 'png', maxzoom: 6, latencyDays: 4, cadence: 'diário (modelo + satélite)' },
    legend: { colors: ['#7a4a17', '#b98a4c', '#e8d5a0', '#d9ecd6', '#8fd0c4', '#3fa49a', '#0b5f5a'], labels: ['seco', '', 'médio', '', 'úmido'], unit: 'água na zona das raízes (0–100 cm)' },
    source: { chip: 'NASA GIBS · SMAP L4', detail: 'Umidade do solo na zona das raízes, 9 km' },
    meaning: (_d, c) => c.normal?.available && c.normal.ratio != null ? `Nos últimos ${c.normal.period.days} dias choveu ${Math.round(c.normal.observed_mm)} mm na sua região (${c.normal.label}; o normal para o período é ${Math.round(c.normal.normal_mm)} mm · NASA POWER). A imagem mostra a umidade na zona das raízes.` : 'A imagem mostra a umidade na zona das raízes: marrom é solo seco, azul-esverdeado é solo úmido.',
    origin: 'real', defaultOpacity: 0.7,
  },
  {
    id: 'fogo', question: 'Tem fogo perto?', label: 'Focos de fogo', icon: Flame,
    // VIIRS Thermal Anomalies no GIBS é só vetor (MVT); usamos o raster do satélite geoestacionário GOES-Leste
    // (cobre o Brasil, imagem a cada 10 min). Subdiário: TIME com só a data devolve a imagem daquele dia.
    gibs: { layer: 'GOES-East_ABI_FireTemp', matrix: 'GoogleMapsCompatible_Level7', ext: 'png', maxzoom: 7, latencyDays: 0, cadence: 'a cada 10 min', emptyMeans: 'Nenhum foco de fogo detectado sobre a sua propriedade nesta imagem.' },
    legend: { colors: ['#fff36b', '#ffae00', '#ff3b1f'], labels: ['', 'temperatura de fogo', ''], unit: 'pixel ≈ 2 km', note: 'Também monitorado pelo INPE (BDQueimadas).' },
    source: { chip: 'NASA GIBS · GOES-Leste', detail: 'Temperatura de fogo (ABI), 2 km · INPE BDQueimadas' },
    meaning: () => 'Pontos amarelos a vermelhos são fogo detectado pelo satélite. Mantenha os aceiros limpos na época seca e confira o INPE (BDQueimadas) para focos perto de você.',
    origin: 'real', defaultOpacity: 1,
  },
  {
    id: 'zarc', question: 'Quando plantar?', label: 'Risco climático (Zarc)', icon: ShieldAlert,
    legend: { discrete: true, colors: [RISK_COLOR(20), RISK_COLOR(30), RISK_COLOR(40), RISK_COLOR(0)], labels: ['20%', '30%', '40%', 'fora'], unit: 'risco oficial de perder a lavoura pelo clima', note: 'Cinza = fora da janela indicada (sem zoneamento para a data).' },
    source: { chip: 'Zarc · MAPA', detail: 'Zoneamento Agrícola de Risco Climático da safra vigente, no seu município' },
    meaning: (date, c) => {
      const when = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const rows = c.fields.filter((f) => f.zarc)
      if (!rows.length) return 'As cores mostram o risco oficial de perder a lavoura pelo clima para a cultura de cada talhão. Ainda não há talhão com cultura que tenha zoneamento (Zarc) neste município.'
      const lines = rows.map((f) => { const r = riskFor(f, date); return `${f.name} (${f.crop.replace(' irrigado', '').toLowerCase()}): ${r ? `${r}%` : 'fora da janela'}` })
      return `Risco oficial de perda pelo clima se plantar em ${when} — ${lines.join(' · ')}. Fora da janela do Zarc, o produtor pode perder acesso ao Proagro e ao seguro com subsídio.`
    },
    origin: 'real', defaultOpacity: 0.8,
  },
]

export function RISK_COLOR(risk: number | null) {
  return risk == null ? '#9ca3af' : risk === 0 ? '#6b7280' : risk <= 20 ? '#2E7D4F' : risk <= 30 ? '#D69E2E' : '#C0392B'
}

/** Texto curto do risco: "risco 40%" · "fora da janela" · "sem zoneamento". */
export const riskPill = (r: number | null) => (r == null ? 'sem zoneamento' : r ? `risco ${r}%` : 'fora da janela')

/** Decêndio do ano (0..35) — o Zarc é publicado por decêndio. */
export function decendio(d: Date) {
  const day = d.getDate()
  return d.getMonth() * 3 + (day <= 10 ? 0 : day <= 20 ? 1 : 2)
}

/** Risco Zarc oficial do talhão na data (0 = fora da janela). `null` = sem zoneamento para esta cultura/município (ou fonte fora). */
export function riskFor(field: MapField, date: Date): number | null {
  return field.zarc ? field.zarc[decendio(date)] ?? null : null
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

export type FcDay = { date: string; d: string; t: number; min: number; rain: number }

/** Previsão real (Open-Meteo, via API) dos próximos 7 dias a partir de hoje; vazia se a fonte está fora e sem cache. */
export function useForecast(): { days: FcDay[]; status: string; fetchedAt?: string; loading: boolean } {
  const w = useWeather()
  const days = (w.data?.available ? w.data.daily : []).slice(0, 7).map((x) => ({ date: x.date, d: weekdayOf(x.date), t: Math.round(x.tmax), min: Math.round(x.tmin), rain: x.rain_mm ?? 0 }))
  return { days, status: w.data?.status ?? (w.error ? 'offline' : 'live'), fetchedAt: w.data?.fetched_at, loading: w.loading }
}

/** Dia da previsão para um deslocamento 0..6 a partir de hoje. */
export const forecastAt = (days: FcDay[], offset: number) => (offset >= 0 ? days[offset] : undefined)

/** Contexto dos textos das camadas: chuva prevista e chuva × normal (ambos reais). */
export function useMeaningCtx(fields: MapField[]): MeaningCtx {
  const { days } = useForecast()
  const normal = useRainNormal().data
  const peak = days.reduce<FcDay | null>((a, b) => (!a || b.rain > a.rain ? b : a), null)
  return { rain7: days.length ? days.reduce((s, x) => s + x.rain, 0) : null, peak: peak ? { d: peak.d, mm: peak.rain } : null, normal, fields }
}
