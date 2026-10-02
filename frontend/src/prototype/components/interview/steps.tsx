// Etapas "simples" da entrevista (cartões e chips). O mapa e o resultado ficam em arquivos próprios.
import clsx from 'clsx'
import {
  ArrowRight, Check, Funnel, Info, Landmark, LoaderCircle, LocateFixed, MapPin, MousePointerClick, Search, ShieldCheck, SkipForward, Sprout, Wifi, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FUNNEL } from '../../mock'
import {
  BUDGETS, CHANNELS, CONCERNS, CREDITS, FREQUENCIES, GOALS, INCOMES, INTERNETS, MACHINES, MUNICIPALITIES, PROFILES, SIZES, sizeFromHa,
} from './options'
import type { Answers, SetAnswers } from './types'
import { DEFAULTS } from './types'
import { fmtHa, toggleIn } from './format'
import { OptionCard, StepHeader, WhyBox } from './ui'
import { totalHa } from './context'
import type { Opt } from './options'

type P = { a: Answers; set: SetAnswers; kicker: string }

const Grid = ({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) => (
  <div role="group" className={clsx('grid gap-3', cols === 2 && 'sm:grid-cols-2')}>{children}</div>
)

/** Lista de opções de escolha única. */
function SingleList({ opts, value, onPick, cols }: { opts: Opt[]; value?: string; onPick: (id: string) => void; cols?: 1 | 2 }) {
  return (
    <Grid cols={cols}>
      {opts.map((o) => <OptionCard key={o.id} icon={o.icon} title={o.label} hint={o.hint} selected={value === o.id} onClick={() => onPick(o.id)} />)}
    </Grid>
  )
}

/** Lista de múltipla escolha. `exclusive` limpa as outras ao ser marcada (ex.: "Nenhum"). */
function MultiList({ opts, value, onChange, exclusive, cols }: { opts: Opt[]; value: string[]; onChange: (v: string[]) => void; exclusive?: string; cols?: 1 | 2 }) {
  return (
    <Grid cols={cols}>
      {opts.map((o) => <OptionCard key={o.id} multi icon={o.icon} title={o.label} hint={o.hint} selected={value.includes(o.id)} onClick={() => onChange(toggleIn(value, o.id, exclusive))} />)}
    </Grid>
  )
}

// ---------------------------------------------------------------- 1. boas-vindas
export function WelcomeStep({ name }: { name?: string }) {
  const tiles: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: MousePointerClick, title: 'Quase só cliques', text: 'Você escolhe em cartões grandes. Quase não precisa escrever.' },
    { icon: SkipForward, title: 'Pule o que quiser', text: 'Só o tipo de produtor e o município são obrigatórios.' },
    { icon: ShieldCheck, title: 'Seus dados, suas regras', text: 'Usados só para personalizar. Não vendemos nada a ninguém.' },
  ]
  return (
    <div>
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25">
        <Sprout size={32} />
      </div>
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{name ? `Olá, ${name}!` : 'Olá!'} Vamos conhecer a sua roça.</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">
        São <b className="text-ink">5 minutos, quase só cliques</b>. Com o que você contar, o AgroIA separa, entre milhões de dados abertos do governo, <b className="text-ink">só o que serve para a sua propriedade</b>.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {tiles.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary"><Icon size={18} /></span>
            <div className="mt-3 text-[15px] font-semibold text-ink">{title}</div>
            <p className="mt-1 text-[13px] leading-snug text-muted">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4">
        <Funnel size={20} className="mt-0.5 shrink-0 text-primary" />
        <div className="text-sm text-primary-dark">
          Hoje analisamos <b>{FUNNEL[0].value} registros oficiais</b>. Depois da entrevista, eles viram <b>{FUNNEL[3].value} recomendações</b> para você.
          <span className="ml-1 text-xs text-primary-dark/70">(exemplo)</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- 2. perfil
export function ProfileStep({ a, set, kicker }: P) {
  return (
    <>
      <StepHeader kicker={kicker} title="Você é…" hint="Escolha o que mais combina com você. Isso muda o tipo de ajuda e de programa que vamos sugerir." />
      <SingleList opts={PROFILES} value={a.profile} onPick={(profile) => set({ profile })} />
    </>
  )
}

// ---------------------------------------------------------------- 3. município
export function LocationStep({ a, set, kicker }: P) {
  const [q, setQ] = useState('')
  const [locating, setLocating] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const list = useMemo(() => {
    const n = norm(q.trim())
    const base = n ? MUNICIPALITIES.filter((m) => norm(`${m.name} ${m.uf}`).includes(n)) : MUNICIPALITIES.slice(0, 6)
    return base.slice(0, 6)
  }, [q])
  const sel = a.municipality

  const locate = () => {
    setLocating(true)
    timer.current = window.setTimeout(() => { set({ municipality: MUNICIPALITIES[0] }); setLocating(false); setQ('') }, 1100)
  }

  return (
    <>
      <StepHeader kicker={kicker} title="Onde fica a sua propriedade?" hint="Com o município buscamos a previsão do tempo, o zoneamento de risco e os dados da sua região." />
      {sel && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary-soft/60 p-3.5 animate-[proto-up_.25s_ease-out]">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white"><MapPin size={22} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-ink">{sel.name}/{sel.uf}</div>
            <div className="text-[13px] text-muted">Código IBGE {sel.ibge}</div>
          </div>
          <button type="button" onClick={() => set({ municipality: undefined })} className="rounded-lg p-2 text-muted hover:bg-white/60 hover:text-ink" aria-label="Trocar município"><X size={18} /></button>
        </div>
      )}
      {!sel && (
        <>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Digite o nome do município" aria-label="Buscar município" autoComplete="off"
              className="w-full rounded-2xl border-2 border-border bg-surface py-3.5 pl-11 pr-4 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-soft"
            />
          </div>
          <button
            type="button" onClick={locate} disabled={locating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/30 px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-primary-soft/70 disabled:opacity-70"
          >
            {locating ? <LoaderCircle size={18} className="animate-spin" /> : <LocateFixed size={18} />}
            {locating ? 'Procurando onde você está…' : 'Usar minha localização'}
          </button>
          <div className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">{q.trim() ? 'Resultados' : 'Sugestões'}</div>
          <div className="grid gap-2">
            {list.map((m) => (
              <button key={m.ibge} type="button" onClick={() => { set({ municipality: m }); setQ('') }}
                className="flex min-h-[56px] items-center gap-3 rounded-xl border border-border bg-surface px-4 text-left transition hover:border-primary/50 hover:bg-primary-soft/40">
                <MapPin size={18} className="text-primary" />
                <span className="flex-1 text-[15px] font-medium text-ink">{m.name}<span className="text-muted"> / {m.uf}</span></span>
                <ArrowRight size={16} className="text-muted" />
              </button>
            ))}
            {!list.length && <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">Não achamos esse município na lista de exemplo.</div>}
          </div>
          <p className="mt-3 text-xs text-muted">Protótipo com {MUNICIPALITIES.length} municípios de exemplo. Na versão final, os 5.570 municípios do IBGE.</p>
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------- 5. tamanho
export function SizeStep({ a, set, kicker }: P) {
  const ha = totalHa(a)
  const derived = a.fields.length ? sizeFromHa(ha) : undefined
  const value = a.size ?? derived
  return (
    <>
      <StepHeader kicker={kicker} title="Qual o tamanho total da sua área?" hint="Hectare (ha) é pouco mais que um campo de futebol. Pode ser um valor aproximado." />
      {derived && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-primary-soft/70 px-3 py-2.5 text-[13px] text-primary-dark">
          <Check size={16} className="mt-0.5 shrink-0" />
          <span>Já marcamos uma faixa pela soma dos talhões que você desenhou: <b>{fmtHa(ha)} ha</b>. Pode mudar se a propriedade for maior.</span>
        </div>
      )}
      <SingleList opts={SIZES} value={value} onPick={(size) => set({ size })} />
    </>
  )
}

// ---------------------------------------------------------------- 6. renda
export function IncomeStep({ a, set, kicker }: P) {
  return (
    <>
      <StepHeader kicker={kicker} title="Quanto a sua produção rende por ano, mais ou menos?" hint="Renda bruta anual: tudo o que entra com a venda da produção, antes de pagar os custos." />
      <SingleList opts={INCOMES} value={a.income} onPick={(income) => set({ income })} />
      <WhyBox icon={Landmark} tone="green">
        <b>Por que perguntamos?</b> Usamos para indicar <b>programas de crédito e seguro adequados</b> ao seu porte. Fica só no seu contexto e você pode pular. As faixas são indicativas: confirme as regras do ano com seu banco ou cooperativa.
      </WhyBox>
    </>
  )
}

// ---------------------------------------------------------------- 7. orçamento
export function BudgetStep({ a, set, kicker }: P) {
  return (
    <>
      <StepHeader kicker={kicker} title="Quanto pretende gastar na próxima safra?" hint="Some sementes, adubo, defensivos, combustível e mão de obra. Um valor aproximado já ajuda." />
      <SingleList opts={BUDGETS} value={a.budget} onPick={(budget) => set({ budget })} />
      <WhyBox icon={Info}>Com o orçamento checamos se o plano de plantio cabe no bolso e quais linhas de custeio fazem sentido.</WhyBox>
    </>
  )
}

// ---------------------------------------------------------------- 8. crédito e seguro
export function CreditStep({ a, set, kicker }: P) {
  return (
    <>
      <StepHeader kicker={kicker} title="Você já usa crédito ou seguro?" hint="Pode marcar mais de um." />
      <MultiList opts={CREDITS} value={a.credit} exclusive="nenhum" onChange={(credit) => set({ credit })} />
    </>
  )
}

// ---------------------------------------------------------------- 9. máquinas
export function MachinesStep({ a, set, kicker }: P) {
  return (
    <>
      <StepHeader kicker={kicker} title="Que máquinas e tecnologia você tem?" hint="Pode marcar mais de um. Isso evita sugerir coisas que você não consegue fazer." />
      <MultiList opts={MACHINES} value={a.machines} exclusive="nenhum" onChange={(machines) => set({ machines })} />
    </>
  )
}

// ---------------------------------------------------------------- 10. preocupações
export function ConcernsStep({ a, set, kicker }: P) {
  const full = a.concerns.length >= 3
  const click = (id: string) => {
    if (a.concerns.includes(id)) set({ concerns: a.concerns.filter((c) => c !== id) })
    else if (!full) set({ concerns: [...a.concerns, id] })
  }
  return (
    <>
      <StepHeader kicker={kicker} title="O que mais preocupa você?" hint="Escolha até 3. A ordem em que você toca é a ordem de importância: o 1 é o que mais preocupa." />
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
        {a.concerns.length} de 3 escolhidas {full && <Check size={13} />}
      </div>
      <Grid>
        {CONCERNS.map((o) => {
          const i = a.concerns.indexOf(o.id)
          return <OptionCard key={o.id} multi icon={o.icon} title={o.label} hint={o.hint} selected={i >= 0} order={i >= 0 ? i + 1 : undefined} disabled={full && i < 0} onClick={() => click(o.id)} />
        })}
      </Grid>
    </>
  )
}

// ---------------------------------------------------------------- 11. objetivos
export function GoalsStep({ a, set, kicker }: P) {
  return (
    <>
      <StepHeader kicker={kicker} title="O que você quer alcançar na próxima safra?" hint="Pode marcar mais de um." />
      <MultiList opts={GOALS} value={a.goals} onChange={(goals) => set({ goals })} />
    </>
  )
}

// ---------------------------------------------------------------- 12. avisos
function MiniCard({ opt, selected, onClick }: { opt: Opt; selected: boolean; onClick: () => void }) {
  const Icon = opt.icon
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={clsx('relative flex min-h-[88px] flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition-all duration-200 active:scale-[.98]',
        selected ? 'border-primary bg-primary-soft/60 shadow-sm' : 'border-border bg-surface hover:border-primary/40')}>
      <span className="flex w-full items-center justify-between">
        <span className={clsx('grid h-9 w-9 place-items-center rounded-lg transition-colors', selected ? 'bg-primary text-white' : 'bg-primary-soft text-primary')}><Icon size={18} /></span>
        <span className={clsx('grid h-5 w-5 place-items-center rounded-full border-2 transition-all', selected ? 'border-primary bg-primary text-white' : 'border-border text-transparent')}><Check size={12} strokeWidth={3} /></span>
      </span>
      <span className="text-sm font-semibold leading-tight text-ink">{opt.label}</span>
      {opt.hint && <span className="text-xs leading-snug text-muted">{opt.hint}</span>}
    </button>
  )
}

export function NotifyStep({ a, set, kicker }: P) {
  const channel = a.channel ?? DEFAULTS.channel
  const frequency = a.frequency ?? DEFAULTS.frequency
  const internet = a.internet ?? DEFAULTS.internet
  const group = (title: string, opts: Opt[], value: string, onPick: (id: string) => void) => (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-ink">{title}</h2>
      <div role="radiogroup" aria-label={title} className="grid gap-2.5 sm:grid-cols-3">
        {opts.map((o) => <MiniCard key={o.id} opt={o} selected={value === o.id} onClick={() => onPick(o.id)} />)}
      </div>
    </div>
  )
  return (
    <>
      <StepHeader kicker={kicker} title="Como prefere receber os avisos?" hint="Já deixamos uma opção marcada. Mude só se quiser." />
      {group('Por onde?', CHANNELS, channel, (id) => set({ channel: id }))}
      {group('Com que frequência?', FREQUENCIES, frequency, (id) => set({ frequency: id }))}
      {group('Como é a sua internet?', INTERNETS, internet, (id) => set({ internet: id }))}
      {internet !== 'boa' ? (
        <WhyBox icon={Wifi} tone="green">
          <b>Vamos usar o modo leve.</b> Respostas curtas, poucos gráficos e mapas só quando você pedir, para funcionar bem mesmo com sinal fraco. Avisos por SMS chegam até sem internet.
        </WhyBox>
      ) : (
        <WhyBox icon={Info}>Se a internet cair, o AgroIA guarda o que você registrou e sincroniza quando o sinal voltar.</WhyBox>
      )}
    </>
  )
}

// ---------------------------------------------------------------- 13. linguagem
export function LanguageStep({ a, set, kicker }: P) {
  const value = a.language ?? DEFAULTS.language
  const opts = [
    { id: 'simples', title: 'Linguagem simples', tag: 'Recomendado', example: 'Vai chover forte na quinta. Não passe veneno na quarta e proteja o solo que acabou de ser preparado.' },
    { id: 'tecnica', title: 'Linguagem técnica', tag: 'Para técnicos e agrônomos', example: 'Precipitação prevista de 62 mm/24 h na quinta. Evitar aplicação de defensivos na quarta; risco de erosão em solo exposto.' },
  ]
  return (
    <>
      <StepHeader kicker={kicker} title="Como prefere que a gente fale com você?" hint="Isso vale para os avisos, as recomendações e as respostas da IA. Dá para trocar depois." />
      <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
        {opts.map((o) => {
          const on = value === o.id
          return (
            <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => set({ language: o.id })}
              className={clsx('flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[.99]', on ? 'border-primary bg-primary-soft/60 shadow-sm' : 'border-border bg-surface hover:border-primary/40')}>
              <span className="flex items-center justify-between gap-2">
                <span>
                  <span className="block text-[15px] font-semibold text-ink">{o.title}</span>
                  <span className="text-xs text-muted">{o.tag}</span>
                </span>
                <span className={clsx('grid h-6 w-6 place-items-center rounded-full border-2 transition-all', on ? 'border-primary bg-primary text-white' : 'border-border text-transparent')}><Check size={14} strokeWidth={3} /></span>
              </span>
              <span className="rounded-xl bg-bg px-3 py-2.5 text-[13px] italic leading-relaxed text-ink ring-1 ring-border">“{o.example}”</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
