// Lógica da entrevista: respostas efetivas, fontes de dados "desbloqueadas" e geração do contexto.md.
// Estrutura do arquivo segue mock.CONTEXT_MD, preenchida com as respostas do produtor.
import {
  BUDGET_MD, CHANNELS, CONCERNS, CROPS, FREQUENCIES, GOALS, INCOME_MD, MACHINES, PROFILES, SIZES,
  labelOf, labelsOf, sizeFromHa,
} from './options'
import { DEFAULTS, type Answers, type FieldDraft } from './types'
import { fmtHa } from './format'

export const SOURCE_SHORT: Record<string, { name: string; wait: string }> = {
  zarc: { name: 'Zarc · risco climático', wait: 'falta: culturas' },
  clima: { name: 'Previsão do tempo', wait: 'falta: município' },
  satelite: { name: 'Imagens de satélite', wait: 'falta: município' },
  agrofit: { name: 'Agrofit · defensivos', wait: 'falta: culturas' },
  seguro: { name: 'Seguro rural (PSR)', wait: 'falta: renda ou crédito' },
  drones: { name: 'Drones e aviação agrícola', wait: 'falta: máquinas' },
  pivos: { name: 'Pivôs de irrigação', wait: 'falta: irrigação' },
}

export const totalHa = (a: Pick<Answers, 'fields'>) => a.fields.reduce((s, f) => s + f.areaHa, 0)

/** Aplica os valores pré-selecionados e a faixa de área deduzida dos talhões desenhados. */
export function withDefaults(a: Answers): Answers {
  return {
    ...a,
    size: a.size ?? (a.fields.length ? sizeFromHa(totalHa(a)) : undefined),
    channel: a.channel ?? DEFAULTS.channel,
    frequency: a.frequency ?? DEFAULTS.frequency,
    internet: a.internet ?? DEFAULTS.internet,
    language: a.language ?? DEFAULTS.language,
  }
}

export const cropOf = (f: FieldDraft) => CROPS.find((c) => c.id === f.crop)
const unique = <T,>(xs: T[]) => [...new Set(xs)]
export const cropLabels = (a: Answers) => unique(a.fields.map((f) => cropOf(f)?.label).filter(Boolean) as string[])
const isIrrigated = (f: FieldDraft) => !!f.irrigation && f.irrigation !== 'nao'

/** Para cada fonte do radar: motivo de estar ativa (já desbloqueada pelas respostas) ou null (ainda aguardando). */
export function sourceReasons(a: Answers): Record<string, string | null> {
  const mun = a.municipality
  const zarcCrops = unique(a.fields.map((f) => cropOf(f)).filter((c) => c?.zarc).map((c) => c!.zarcName!))
  const crops = cropLabels(a).map((c) => c.toLowerCase())
  const wantsMoney = a.credit.length > 0 || (!!a.income && a.income !== 'nd') || !!a.budget || a.goals.includes('credito') || a.concerns.includes('credito')
  return {
    zarc: mun && zarcCrops.length ? `Janelas de plantio de ${zarcCrops.join(', ')} em ${mun.name}` : null,
    clima: mun ? `Previsão de 16 dias sobre ${mun.name}` : null,
    satelite: mun ? 'Vegetação, calor e umidade num raio de 10 km' : null,
    agrofit: crops.length ? `Defensivos registrados para ${crops.join(', ')}` : null,
    seguro: wantsMoney ? 'Seguro rural com apoio do governo e crédito para o seu perfil' : null,
    drones: a.machines.length ? (a.machines.includes('drone') ? 'Operadores e regras de drone na sua região' : 'Serviços de drone e avião agrícola perto de você') : null,
    pivos: a.fields.some(isIrrigated) || a.concerns.includes('seca') ? 'Pressão sobre a água da sua bacia (irrigação)' : null,
  }
}

export const countSources = (a: Answers) => Object.values(sourceReasons(a)).filter(Boolean).length

