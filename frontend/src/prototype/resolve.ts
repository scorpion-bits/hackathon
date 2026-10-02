// FLUXO GUIADO (protótipo visual, D-009): cada aviso da tela inicial vira um "problema" com
// 1) o que os dados mostram  2) soluções sugeridas pelo agente  3) o que acontece depois de escolher.
// Textos de exemplo; números marcados como dado oficial vêm das bases analisadas (ver mock.ts).
import { useSyncExternalStore } from 'react'
import { INSIGHTS } from './mock'

export type Evidence = 'zarc-milho' | 'zarc-soja' | 'rain' | 'seeds' | 'agrofit' | 'drones'

export type Solution = {
  id: string; title: string; detail: string; pros: string[]; cons: string[]; recommended?: boolean
  /** o que o app faz quando o produtor escolhe esta opção */
  then: string[]
}

export type Problem = {
  id: string; question: string; evidence: Evidence; fieldId?: number
  evidenceTitle: string; evidenceNote: string; solutions: Solution[]
}

/** Zarc oficial · soja · Araraquara · 2026/27 · solo argiloso: 20% de 11/10 até o fim do ano (decêndios 29–36). */
export const ZARC_SOJA = Array.from({ length: 36 }, (_, i) => (i >= 28 ? 20 : 0))

