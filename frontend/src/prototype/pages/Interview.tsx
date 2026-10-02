// ENTREVISTA do produtor (protótipo visual, D-009): wizard de cartões/chips que gera o contexto.md.
// Rota: /prototipo/entrevista. Sem Shell, tela cheia. Nada aqui chama a API.
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ProtoBanner } from '../components/Shell'
import { LiveSummary, SourceMeter } from '../components/interview/LiveSummary'
import { PropertyMap } from '../components/interview/PropertyMap'
import { ResultScreen } from '../components/interview/ResultScreen'
import { countSources, withDefaults } from '../components/interview/context'
import { EXAMPLE_IBGE, exampleFields } from '../components/interview/example'
import { MUNICIPALITIES } from '../components/interview/options'
import {
  BudgetStep, ConcernsStep, CreditStep, GoalsStep, IncomeStep, LanguageStep, LocationStep, MachinesStep, NotifyStep, ProfileStep, SizeStep, WelcomeStep,
} from '../components/interview/steps'
import { EMPTY_ANSWERS, type Answers, type FieldDraft } from '../components/interview/types'
import { ProtoStyles, StepHeader } from '../components/interview/ui'
import { SOURCES } from '../mock'

type StepId = 'welcome' | 'profile' | 'location' | 'map' | 'size' | 'income' | 'budget' | 'credit' | 'machines' | 'concerns' | 'goals' | 'notify' | 'language' | 'result'
/** `skip`: texto do botão para pular (só em perguntas opcionais). */
const STEPS: { id: StepId; skip?: string }[] = [
  { id: 'welcome' }, { id: 'profile' }, { id: 'location' }, { id: 'map', skip: 'Desenhar depois' }, { id: 'size', skip: 'Pular' },
  { id: 'income', skip: 'Pular' }, { id: 'budget', skip: 'Pular' }, { id: 'credit', skip: 'Pular' }, { id: 'machines', skip: 'Pular' },
  { id: 'concerns', skip: 'Pular' }, { id: 'goals', skip: 'Pular' }, { id: 'notify' }, { id: 'language' }, { id: 'result' },
]
const IDX = Object.fromEntries(STEPS.map((s, i) => [s.id, i])) as Record<StepId, number>
const QUESTIONS = STEPS.length - 2 // sem boas-vindas e sem resultado

const isValid = (id: StepId, a: Answers) => {
  switch (id) {
    case 'profile': return !!a.profile
    case 'location': return !!a.municipality
    case 'map': return a.fields.length > 0
    case 'size': return !!withDefaults(a).size
    case 'income': return !!a.income
    case 'budget': return !!a.budget
    case 'credit': return a.credit.length > 0
    case 'machines': return a.machines.length > 0
    case 'concerns': return a.concerns.length > 0
    case 'goals': return a.goals.length > 0
    default: return true
  }
}
const REQUIRED_HINT: Partial<Record<StepId, string>> = { profile: 'Escolha uma opção para continuar', location: 'Escolha o município para continuar' }

const DEMO_ANSWERS: Answers = {
  profile: 'familiar', municipality: MUNICIPALITIES.find((m) => m.ibge === EXAMPLE_IBGE), fields: exampleFields(),
  income: '150a360', budget: '30a60', credit: ['pronaf'], machines: ['trator', 'plantadeira', 'pulverizador'],
  concerns: ['seca', 'insumos', 'pragas'], goals: ['perdas', 'gastos', 'credito'], internet: 'instavel',
}