/** Centro da propriedade (média dos vértices) ou do município. */
export function seat(a: Answers): { lat: number; lon: number; fromFields: boolean } | null {
  const pts = a.fields.flatMap((f) => f.ring.slice(0, -1))
  if (pts.length) return { lon: pts.reduce((s, p) => s + p[0], 0) / pts.length, lat: pts.reduce((s, p) => s + p[1], 0) / pts.length, fromFields: true }
  if (a.municipality) return { lat: a.municipality.lat, lon: a.municipality.lon, fromFields: false }
  return null
}

const fmt3 = (n: number) => n.toFixed(3)

export function creditText(credit: string[]): string {
  if (!credit.length) return 'não informado'
  if (credit.includes('nenhum')) return 'não usa crédito nem seguro rural hoje'
  const parts: string[] = []
  if (credit.includes('pronaf')) parts.push('usa PRONAF')
  if (credit.includes('proagro')) parts.push('usa Proagro')
  if (credit.includes('coop')) parts.push('crédito de cooperativa')
  parts.push(credit.includes('seguro') ? 'tem seguro rural' : 'não tem seguro rural')
  return parts.join(' · ')
}

export function machinesText(machines: string[]): string {
  if (!machines.length) return 'não informado'
  if (machines.includes('nenhum')) return 'sem máquinas próprias (usa serviço de terceiros ou trabalho manual)'
  const have = labelsOf(MACHINES, machines).map((m) => m.toLowerCase())
  const lacks: string[] = []
  if (!machines.includes('drone')) lacks.push('sem drone')
  if (!machines.includes('estacao')) lacks.push('sem estação meteorológica')
  const lack = lacks.join(' · ')
  return [have.join(', '), lack && lack[0].toUpperCase() + lack.slice(1)].filter(Boolean).join('\n- ')
}

export function internetText(id?: string): string {
  if (id === 'instavel') return 'instável (preferir respostas curtas, modo leve)'
  if (id === 'celular') return 'só no celular, sinal fraco (modo leve: respostas curtas, sem mapas pesados)'
  return 'boa'
}

const IRRIGATION_MD: Record<string, string> = { nao: 'sequeiro', aspersao: 'irrigado (aspersão)', gotejamento: 'irrigado (gotejamento)', pivo: 'irrigado (pivô)' }
const SOIL_MD: Record<string, string> = { arenoso: 'arenoso', medio: 'textura média', argiloso: 'argiloso', nao_sei: 'não informado' }

