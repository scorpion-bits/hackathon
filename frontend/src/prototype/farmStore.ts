// Talhões do protótipo como ESTADO compartilhado (D-009): o que o produtor desenha na entrevista ou edita no
// mapa passa a valer em todas as telas. Guardado no navegador (localStorage); sem armazenamento, vale só na sessão.
//
// Truque deliberado para não reescrever as telas: o array `FIELDS` de mock.ts é atualizado NO LUGAR, então
// toda tela que lê FIELDS ao montar já enxerga a versão editada.
import { useSyncExternalStore } from 'react'
import { cropOf } from './components/interview/context'
import { exampleFields } from './components/interview/example'
import type { FieldDraft } from './components/interview/types'
import { FIELDS, PRODUCER } from './mock'

const KEY = 'agroia-proto-fields'
const ORIGINAL_STATUS = Object.fromEntries(FIELDS.map((f) => [f.id, f.status]))
const ORIGINAL_RISK = Object.fromEntries(FIELDS.map((f) => [f.id, f.risk]))
/** Talhões de exemplo (João) — usados no início e no "voltar ao exemplo". */
export const EXAMPLE_DRAFTS: FieldDraft[] = exampleFields()

const SOIL_LABEL: Record<string, string> = { arenoso: 'Arenoso', medio: 'Textura média', argiloso: 'Argiloso' }

function toField(d: FieldDraft): (typeof FIELDS)[number] {
  const crop = cropOf(d)
  const irrigated = !!d.irrigation && d.irrigation !== 'nao'
  const name = !crop ? 'Sem cultura' : crop.id === 'feijao' && irrigated ? 'Feijão irrigado' : crop.label
  return {
    id: d.id, name: d.name, crop: name, area: Math.round(d.areaHa * 100) / 100,
    soil: SOIL_LABEL[d.soil ?? ''] ?? 'Não informado',
    status: ORIGINAL_STATUS[d.id] ?? 'Aguardando plantio',
    color: d.color,
    // risco ilustrativo para talhões novos: 20% se a cultura tem zoneamento (Zarc), senão "fora"
    risk: ORIGINAL_RISK[d.id] !== undefined && crop?.id === EXAMPLE_DRAFTS.find((e) => e.id === d.id)?.crop ? ORIGINAL_RISK[d.id] : crop?.zarc ? 20 : 0,
    poly: d.ring.slice(0, -1),
  }
}

let drafts: FieldDraft[] = (() => {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? (JSON.parse(saved) as FieldDraft[]) : EXAMPLE_DRAFTS
  } catch { return EXAMPLE_DRAFTS }
})()
const listeners = new Set<() => void>()

function apply() {
  FIELDS.splice(0, FIELDS.length, ...drafts.map(toField))
  PRODUCER.area_ha = Math.round(drafts.reduce((s, d) => s + d.areaHa, 0) * 10) / 10
}
apply()

export function setFarmFields(next: FieldDraft[] | ((prev: FieldDraft[]) => FieldDraft[])) {
  drafts = typeof next === 'function' ? next(drafts) : next
  apply()
  try { localStorage.setItem(KEY, JSON.stringify(drafts)) } catch { /* sem armazenamento: só nesta sessão */ }
  listeners.forEach((l) => l())
}

export const resetFarmFields = () => setFarmFields(EXAMPLE_DRAFTS)

export function useFarmFields(): FieldDraft[] {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => drafts)
}
