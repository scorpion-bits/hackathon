// Cliente da API do AgroBits. Tipos espelham backend/app/routers/api.py (contrato: docs/api.md).

export type Source = { key: string; name?: string; agency?: string; url?: string; extracted_at?: string; notes?: string }

export type FieldStatus = { stage: 'plantado' | 'colhido' | 'vazio'; crop: string | null; since: string | null; days: number | null; label: string }
export type Polygon = { type: 'Polygon'; coordinates: number[][][] }
export type FieldT = {
  id: number; name: string; geometry: Polygon; area_ha: number; crop: string | null
  soil: 'arenoso' | 'medio' | 'argiloso' | null; irrigated: boolean; seed_rate_kg_ha: number | null
  color: string | null; notes: string | null; status: FieldStatus
}
export type FieldInput = Omit<FieldT, 'id' | 'area_ha' | 'status'>

export type StockItemT = {
  id: number; name: string; category: Category; unit: string; quantity: number; min_quantity: number
  avg_price: number | null; stock_value: number | null; expiry_date: string | null; days_to_expiry: number | null
  supplier: string | null; crop: string | null; agrofit_registration: string | null; low_stock: boolean
}
export type Category = 'semente' | 'fertilizante' | 'defensivo' | 'combustivel' | 'ferramenta' | 'irrigacao' | 'outro'
export type MovementT = {
  id: number; item_id: number; item_name: string; unit: string; category: Category; kind: 'entrada' | 'saida' | 'ajuste'
  quantity: number; unit_price: number | null; value: number | null; date: string; supplier: string | null
  note: string | null; event_id: number | null; field_id: number | null
}
export type EventType = 'plantio' | 'aplicacao' | 'colheita' | 'compra' | 'observacao' | 'outro'
export type EventT = {
  id: number; field_id: number | null; season_id: number | null; type: EventType; date: string; title: string
  details: Record<string, any>; origin: string; inputs: MovementT[]
}
export type AlertT = {
  key: string; kind: 'estoque' | 'validade' | 'zarc' | 'clima'; severity: 'critico' | 'atencao' | 'info'
  title: string; why: string; link: string; field_ids: number[]; item_ids: number[]; source: Source | null; read: boolean
}
export type WeatherDay = { date: string; tmax: number; tmin: number; rain_mm: number; rain_prob: number | null; code: number; summary: string }
export type WeatherT = {
  available: boolean; status: 'live' | 'cache' | 'stale' | 'simulated' | 'offline'; fetched_at?: string; error?: string
  current?: { temp: number; humidity: number; rain_mm: number; wind_kmh: number; summary: string }
  daily?: WeatherDay[]; rain_next_7d_mm?: number; source?: Source
}
export type ZarcT = {
  available: boolean; reason?: string; safra?: string; crop?: string; cycle_label?: string; soil_label?: string
  soil_estimated?: boolean; management?: string; ordinance?: string; risk?: number[]; labels?: string[]
  notes?: string[]; source?: Source; today_decendio?: number
}
export type PlanOption = { decendio: number; label: string; start: string; risk: number; rain_mm?: number; heavy_rain?: boolean }
export type PlanT = {
  field: string; field_id: number; crop: string; area_ha: number; zarc: ZarcT; recommendation: string
  options?: PlanOption[]; best?: PlanOption; now?: PlanOption; weather_status?: string
  seed?: { rate_kg_ha: number | null; rate_origin: string | null; available_kg: number; needed_kg?: number; missing_kg?: number; items: string[] }
}
export type CostsT = {
  season: string; purchased_by_category: Record<string, number>; purchased_total: number
  applied_by_category: Record<string, number>; applied_total: number; applied_by_field: Record<string, number>
  consumption: { item: string; quantity: number; value: number; unit: string }[]
  harvest: { field: string; date: string; crop: string; quantity: number; unit: string }[]; method: string
}
export type RegionT = {
  available: boolean; municipality?: string; uf?: string; drones?: number; planes?: number; authorizations_last_year?: number
  insurance_policies?: number | null; insurance_top_crops?: string | null; zarc_crops?: string[]; uf_drones?: number
  br_municipalities_with_drones?: number; br_municipalities?: number; sources?: Source[]; notes?: string[]
}
export type FarmT = {
  id: number; name: string; municipality: string; uf: string; geocode: string; lat: number; lon: number; total_area_ha: number
  producer: { id: number; name: string; is_demo: boolean }; current_season: { id: number; name: string } | null
  seasons: { id: number; name: string; start: string; end: string }[]
}
export type DashboardT = {
  season: string
  kpis: { fields: number; area_ha: number; planted: number; stock_value: number; items_attention: number; season_purchased: number; season_applied: number; alerts_open: number }
  fields: FieldT[]; alerts: AlertT[]; recent_events: EventT[]; weather: WeatherT; region: RegionT
}
export type Draft = {
  kind: 'plantio' | 'aplicacao' | 'colheita' | 'compra'; date: string; field_id: number | null; field_name: string | null
  item_id: number | null; item_name: string | null; quantity: number | null; unit: string | null; total_price: number | null
  crop: string | null; missing: string[]
}
export type ChatReply = { answer: string; sources: Source[]; tools: string[]; mode: 'llm' | 'offline'; draft: Draft | null; warning?: string }
export type ProfileT = { producer: { name: string; is_demo: boolean }; facts: { id: number; label: string; value: string; origin: 'declarado' | 'registro' | 'oficial'; updated_at: string }[] }
export type AgrofitT = {
  found: boolean; product: string; brands?: string[]; registration?: string; ingredient?: string; product_class?: string
  tox_class?: string; env_class?: string; organic?: string; crop?: string | null; registered_for_crop?: boolean | null
  crops?: string[]; pests_for_crop?: string | null; disclaimer?: string; source: Source
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Erro ${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}
const post = <T,>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) })
const put = <T,>(path: string, body: unknown) => req<T>(path, { method: 'PUT', body: JSON.stringify(body) })
const del = (path: string) => req<void>(path, { method: 'DELETE' })
const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams()
  Object.entries(o).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && p.set(k, String(v)))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  farm: () => req<FarmT>('/farm'),
  dashboard: () => req<DashboardT>('/dashboard'),
  fields: () => req<FieldT[]>('/fields'),
  createField: (f: FieldInput) => post<FieldT>('/fields', f),
  updateField: (id: number, f: FieldInput) => put<FieldT>(`/fields/${id}`, f),
  deleteField: (id: number) => del(`/fields/${id}`),
  fieldZarc: (id: number, crop?: string) => req<ZarcT>(`/fields/${id}/zarc${qs({ crop })}`),
  fieldPlan: (id: number, crop?: string, seed_rate_kg_ha?: number) => req<PlanT>(`/fields/${id}/plan${qs({ crop, seed_rate_kg_ha })}`),
  events: (f: { field_id?: number; season_id?: number; type?: string } = {}) => req<EventT[]>(`/events${qs(f)}`),
  createEvent: (e: { type: EventType; date: string; field_id?: number | null; title?: string; details?: Record<string, unknown>; inputs?: { item_id: number; quantity: number }[]; origin?: string }) => post<EventT>('/events', e),
  deleteEvent: (id: number) => del(`/events/${id}`),
  items: () => req<StockItemT[]>('/stock/items'),
  createItem: (i: Partial<StockItemT>) => post<StockItemT>('/stock/items', i),
  updateItem: (id: number, i: Partial<StockItemT>) => put<StockItemT>(`/stock/items/${id}`, i),
  deleteItem: (id: number) => del(`/stock/items/${id}`),
  movements: (item_id?: number) => req<MovementT[]>(`/stock/movements${qs({ item_id })}`),
  createMovement: (item_id: number, m: { kind: 'entrada' | 'saida' | 'ajuste'; quantity: number; date: string; unit_price?: number | null; supplier?: string | null; note?: string | null; field_id?: number | null }) =>
    post<MovementT>(`/stock/items/${item_id}/movements`, m),
  costs: (season_id?: number) => req<CostsT>(`/reports/costs${qs({ season_id })}`),
  alerts: () => req<AlertT[]>('/alerts'),
  readAlert: (key: string) => post<void>(`/alerts/${encodeURIComponent(key)}/read`, {}),
  weather: () => req<WeatherT>('/weather'),
  crops: () => req<{ zarc_crops: string[]; other_crops: string[] }>('/opendata/crops'),
  agrofit: (product: string, crop?: string) => req<AgrofitT>(`/opendata/agrofit${qs({ product, crop })}`),
  agrofitSearch: (q: string) => req<{ registration: string; brand: string; product_class: string; tox_class: string }[]>(`/opendata/agrofit/search${qs({ q })}`),
  region: () => req<RegionT>('/opendata/region'),
  sources: () => req<Source[]>('/opendata/sources'),
  profile: () => req<ProfileT>('/profile'),
  addFact: (f: { label: string; value: string; origin?: string }) => post<{ id: number }>('/profile/facts', f),
  updateFact: (id: number, f: { label: string; value: string; origin: string }) => put<{ id: number }>(`/profile/facts/${id}`, f),
  deleteFact: (id: number) => del(`/profile/facts/${id}`),
  chat: (message: string, context?: Record<string, unknown>) => post<ChatReply>('/assistant/chat', { message, context }),
  chatHistory: () => req<{ role: 'user' | 'assistant'; content: string; sources: Source[]; created_at: string }[]>('/assistant/history'),
  clearChat: () => del('/assistant/history'),
  assistantStatus: () => req<{ llm: boolean; mode: string }>('/assistant/status'),
}

/** Notifica telas para recarregar após qualquer registro (painel, sino de alertas etc.). */
export const DATA_CHANGED = 'agroia:data-changed'
export const notifyDataChanged = () => window.dispatchEvent(new Event(DATA_CHANGED))
