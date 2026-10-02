// Talhões e entrevista na API (M2): conversões FieldDraft (formato da entrevista/editor) ⇄ talhão da API.
import type { Answers, FieldDraft } from '../components/interview/types'
import { apiDelete, apiGet, apiPost, apiPut } from './client'

/** Talhão como a API devolve (backend: farmdata.field_dict). `crop` é o nome do Zarc; `crop_key` é o id do front. */
export type ApiField = {
  id: number; name: string; area_ha: number; color: string | null
  geometry: { type: 'Polygon'; coordinates: [number, number][][] }
  crop: string | null; crop_key: string | null; soil: string | null; irrigated: boolean; irrigation: string
  has_zarc?: boolean
  status?: { stage: string; label: string }
}

export type Onboarding = {
  answers: Answers | null
  farm: { id: number; name: string; municipality: string; uf: string; geocode: string; lat: number; lon: number; total_area_ha: number | null } | null
  fields: ApiField[]
}

export function fromApi(f: ApiField): FieldDraft {
  return {
    id: f.id, name: f.name, areaHa: f.area_ha, color: f.color ?? '#2E7D4F',
    ring: f.geometry.coordinates[0].map(([lng, lat]) => [lng, lat] as [number, number]),
    crop: f.crop_key ?? undefined, soil: f.soil ?? undefined, irrigation: f.irrigation,
  }
}

/** Corpo de POST/PUT /api/fields. A área é recalculada no servidor. */
export function toApi(d: FieldDraft) {
  return {
    name: d.name, color: d.color,
    geometry: { type: 'Polygon', coordinates: [d.ring] },
    crop_key: d.crop ?? null,
    soil: d.soil && d.soil !== 'nao_sei' ? d.soil : null,
    irrigation: d.irrigation ?? 'nao',
  }
}

export const listFields = () => apiGet<ApiField[]>('/fields').then((fs) => fs.map(fromApi))
export const createField = (d: FieldDraft) => apiPost<ApiField>('/fields', toApi(d)).then(fromApi)
export const updateField = (d: FieldDraft) => apiPut<ApiField>(`/fields/${d.id}`, toApi(d)).then(fromApi)
export const deleteField = (id: number) => apiDelete(`/fields/${id}`)

export const getOnboarding = () => apiGet<Onboarding>('/onboarding')
export const saveOnboarding = (a: Answers) => apiPost<Onboarding>('/onboarding', a)