export function buildContextMd(input: Answers, now = new Date()): string {
  const a = withDefaults(input)
  const mun = a.municipality
  const date = now.toLocaleDateString('pt-BR')
  const s = seat(a)
  const reasons = sourceReasons(a)
  const crops = unique(a.fields.map((f) => cropOf(f)).filter(Boolean).map((c) => c!.label.toLowerCase()))
  const zarcCrops = unique(a.fields.map((f) => cropOf(f)).filter((c) => c?.zarc).map((c) => c!.zarcName!))
  const soils = unique(a.fields.map((f) => f.soil).filter((x) => x && x !== 'nao_sei').map((x) => (x === 'medio' ? 'médio' : x!)))
  const manejo = unique(a.fields.map((f) => (f.irrigation === undefined ? undefined : isIrrigated(f) ? 'irrigado' : 'sequeiro')).filter(Boolean) as string[])
  const alerts = ['chuva ≥ 50 mm/dia']
  if (a.concerns.includes('geada')) alerts.push('mínima ≤ 3 °C')
  if (a.concerns.includes('seca')) alerts.push('10 dias seguidos ou mais sem chuva')

  const L: string[] = []
  L.push('# Contexto do produtor — AgroBits')
  L.push(`> Gerado na entrevista inicial em ${date} · atualizado automaticamente a cada registro.`)
  L.push('> Usado pelos agentes para FILTRAR os dados abertos e sugerir só o que é útil. Você pode editar.')
  L.push('')
  L.push('## Perfil')
  L.push(`- Tipo: ${labelOf(PROFILES, a.profile)?.toLowerCase() ?? 'não informado'}`)
  L.push(`- Área total: ${labelOf(SIZES, a.size)?.toLowerCase() ?? 'não informada'}${a.fields.length ? ` (desenhado no mapa: ${fmtHa(totalHa(a))} ha)` : ''}`)
  L.push(`- Renda bruta anual com a produção: ${a.income ? INCOME_MD[a.income] : 'não informada'}`)
  L.push(`- Orçamento para a próxima safra: ${a.budget ? BUDGET_MD[a.budget] : 'não informado'}`)
  L.push(`- Crédito/seguro: ${creditText(a.credit)}`)
  L.push(`- Internet: ${internetText(a.internet)}`)
  L.push(`- Linguagem: ${a.language === 'tecnica' ? 'técnica (termos agronômicos permitidos)' : 'simples, sem termos técnicos'}`)
  L.push(`- Avisos: ${labelOf(CHANNELS, a.channel)?.toLowerCase()} · ${labelOf(FREQUENCIES, a.frequency)?.toLowerCase()}`)
  L.push('')
  L.push('## Localização')
  L.push(`- Município: ${mun ? `${mun.name}/${mun.uf} (IBGE ${mun.ibge})` : 'não informado'}`)
  L.push(s ? `- Coordenada ${s.fromFields ? 'da sede (centro dos talhões)' : 'aproximada (centro do município)'}: ${fmt3(s.lat)}, ${fmt3(s.lon)}` : '- Coordenada: não informada')
  L.push('')
  L.push('## Propriedade (desenhada no mapa)')
  if (a.fields.length) {
    L.push('| Talhão | Área | Cultura | Solo | Manejo |')
    L.push('|---|---|---|---|---|')
    a.fields.forEach((f) => {
      const c = cropOf(f)
      L.push(`| ${f.name} | ${fmtHa(f.areaHa)} ha | ${c ? c.mdName ?? c.label : 'a definir'} | ${f.soil ? SOIL_MD[f.soil] : 'não informado'} | ${f.irrigation ? IRRIGATION_MD[f.irrigation] : 'não informado'} |`)
    })
  } else {
    L.push('- Talhões ainda não desenhados (o produtor pulou esta etapa). Os filtros usam o município inteiro.')
  }
  L.push('')
  L.push('## Recursos')
  L.push(`- Máquinas: ${machinesText(a.machines)}`)
  L.push('')
  L.push('## Preocupações (em ordem)')
  if (a.concerns.length) a.concerns.forEach((c, i) => L.push(`${i + 1}. ${labelOf(CONCERNS, c)}`))
  else L.push('- não informadas')
  L.push('')
  L.push('## Objetivos')
  if (a.goals.length) labelsOf(GOALS, a.goals).forEach((g) => L.push(`- ${g}`))
  else L.push('- não informados')
  L.push('')
  L.push('## Filtros aplicados aos dados abertos')
  L.push(`- Zarc: município ${mun?.ibge ?? '—'} · culturas [${zarcCrops.join(', ') || 'a definir'}] · solos [${soils.join(', ') || 'estimado pela região'}] · manejo [${manejo.join(', ') || 'sequeiro'}]`)
  L.push(`- Agrofit: culturas [${crops.join(', ') || 'a definir'}] · priorizar classe toxicológica 4–5`)
  L.push(`- Clima: coordenada ${s?.fromFields ? 'da sede' : 'do município'} · alertas: ${alerts.join(', ')}`)
  L.push('- Satélite: raio de 10 km')
  if (reasons.seguro) L.push(`- Seguro rural e crédito: município e vizinhos · culturas [${crops.join(', ') || 'a definir'}]${a.credit.includes('pronaf') ? ' · programa já usado: PRONAF' : ''}`)
  if (reasons.drones) L.push(`- Região: ${a.machines.includes('drone') ? 'regras e operadores de drone' : 'drones e aviação agrícola'} do município e vizinhos`)
  if (reasons.pivos) L.push('- Pivôs centrais (ANA/Embrapa): bacia hidrográfica do município')
  if (a.language !== 'tecnica' || a.internet !== 'boa') L.push(`- Resposta: ${a.language === 'tecnica' ? 'técnica' : 'linguagem simples'}${a.internet !== 'boa' ? ' · modo leve (textos curtos, poucos gráficos)' : ''}`)
  L.push('')
  return L.join('\n')
}

