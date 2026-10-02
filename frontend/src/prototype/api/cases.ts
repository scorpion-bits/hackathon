// Casos enviados à assistência técnica pública (M4, D-015). Resposta do técnico simulada e rotulada (D-019).
import { apiDelete, apiPost } from './client'
import { reloadPrefix, useApi } from './resource'

export type Expert = { id: string; name: string; kind: string; how: string; eta: string; free: boolean }
export type CaseRecord = {
  id: number; protocol: string; topic_key: string; field_id: number | null; expert_id: string; channel: string
  path: string | null; note: string | null; question: string | null; status: 'enviado' | 'respondido' | 'encerrado'
  reply: string | null; reply_is_example: boolean; created_at: string; consent_at: string | null
  snapshot: { question?: string; title?: string; field?: string | null; path_title?: string | null; sources?: { name: string; date: string | null }[] }
}

export const useExperts = () => useApi<Expert[]>('/experts')
export const useCases = () => useApi<CaseRecord[]>('/cases')

export async function sendCase(c: { topic_key: string; expert_id: string; channel: string; path?: string; note?: string }) {
  const made = await apiPost<CaseRecord>('/cases', { ...c, consent: true })
  reloadPrefix('/cases', '/topics', '/me')
  return made
}

export async function demoReply(id: number) {
  await apiPost(`/cases/${id}/demo-reply`)
  reloadPrefix('/cases')
}

/** "Recomeçar a demonstração" (só conta demo): apaga casos e escolhas. */
export async function resetCases() {
  await apiDelete('/cases')
  reloadPrefix('/cases', '/topics', '/me')
}

/** Data/hora em pt-BR a partir do ISO do servidor. */
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')