export const PROBLEMS: Record<string, Problem> = {
  i1: {
    id: 'i1', question: 'Quando plantar o milho do Talhão 2?', evidence: 'zarc-milho', fieldId: 2,
    evidenceTitle: 'Risco de perder a lavoura pelo clima, por data de plantio',
    evidenceNote: 'Zarc 2026/27 · MAPA · Araraquara · milho 1ª safra · solo argiloso',
    solutions: [
      { id: 'esperar', recommended: true, title: 'Plantar a partir de 21/10',
        detail: 'Esperar 19 dias e plantar na janela de menor risco.',
        pros: ['Risco cai de 40% para 20%', 'Dentro da janela oficial: mantém Proagro e seguro com subvenção'],
        cons: ['Colheita fica ~3 semanas mais tarde'],
        then: ['Lembrete em 18/10: preparar o solo do Talhão 2', 'Lembrete em 21/10: início da janela de 20%', 'Se a previsão mudar, avisamos antes'] },
      { id: 'agora', title: 'Plantar agora (até 10/10)',
        detail: 'Manter o plano original de plantar no início de outubro.',
        pros: ['Colheita mais cedo'],
        cons: ['Risco de 40%: em 2 de cada 5 anos há perda por clima', 'Prêmio de seguro tende a ser mais caro'],
        then: ['Lembrete de monitoramento de chuva a cada 3 dias', 'Checklist de seguro rural para plantio com risco alto'] },
      { id: 'trocar', title: 'Trocar o Talhão 2 para soja',
        detail: 'A soja já está na janela de 20% desde 11/10 para o seu solo.',
        pros: ['Plantio pode começar já na próxima semana', 'Mesmo risco baixo (20%)'],
        cons: ['Precisa comprar semente de soja', 'Muda o planejamento de rotação'],
        then: ['Talhão 2 marcado como "soja" no planejamento', 'Calculamos a semente de soja necessária para 3,08 ha'] },
    ],
  },
  i2: {
    id: 'i2', question: 'Como se proteger da chuva forte de quinta?', evidence: 'rain', fieldId: 2,
    evidenceTitle: 'Chuva prevista para a sua coordenada (mm por dia)',
    evidenceNote: 'Previsão Open-Meteo',
    solutions: [
      { id: 'antecipar', recommended: true, title: 'Antecipar a aplicação para segunda',
        detail: 'Segunda e terça estão secas: o produto tem tempo de agir antes da chuva.',
        pros: ['Evita que a chuva lave o defensivo', 'Não perde a janela de controle'],
        cons: ['Precisa reorganizar a semana'],
        then: ['Lembrete na segunda, 7h: aplicar no Talhão 2', 'Aviso se a previsão de segunda mudar'] },
      { id: 'adiar', title: 'Adiar para sábado, depois da chuva',
        detail: 'Esperar o solo drenar e aplicar no fim de semana.',
        pros: ['Sem risco de lavagem'],
        cons: ['Atrasa o controle em 5 dias'],
        then: ['Lembrete no sábado de manhã'] },
      { id: 'palhada', title: 'Cobrir o solo exposto com palhada',
        detail: 'O Talhão 2 foi preparado em 20/09 e está sem cobertura.',
        pros: ['Reduz a erosão com 62 mm'],
        cons: ['Mão de obra extra nesta semana'],
        then: ['Tarefa criada: cobertura do Talhão 2 até quarta'] },
    ],
  },
  i3: {
    id: 'i3', question: 'Como resolver a falta de semente de milho?', evidence: 'seeds', fieldId: 2,
    evidenceTitle: 'Semente necessária × semente em estoque',
    evidenceNote: 'Área desenhada (3,08 ha) × taxa informada (20 kg/ha) × seu estoque',
    solutions: [
      { id: 'comprar', recommended: true, title: 'Comprar 25 kg (com 10% de margem)',
        detail: 'Cobre os 22 kg que faltam e uma sobra para replantio de falhas.',
        pros: ['Planta o talhão inteiro', 'Dá tempo: o plantio é a partir de 21/10'],
        cons: ['Custo extra estimado de ~R$ 1.100 (exemplo)'],
        then: ['Item "semente de milho" adicionado à lista de compras', 'Lembrete em 14/10 se a compra não for registrada'] },
      { id: 'reduzir', title: 'Plantar só 2 ha de milho',
        detail: 'Usar os 40 kg que já tem e deixar 1 ha para outra cultura.',
        pros: ['Sem gasto agora'],
        cons: ['Produz ~35% menos milho'],
        then: ['Talhão 2 dividido no planejamento: 2 ha milho + 1,08 ha a definir'] },
      { id: 'coop', title: 'Comprar pela cooperativa com crédito',
        detail: 'Você usa PRONAF: dá para incluir a semente no custeio.',
        pros: ['Paga depois da colheita'],
        cons: ['Depende do prazo da cooperativa'],
        then: ['Resumo para levar à cooperativa: área, cultura e quantidade'] },
    ],
  },
  i4: {
    id: 'i4', question: 'Quando plantar a soja do Talhão 1?', evidence: 'zarc-soja', fieldId: 1,
    evidenceTitle: 'Risco climático da soja por data de plantio',
    evidenceNote: 'Zarc 2026/27 · MAPA · Araraquara · soja · solo argiloso (classe estimada pela textura)',
    solutions: [
      { id: 'janela', recommended: true, title: 'Plantar entre 11/10 e 20/11',
        detail: 'Começo da janela de menor risco, com folga para a segunda safra.',
        pros: ['Risco de 20%', 'Permite safrinha depois'],
        cons: [],
        then: ['Lembrete em 11/10: janela aberta para a soja do Talhão 1'] },
      { id: 'tarde', title: 'Plantar em dezembro',
        detail: 'O risco continua 20%, mas a colheita atrasa.',
        pros: ['Mais tempo para preparar'],
        cons: ['Inviabiliza a segunda safra no talhão'],
        then: ['Lembrete em 01/12'] },
    ],
  },
  i5: {
    id: 'i5', question: 'O que fazer com o fungicida que vence em 10 dias?', evidence: 'agrofit', fieldId: 3,
    evidenceTitle: 'Registro oficial do produto no seu estoque',
    evidenceNote: 'Agrofit · MAPA · registro 00218',
    solutions: [
      { id: 'usar', recommended: true, title: 'Usar no feijão do Talhão 3, se precisar',
        detail: 'É registrado para feijão contra mofo-branco. Vistorie o talhão nesta semana.',
        pros: ['Uso correto e dentro da validade', 'Evita desperdício'],
        cons: ['Só aplique se houver sinal da doença'],
        then: ['Checklist de vistoria do mofo-branco no Talhão 3', 'Lembrete em 10/10: último dia útil antes do vencimento'] },
      { id: 'devolver', title: 'Devolver na revenda (logística reversa)',
        detail: 'Produto vencido não pode ser usado; a revenda é obrigada a receber.',
        pros: ['Descarte correto, sem multa'],
        cons: ['Perde o valor do produto'],
        then: ['Endereço da revenda e o que levar (nota fiscal)'] },
    ],
  },
  i6: {
    id: 'i6', question: 'Vale contratar pulverização por drone?', evidence: 'drones', fieldId: 1,
    evidenceTitle: 'Drones agrícolas registrados no MAPA',
    evidenceNote: 'SIPEAGRO · MAPA · agregado por município (sem dado pessoal)',
    solutions: [
      { id: 'orcamento', recommended: true, title: 'Pedir orçamento para o Talhão 1',
        detail: 'Útil para a parte inclinada, onde o pulverizador de barra não entra bem.',
        pros: ['14 drones registrados no seu município', 'Aplicação mais localizada'],
        cons: ['Custo por hectare costuma ser maior que o próprio'],
        then: ['Resumo do talhão (área, cultura, declive) pronto para enviar a operadores'] },
      { id: 'depois', title: 'Agora não',
        detail: 'Guardar a informação para a próxima safra.',
        pros: [], cons: [],
        then: ['Volta a aparecer na próxima safra'] },
    ],
  },
}

