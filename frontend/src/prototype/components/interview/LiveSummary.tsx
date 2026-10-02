// Painel "O que estou aprendendo sobre você": resumo ao vivo + contador de fontes de dados que vamos filtrar.
import clsx from 'clsx'
import { BellRing, Landmark, Lock, MapPin, MessageCircle, Ruler, Sparkles, Sprout, Target, Tractor, TriangleAlert, UserRound, Wallet, Coins } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { SOURCES } from '../../mock'
import { BUDGET_MD, CHANNELS, CONCERNS, CREDITS, FREQUENCIES, GOALS, INCOME_MD, INTERNETS, MACHINES, PROFILES, SIZES, labelOf, labelsOf } from './options'
import type { Answers } from './types'
import { SOURCE_SHORT as SHORT, cropLabels, sourceReasons, totalHa, withDefaults } from './context'
import { fmtHa } from './format'

/** Contador animado + barra segmentada, uma fatia por fonte. */
export function SourceMeter({ a, compact }: { a: Answers; compact?: boolean }) {
  const reasons = sourceReasons(a)
  const n = Object.values(reasons).filter(Boolean).length
  return (
    <div>
      <div className="flex items-end gap-2">
        <span key={n} className="proto-anim inline-block animate-[proto-pop_.4s_ease-out] text-4xl font-extrabold leading-none text-primary-dark tabular-nums">{n}</span>
        <span className="pb-0.5 text-lg font-semibold text-muted">/ {SOURCES.length}</span>
      </div>
      <div className={clsx('font-medium text-ink', compact ? 'mt-1 text-xs' : 'mt-1.5 text-sm')}>fontes de dados que vamos filtrar para você</div>
      <div className="mt-2.5 flex gap-1" aria-hidden>
        {SOURCES.map((s) => (
          <span key={s.key} className="h-1.5 flex-1 rounded-full bg-border transition-all duration-500" style={reasons[s.key] ? { background: s.color } : undefined} />
        ))}
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, children, flash }: { icon: LucideIcon; label: string; children: ReactNode | null; flash: string }) {
  const empty = children == null
  return (
    <div key={flash} className={clsx('flex gap-3 rounded-lg px-2 py-2', !empty && 'proto-anim animate-[proto-flash_1.4s_ease-out]')}>
      <span className={clsx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors', empty ? 'bg-bg text-muted/60 ring-1 ring-border' : 'bg-primary-soft text-primary')}><Icon size={14} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</div>
        {empty ? <div className="text-[13px] italic text-muted/70">ainda não sei</div> : <div className="text-[13px] font-medium leading-snug text-ink">{children}</div>}
      </div>
    </div>
  )
}

export function LiveSummary({ answers, showPrefs, className }: { answers: Answers; showPrefs: boolean; className?: string }) {
  const a = withDefaults(answers)
  const reasons = sourceReasons(a)
  const crops = cropLabels(a)
  const ha = totalHa(a)
  const join = (xs: string[]) => (xs.length ? xs.join(', ') : null)
  const concern = a.concerns.length ? (
    <ol className="space-y-0.5">{a.concerns.map((c, i) => (
      <li key={c} className="flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">{i + 1}</span>{labelOf(CONCERNS, c)}</li>
    ))}</ol>
  ) : null
  const prefs = showPrefs
    ? `${labelOf(CHANNELS, a.channel)} · ${labelOf(FREQUENCIES, a.frequency)?.toLowerCase()} · internet ${labelOf(INTERNETS, a.internet)?.toLowerCase()}`
    : null

  return (
    <div className={clsx('flex flex-col', className)}>
      <div className="mb-4 flex items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white"><Sparkles size={17} /></span>
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-ink">O que estou aprendendo sobre você</h2>
          <p className="text-xs text-muted">Isto vira o seu <code className="rounded bg-bg px-1 font-mono text-[11px]">contexto.md</code></p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4"><SourceMeter a={a} /></div>

      <ul className="mt-3 space-y-0.5">
        {SOURCES.map((s) => {
          const why = reasons[s.key]
          return (
            <li key={s.key} className={clsx('rounded-lg px-2 py-1.5 text-xs transition-colors duration-500', why && 'bg-primary-soft/40')}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-500" style={{ background: why ? s.color : 'var(--color-border)' }} />
                <span className={clsx('font-semibold', why ? 'text-ink' : 'text-muted')}>{SHORT[s.key].name}</span>
                {why && <span className="whitespace-nowrap text-muted">· {s.agency.split(' / ')[0]}</span>}
                {!why && <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[10px] text-muted/80"><Lock size={10} />{SHORT[s.key].wait}</span>}
              </div>
              {why && <div className="pl-[18px] leading-snug text-muted animate-[proto-up_.3s_ease-out]">{why}</div>}
            </li>
          )
        })}
      </ul>

      <div className="mb-1 mt-5 text-[10px] font-semibold uppercase tracking-wide text-muted">Resumo até agora</div>
      <div className="divide-y divide-border/60">
        <Row icon={UserRound} label="Você é" flash={a.profile ?? ''}>{labelOf(PROFILES, a.profile) ?? null}</Row>
        <Row icon={MapPin} label="Onde fica" flash={a.municipality?.ibge ?? ''}>{a.municipality ? `${a.municipality.name}/${a.municipality.uf}` : null}</Row>
        <Row icon={Sprout} label="Propriedade" flash={`${a.fields.length}-${ha}-${crops.join()}`}>
          {a.fields.length ? <>{a.fields.length} {a.fields.length > 1 ? 'talhões' : 'talhão'} · {fmtHa(ha)} ha{crops.length > 0 && <span className="block text-muted">{crops.join(', ')}</span>}</> : null}
        </Row>
        <Row icon={Ruler} label="Área total" flash={a.size ?? ''}>{labelOf(SIZES, a.size) ?? null}</Row>
        <Row icon={Coins} label="Renda anual" flash={a.income ?? ''}>{a.income ? (a.income === 'nd' ? 'Prefere não dizer' : INCOME_MD[a.income].replace(/^./, (c) => c.toUpperCase())) : null}</Row>
        <Row icon={Wallet} label="Orçamento da safra" flash={a.budget ?? ''}>{a.budget ? BUDGET_MD[a.budget].replace(/^./, (c) => c.toUpperCase()) : null}</Row>
        <Row icon={Landmark} label="Crédito e seguro" flash={a.credit.join()}>{join(labelsOf(CREDITS, a.credit))}</Row>
        <Row icon={Tractor} label="Máquinas" flash={a.machines.join()}>{join(labelsOf(MACHINES, a.machines))}</Row>
        <Row icon={TriangleAlert} label="Preocupações" flash={a.concerns.join()}>{concern}</Row>
        <Row icon={Target} label="Objetivos" flash={a.goals.join()}>{join(labelsOf(GOALS, a.goals))}</Row>
        <Row icon={BellRing} label="Avisos" flash={prefs ?? ''}>{prefs}</Row>
        <Row icon={MessageCircle} label="Linguagem" flash={showPrefs ? (a.language ?? '') : ''}>{showPrefs ? (a.language === 'tecnica' ? 'Técnica' : 'Simples') : null}</Row>
      </div>
    </div>
  )
}
