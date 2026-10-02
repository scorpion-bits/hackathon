// Talhões da conta como ESTADO compartilhado (M2): lidos de GET /api/fields e gravados na API.
// A interface pública (useFarmFields, setFarmFields, resetFarmFields) é a mesma do protótipo: as telas não mudam.
// setFarmFields aplica na hora (otimista) e, logo depois, grava a diferença com POST/PUT/DELETE, em fila.
//
// Truque deliberado para não reescrever as telas (até a M4): o array `FIELDS` de mock.ts é atualizado NO LUGAR,
// então toda tela que lê FIELDS ao montar já enxerga os talhões da conta.
import { useSyncExternalStore } from 'react'
import { ApiError, apiPost } from './api/client'
import { createField, deleteField, listFields, updateField } from './api/fields'
import { getSession, onSessionChange, signIn } from './api/session'
import { cropOf } from './components/interview/context'
import type { FieldDraft } from './components/interview/types'
import { FIELDS, PRODUCER } from './mock'

// status/risco ilustrativos do protótipo, por nome do talhão (a M3/M4 troca por dados reais)
const ORIGINAL = Object.fromEntries(FIELDS.map((f) => [f.name, { status: f.status, risk: f.risk, crop: f.crop }]))
const SOIL_LABEL: Record<string, string> = { arenoso: 'Arenoso', medio: 'Textura média', argiloso: 'Argiloso' }

function toField(d: FieldDraft): (typeof FIELDS)[number] {
  const crop = cropOf(d)
  const irrigated = !!d.irrigation && d.irrigation !== 'nao'
  const name = !crop ? 'Sem cultura' : crop.id === 'feijao' && irrigated ? 'Feijão irrigado' : crop.label
  const orig = ORIGINAL[d.name]
  return {
    id: d.id, name: d.name, crop: name, area: Math.round(d.areaHa * 100) / 100,
    soil: SOIL_LABEL[d.soil ?? ''] ?? 'Não informado',
    status: orig?.status ?? 'Aguardando plantio',
    color: d.color,
    risk: orig && orig.crop === name ? orig.risk : crop?.zarc ? 20 : 0,
    poly: d.ring.slice(0, -1),
  }
}

export type FarmSync = { status: 'loading' | 'ready' | 'saving' | 'error'; error?: string }

let drafts: FieldDraft[] = []
/** último estado confirmado pelo servidor, por id */
let synced = new Map<number, string>()
let sync: FarmSync = { status: 'loading' }
let loadedFor: number | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const key = (d: FieldDraft) => JSON.stringify([d.name, d.ring, d.color, d.crop, d.soil, d.irrigation])

function apply() {
  FIELDS.splice(0, FIELDS.length, ...drafts.map(toField))
  PRODUCER.area_ha = Math.round(drafts.reduce((s, d) => s + d.areaHa, 0) * 10) / 10
  const farm = getSession().me?.farm
  if (farm) Object.assign(PRODUCER, { municipality: farm.municipality, uf: farm.uf, geocode: farm.geocode, lat: farm.lat, lon: farm.lon })
}

function setSync(s: FarmSync) { sync = s; emit() }

/** Substitui tudo pelo que veio do servidor (carga inicial, entrevista salva). */
export function replaceFromServer(fields: FieldDraft[]) {
  drafts = fields
  synced = new Map(fields.map((f) => [f.id, key(f)]))
  apply()
  setSync({ status: 'ready' })
}

async function load(producerId: number) {
  loadedFor = producerId
  setSync({ status: 'loading' })
  try {
    replaceFromServer(await listFields())
  } catch (e) {
    if ((e as ApiError).status === 404) replaceFromServer([]) // conta sem propriedade ainda
    else setSync({ status: 'error', error: (e as Error).message })
  }
}

function watchSession() {
  const s = getSession()
  const id = s.me?.producer.id ?? null
  if (s.status === 'anon' && loadedFor !== null) { loadedFor = null; drafts = []; synced = new Map(); apply(); emit() }
  if (id !== null && id !== loadedFor) void load(id)
  else if (id !== null) apply() // /api/me recarregado (ex.: município mudou na entrevista)
}
onSessionChange(watchSession)
watchSession()

// ---- gravação: debounce + fila, para o arrastar de vértices não virar uma chuva de requisições ----
let timer: number | undefined
let chain: Promise<void> = Promise.resolve()

async function flush() {
  setSync({ status: 'saving' })
  try {
    const current = new Map(drafts.map((d) => [d.id, d]))
    for (const id of [...synced.keys()]) {
      if (!current.has(id)) { await deleteField(id); synced.delete(id) }
    }
    for (const d of drafts) {
      if (!synced.has(d.id)) {
        const saved = await createField(d)
        // troca o id local (gerado no mapa) pelo id do servidor, preservando o que foi editado nesse meio-tempo
        drafts = drafts.map((x) => (x.id === d.id ? { ...x, id: saved.id, areaHa: saved.areaHa } : x))
        synced.set(saved.id, key(d))
      } else if (synced.get(d.id) !== key(d)) {
        const saved = await updateField(d)
        drafts = drafts.map((x) => (x.id === d.id ? { ...x, areaHa: saved.areaHa } : x))
        synced.set(d.id, key(d))
      }
    }
    apply()
    setSync({ status: 'ready' })
  } catch (e) {
    setSync({ status: 'error', error: (e as Error).message })
  }
}

export function setFarmFields(next: FieldDraft[] | ((prev: FieldDraft[]) => FieldDraft[])) {
  drafts = typeof next === 'function' ? next(drafts) : next
  apply()
  setSync({ status: 'saving' })
  window.clearTimeout(timer)
  timer = window.setTimeout(() => { chain = chain.then(flush) }, 600)
}

/** "Voltar ao exemplo" (só conta demo): recarrega a conta do João no estado inicial. */
export async function resetFarmFields() {
  setSync({ status: 'saving' })
  try {
    const { token } = await apiPost<{ token: string }>('/auth/demo', { scenario: 'existente' })
    loadedFor = null
    await signIn(token) // dispara watchSession → load
  } catch (e) {
    setSync({ status: 'error', error: (e as Error).message })
  }
}

export function useFarmFields(): FieldDraft[] {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => drafts)
}

export function useFarmSync(): FarmSync {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => sync)
}
