// Pequenos helpers de formatação/seleção usados pela entrevista.
export const toggleIn = (list: string[], id: string, exclusive?: string) => {
  if (list.includes(id)) return list.filter((x) => x !== id)
  if (exclusive && id === exclusive) return [id]
  return [...list.filter((x) => x !== exclusive), id]
}

export const fmtHa = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
