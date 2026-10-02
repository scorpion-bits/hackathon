// Tipos e estado da entrevista do protótipo visual (D-009). Nada aqui chama a API.

export type FieldDraft = {
  id: number
  name: string
  areaHa: number
  /** anel do polígono em [lng, lat], fechado (primeiro ponto repetido no fim) */
  ring: [number, number][]
  color: string
  crop?: string
  soil?: string
  irrigation?: string
}

export type Municipality = { name: string; uf: string; ibge: string; lat: number; lon: number }

export type Answers = {
  profile?: string
  municipality?: Municipality
  fields: FieldDraft[]
  size?: string
  income?: string
  budget?: string
  credit: string[]
  machines: string[]
  /** ordem de clique = prioridade */
  concerns: string[]
  goals: string[]
  channel?: string
  frequency?: string
  internet?: string
  language?: string
}

export const EMPTY_ANSWERS: Answers = { fields: [], credit: [], machines: [], concerns: [], goals: [] }

/** Valores pré-selecionados nas perguntas de preferência (o produtor só confirma). */
export const DEFAULTS = { channel: 'app', frequency: 'urgentes', internet: 'boa', language: 'simples' } as const

export type SetAnswers = (patch: Partial<Answers>) => void
