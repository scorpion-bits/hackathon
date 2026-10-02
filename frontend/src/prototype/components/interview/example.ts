// Talhões de exemplo (mock.FIELDS) no formato da entrevista, para a demo rápida.
import { FIELDS } from '../../mock'
import type { FieldDraft } from './types'

const CROP_BY_NAME: Record<string, string> = { Soja: 'soja', Milho: 'milho', 'Feijão irrigado': 'feijao' }
const SOIL_BY_NAME: Record<string, string> = { Argiloso: 'argiloso', 'Textura média': 'medio' }

export function exampleFields(): FieldDraft[] {
  return FIELDS.map((f) => ({
    id: f.id,
    name: f.name,
    areaHa: f.area,
    ring: [...f.poly, f.poly[0]] as [number, number][],
    color: f.color,
    crop: CROP_BY_NAME[f.crop],
    soil: SOIL_BY_NAME[f.soil],
    irrigation: f.crop === 'Feijão irrigado' ? 'aspersao' : 'nao',
  }))
}

/** Município onde ficam os talhões de exemplo (Araraquara/SP, IBGE 3503208). */
export const EXAMPLE_IBGE = '3503208'
