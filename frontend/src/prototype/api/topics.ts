// Assuntos do início guiado e da tela Resolver (M3/M4): GET /api/topics, calculados no servidor.
import { apiPost } from './client'
import { reloadPrefix, useApi } from './resource'

export type SourceRef = { key: string; name: string; agency: string | null; date: string | null }
export type Path = { id: string; title: string; detail: string; pros: string[]; cons: string[]; then: string[]; recommended?: boolean }
export type Priority = 'agir' | 'atencao' | 'oportunidade' | 'info'

export type Evidence =
  | { type: 'zarc'; series: number[]; labels: string[]; today_decendio: number; crop: string; soil: string; soil_estimated: boolean; safra: string; cycle: string; management: string; notes: string[] }
  | { type: 'rain'; threshold_mm: number; status: string; fetched_at: string | null; days: { date: string; mm: number | null; prob: number | null }[] }
  | { type: 'rain_normal'; observed_mm: number; normal_mm: number; ratio: number; label: string; period: { start: string; end: string; days: number }; status: string; notes: string[] }
  | { type: 'seeds'; area_ha: number; rate_kg_ha: number; needed_kg: number; have_kg: number; missing_kg: number; items: { name: string; kg: number }[] }
  | { type: 'agrofit'; item: string; quantity: number; unit: string; expiry_date: string; days_to_expiry: number; registration: string | null; found: boolean; brand: string | null; ingredient: string | null; tox_class: string | null; registered_crops: string[]; matches: { crop: string; pests?: string }[] }
  | { type: 'drones'; municipality: string; drones: number; planes: number | null; uf: string; uf_drones: number; br_municipalities_with_drones: number; br_municipalities: number }

export type Topic = {
  key: string; kind: string; priority: Priority; title: string; summary: string; question: string; why: string[]
  sources: SourceRef[]; field_id: number | null; field: string | null; evidence: Evidence; evidence_note?: string
  paths: Path[]; expert_id: string; choice: string | null
}

/** status por fonte: live | cache (frescos) · stale (último dado real guardado) · offline · simulated (só testes) · local */
export type SourceStatusMap = Record<string, string>
export type TopicsData = { topics: Topic[]; sources_status: SourceStatusMap; generated_at: string; farm: { municipality: string; uf: string; is_demo: boolean } | null }

export const useTopics = () => useApi<TopicsData>('/topics')

export async function setTopicChoice(key: string, choice: string | null) {
  await apiPost(`/topics/${encodeURIComponent(key)}/choice`, { choice })
  reloadPrefix('/topics')
}

/** Assuntos ainda sem escolha, na ordem do servidor (do mais urgente ao informativo). */
export const openTopics = (topics: Topic[]) => topics.filter((t) => !t.choice)