export default function Interview() {
  const nav = useNavigate()
  const loc = useLocation()
  const rawName = (loc.state as { name?: string } | null)?.name
  const firstName = rawName?.trim().split(/\s+/)[0]

  // ?demo=1 pula direto para o resultado com as respostas do João (atalho para o pitch)
  const [params] = useSearchParams()
  const demo = params.get('demo') === '1'
  const [step, setStep] = useState(demo ? STEPS.length - 1 : 0)
  const [reached, setReached] = useState(demo ? STEPS.length - 1 : 0)
  const [a, setA] = useState<Answers>(demo ? DEMO_ANSWERS : EMPTY_ANSWERS)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const scrollRef = useRef<HTMLElement>(null)

  const set = useCallback((patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch })), [])
  const setFields = useCallback((u: (prev: FieldDraft[]) => FieldDraft[]) => setA((prev) => ({ ...prev, fields: u(prev.fields) })), [])
  const loadExample = useCallback(() => setA((prev) => ({
    ...prev,
    fields: exampleFields(),
    // os talhões de exemplo ficam em Araraquara/SP: o município acompanha para o filtro fazer sentido
    municipality: prev.municipality?.ibge === EXAMPLE_IBGE ? prev.municipality : MUNICIPALITIES.find((m) => m.ibge === EXAMPLE_IBGE),
    size: undefined,
  })), [])

  const go = (i: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i))
    setStep(n)
    setReached((r) => Math.max(r, n))
    setSummaryOpen(false)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const cur = STEPS[step]
  const valid = isValid(cur.id, a)
  const isMap = cur.id === 'map'
  const isResult = cur.id === 'result'
  const showPanel = !isMap && !isResult && cur.id !== 'welcome'
  const kicker = `Pergunta ${step} de ${QUESTIONS}`
  const pct = Math.max(3, Math.round((step / (STEPS.length - 1)) * 100))
  const nSources = useMemo(() => countSources(withDefaults(a)), [a])
  const mapCenter: [number, number] = a.municipality ? [a.municipality.lat, a.municipality.lon] : [-21.83, -48.23]

  const body = () => {
    const p = { a, set, kicker }
    switch (cur.id) {
      case 'welcome': return <WelcomeStep name={firstName} />
      case 'profile': return <ProfileStep {...p} />
      case 'location': return <LocationStep {...p} />
      case 'size': return <SizeStep {...p} />
      case 'income': return <IncomeStep {...p} />
      case 'budget': return <BudgetStep {...p} />
      case 'credit': return <CreditStep {...p} />
      case 'machines': return <MachinesStep {...p} />
      case 'concerns': return <ConcernsStep {...p} />
      case 'goals': return <GoalsStep {...p} />
      case 'notify': return <NotifyStep {...p} />
      case 'language': return <LanguageStep {...p} />
      default: return null
    }
  }

  const continueLabel = cur.id === 'welcome' ? 'Começar' : cur.id === 'language' ? 'Gerar meu contexto' : 'Continuar'

  return (
    <div className="flex h-full flex-col bg-bg">
      <ProtoStyles />
      <ProtoBanner />

      <header className="shrink-0 border-b border-border bg-surface">
        <div className="flex h-14 items-center gap-3 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-base">🌱</span>
          <span className="text-lg font-bold leading-none text-ink">AgroIA</span>
          <span className="hidden text-sm text-muted sm:inline">· Entrevista inicial</span>
          <div className="ml-auto flex items-center gap-4 text-sm">
            {step > 0 && !isResult && <span className="font-medium text-muted tabular-nums">Etapa {step} de {QUESTIONS}</span>}
            {isResult && <span className="font-medium text-primary-dark">Última etapa</span>}
            <button type="button" onClick={() => nav('/prototipo/entrar')} className="rounded-lg px-2 py-1 text-muted hover:bg-bg hover:text-ink">Sair</button>
          </div>
        </div>
        <div className="h-1.5 bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progresso da entrevista">
          <div className="h-full rounded-r-full bg-primary transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {showPanel && (
            <div className="shrink-0 border-b border-border bg-surface lg:hidden">
              <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary"><Sparkles size={16} /></span>
                <span className="flex-1 text-sm text-ink"><b key={nSources} className="proto-anim inline-block animate-[proto-pop_.4s_ease-out] tabular-nums text-primary-dark">{nSources}</b> / {SOURCES.length} fontes de dados para você</span>
                <span className="text-xs text-muted">{summaryOpen ? 'fechar' : 'o que já sei'}</span>
                <ChevronDown size={16} className={clsx('text-muted transition-transform', summaryOpen && 'rotate-180')} />
              </button>
              {summaryOpen && (
                <div className="max-h-[60vh] overflow-y-auto border-t border-border px-4 pb-4 pt-3"><LiveSummary answers={a} showPrefs={reached >= IDX.notify} /></div>
              )}
            </div>
          )}

          <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {isMap ? (
              <PropertyMap
                fields={a.fields} setFields={setFields} center={mapCenter} onLoadExample={loadExample}
                footer={<SourceMeter a={withDefaults(a)} compact />}
                header={<StepHeader kicker={kicker} title="Desenhe sua propriedade" hint="Marque no mapa os cantos de cada plantação (talhão). Depois diga o que planta, como é a terra e se irriga. Só o essencial." />}
              />
            ) : isResult ? (
              <ResultScreen answers={a} onEdit={() => go(IDX.profile)} onFinish={() => nav('/prototipo')} />
            ) : (
              <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
                <div key={step} className="proto-anim animate-[proto-up_.35s_ease-out]">{body()}</div>
              </div>
            )}
          </main>

          {!isResult && (
            <footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
              <div className={clsx('mx-auto flex items-center gap-2 sm:gap-3', !isMap && 'max-w-2xl')}>
                {step > 0 && (
                  <button type="button" onClick={() => go(step - 1)} aria-label="Voltar" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-3 text-[15px] font-semibold text-muted transition hover:bg-bg hover:text-ink">
                    <ArrowLeft size={17} /> <span className="hidden sm:inline">Voltar</span>
                  </button>
                )}
                <div className="flex-1 text-right text-xs text-muted">
                  {!valid && REQUIRED_HINT[cur.id] && <span className="hidden sm:inline">{REQUIRED_HINT[cur.id]}</span>}
                </div>
                {cur.skip && !valid && (
                  <button type="button" onClick={() => go(step + 1)} className="whitespace-nowrap rounded-xl px-3 py-3 text-[15px] font-semibold text-muted underline-offset-4 transition hover:bg-bg hover:text-ink hover:underline">
                    <span className="sm:hidden">Pular</span><span className="hidden sm:inline">{cur.skip}</span>
                  </button>
                )}
                <button
                  type="button" disabled={!valid} onClick={() => go(step + 1)}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 py-3 text-base font-semibold text-white shadow-md sm:px-6 shadow-primary/20 transition hover:bg-primary-dark active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {continueLabel} <ArrowRight size={18} />
                </button>
              </div>
            </footer>
          )}
        </div>

        {showPanel && (
          <aside className="hidden w-[380px] shrink-0 overflow-y-auto border-l border-border bg-surface p-5 lg:block" aria-label="O que estou aprendendo sobre você">
            <LiveSummary answers={a} showPrefs={reached >= IDX.notify} />
          </aside>
        )}
      </div>
    </div>
  )
}
