// Números de exemplo compartilhados entre "Minha propriedade" e "Pergunte à IA" (para as telas não se contradizerem).
export const brl0 = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export const FERTILIZER = [
  { item: 'NPK', qty: '1.150 kg', value: 4830 },
  { item: 'Ureia', qty: '800 kg', value: 3440 },
]
export const FERTILIZER_TOTAL = FERTILIZER.reduce((s, f) => s + f.value, 0) // 8.270

export const COST_BY_CATEGORY = [
  { label: 'Adubo', value: FERTILIZER_TOTAL, color: '#2E7D4F' },
  { label: 'Sementes', value: 5900, color: '#B7791F' },
  { label: 'Defensivos', value: 4150, color: '#C0392B' },
  { label: 'Combustível', value: 1980, color: '#3B82A6' },
  { label: 'Outros', value: 1260, color: '#94A39A' },
]
export const COST_TOTAL = COST_BY_CATEGORY.reduce((s, c) => s + c.value, 0) // 21.560

export const COST_BY_FIELD = [
  { name: 'Talhão 1', area: 5.36, value: 10850, color: '#2E7D4F' },
  { name: 'Talhão 2', area: 3.08, value: 5680, color: '#B7791F' },
  { name: 'Talhão 3', area: 2.05, value: 5030, color: '#3B82A6' },
]