export const ORDER = INSIGHTS.map((i) => i.id)

// ------------- estado "resolvido" (por visitante; o protótipo funciona mesmo sem armazenamento)
const KEY = 'agroia-proto-resolved'
let state: Record<string, string> = (() => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
})()
const listeners = new Set<() => void>()
function set(next: Record<string, string>) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* sem armazenamento: segue só em memória */ }
  listeners.forEach((l) => l())
}
export const resolveProblem = (id: string, solutionId: string) => set({ ...state, [id]: solutionId })
export const resetResolved = () => set({})
export function useResolved() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
}
export const nextOpen = (resolved: Record<string, string>, after?: string) => {
  const start = after ? ORDER.indexOf(after) + 1 : 0
  return [...ORDER.slice(start), ...ORDER.slice(0, start)].find((id) => !resolved[id])
}

// ------------- MODELO A (D-015): o AgroBits não decide — prepara o caso e leva à assistência técnica PÚBLICA.
// Instituições reais citadas como EXEMPLO de integração (sem convênio firmado); nenhum técnico/pessoa é nomeado.
export type Expert = { id: string; name: string; kind: string; how: string; eta: string; free: boolean }
export const EXPERTS: Expert[] = [
  { id: 'cati', name: 'CATI · Casa da Agricultura de Araraquara', kind: 'Assistência técnica pública do Estado de SP', how: 'Técnico ou engenheiro agrônomo responde e, se precisar, agenda visita', eta: 'resposta em até 5 dias úteis (exemplo)', free: true },
  { id: 'senar', name: 'Senar · Assistência Técnica e Gerencial', kind: 'Programa gratuito para produtor rural', how: 'Técnico de campo acompanha a propriedade por meses', eta: 'contato em até 10 dias (exemplo)', free: true },
  { id: 'prefeitura', name: 'Secretaria de Agricultura do município', kind: 'Apoio municipal ao produtor', how: 'Orientação, máquinas da patrulha agrícola e programas locais', eta: 'resposta em até 7 dias (exemplo)', free: true },
]
/** Quem é mais indicado para cada assunto (receituário de defensivo exige engenheiro agrônomo — Lei 7.802/89). */
export const BEST_EXPERT: Record<string, string> = { i1: 'cati', i2: 'cati', i3: 'senar', i4: 'cati', i5: 'cati', i6: 'prefeitura' }

export type CaseRecord = { problemId: string; expertId: string; channel: string; path?: string; note?: string; protocol: string; sentAt: string }
const CKEY = 'agroia-proto-cases'
let cases: Record<string, CaseRecord> = (() => { try { return JSON.parse(localStorage.getItem(CKEY) ?? '{}') } catch { return {} } })()
const clisteners = new Set<() => void>()
export function sendCase(c: Omit<CaseRecord, 'protocol' | 'sentAt'>) {
  const protocol = `AB-${String(1000 + Object.keys(cases).length + 1)}`
  cases = { ...cases, [c.problemId]: { ...c, protocol, sentAt: new Date().toLocaleDateString('pt-BR') } }
  try { localStorage.setItem(CKEY, JSON.stringify(cases)) } catch { /* só em memória */ }
  clisteners.forEach((l) => l())
  resolveProblem(c.problemId, c.path ?? 'encaminhado')
}
export function resetCases() {
  cases = {}
  try { localStorage.setItem(CKEY, '{}') } catch { /* só em memória */ }
  clisteners.forEach((l) => l())
  resetResolved()
}
export function useCases() {
  return useSyncExternalStore((l) => { clisteners.add(l); return () => clisteners.delete(l) }, () => cases)
}
