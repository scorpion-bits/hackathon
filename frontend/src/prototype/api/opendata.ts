// Dados abertos e clima ao vivo (M4): tudo vem da API, que consulta a fonte (ou o último dado real guardado).
import { useApi } from './resource'

export type SourceInfo = { key: string; name: string; agency: string; url: string; notes: string; extracted_at: string; records: number | null; checked_at: string | null }
export type FunnelData = { available: boolean; municipality?: string; crops?: string[]; steps: { label: string; value: number; hint: string }[] }
export type WeatherDay = { date: string; tmax: number; tmin: number; rain_mm: number | null; rain_prob: number | null; summary: string }
export type Weather = { available: boolean; status: string; fetched_at?: string; error?: string; daily: WeatherDay[]; rain_next_7d_mm?: number }
export type RainNormal = { available: boolean; status: string; fetched_at?: string; error?: string; observed_mm: number; normal_mm: number; ratio: number | null; label: string; period: { start: string; end: string; days: number } }

export type PivotRow = { geocode: string; municipality: string; uf: string; series: { year: number; area_ha: number; pivots: number }[] }
export type Pivots = { available: boolean; status: string; fetched_at?: string; error?: string; radius_km?: number
  municipality?: PivotRow | null; neighbors?: PivotRow[]
  region?: { municipalities: number; with_pivots: number; pivots_1985: number; pivots_2019: number; area_1985_ha: number; area_2019_ha: number }
  notes?: string[] }
/** Pivôs centrais (ANA/Embrapa, ao vivo com cache). Sem `at`, usa a propriedade da conta; `null` não consulta. */
export function usePivots(at?: { lat: number; lon: number; geocode: string } | null) {
  const path = at === null ? null : at ? `/opendata/pivots?lat=${at.lat}&lon=${at.lon}&geocode=${at.geocode}` : '/opendata/pivots'
  return useApi<Pivots>(path)
}
export const useSources = () => useApi<SourceInfo[]>('/opendata/sources')
/** Total de registros oficiais nas bases abertas locais (soma de `records`); sem login. `null` enquanto carrega ou se a API não responde. */
export function useTotalRecords(): number | null {
  const list = useSources().data
  return list ? list.reduce((s, x) => s + (x.records ?? 0), 0) : null
}
export const useFunnel = () => useApi<FunnelData>('/opendata/funnel')
export const useWeather = () => useApi<Weather>('/weather')
export const useRainNormal = () => useApi<RainNormal>('/climate/rain-history')

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
/** "2026-10-02" → "sex" (sem fuso: a data da previsão já é a do local). */
export const weekdayOf = (iso: string) => WD[new Date(`${iso}T12:00:00`).getDay()]
/** "2026-10-02T21:05" → "02/10 21h" */
export function fmtWhen(iso?: string | null) {
  if (!iso) return 'data desconhecida'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${String(d.getHours()).padStart(2, '0')}h`
}
export const nfmt = (n: number) => n.toLocaleString('pt-BR')
