export const brl = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const num = (v: number | null | undefined, digits = 1) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: digits })

export const dateBR = (iso: string | null | undefined) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—'

export const dayMonth = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export const weekday = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

export const todayISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const CATEGORY_LABEL: Record<string, string> = {
  semente: 'Sementes', fertilizante: 'Fertilizantes', defensivo: 'Defensivos', combustivel: 'Combustível',
  ferramenta: 'Ferramentas', irrigacao: 'Irrigação', outro: 'Outros',
}

export const EVENT_LABEL: Record<string, string> = {
  plantio: 'Plantio', aplicacao: 'Aplicação', colheita: 'Colheita', compra: 'Compra', observacao: 'Observação', outro: 'Atividade',
}

export const SOIL_LABEL: Record<string, string> = { arenoso: 'Arenoso', medio: 'Textura média', argiloso: 'Argiloso (barrento)' }

export const RISK_COLOR: Record<number, string> = { 0: 'var(--color-risk-0)', 20: 'var(--color-risk-20)', 30: 'var(--color-risk-30)', 40: 'var(--color-risk-40)' }
export const RISK_LABEL: Record<number, string> = { 0: 'Fora da janela', 20: 'Risco baixo (20%)', 30: 'Risco médio (30%)', 40: 'Risco alto (40%)' }
