// Peças visuais da entrevista: cartões grandes, chips, cabeçalho de etapa e animações.
import clsx from 'clsx'
import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Keyframes usados pelas telas de Login e Entrevista (global, mas com prefixo próprio). */
export function ProtoStyles() {
  return (
    <style>{`
      @keyframes proto-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      @keyframes proto-pop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.18); } 100% { transform: scale(1); opacity: 1; } }
      @keyframes proto-flash { from { background-color: var(--color-primary-soft); } to { background-color: transparent; } }
      @keyframes proto-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes proto-sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .proto-anim { animation: none !important; } }
    `}</style>
  )
}

export function OptionCard({ icon: Icon, title, hint, selected, onClick, order, disabled, multi, className }: {
  icon: LucideIcon; title: string; hint?: string; selected: boolean; onClick: () => void
  /** posição na ordem de prioridade (1, 2, 3…) quando selecionado */
  order?: number; disabled?: boolean; multi?: boolean; className?: string
}) {
  return (
    <button
      type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} disabled={disabled} onClick={onClick}
      className={clsx(
        'group relative flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all duration-200 active:scale-[.99]',
        selected ? 'border-primary bg-primary-soft/60 shadow-sm' : 'border-border bg-surface hover:-translate-y-px hover:border-primary/40 hover:shadow-sm',
        disabled && 'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-border hover:shadow-none',
        className,
      )}
    >
      <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-200', selected ? 'bg-primary text-white' : 'bg-primary-soft text-primary group-hover:bg-primary/15')}>
        <Icon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight text-ink">{title}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{hint}</span>}
      </span>
      <span className={clsx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-all duration-200', selected ? 'border-primary bg-primary text-white' : 'border-border text-transparent')}>
        {selected ? (order ? <span key={order} className="proto-anim animate-[proto-pop_.3s_ease-out]">{order}</span> : <Check size={14} strokeWidth={3} />) : <Check size={14} />}
      </span>
    </button>
  )
}

/** Chip clicável. Com `hint`, vira um mini-cartão de duas linhas. */
export function Chip({ icon: Icon, label, hint, selected, onClick, className }: {
  icon?: LucideIcon; label: string; hint?: string; selected: boolean; onClick: () => void; className?: string
}) {
  return (
    <button
      type="button" aria-pressed={selected} onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 border text-left text-sm font-medium transition-all duration-150 active:scale-95',
        hint ? 'rounded-xl px-3 py-2' : 'rounded-full px-3.5 py-2.5',
        selected ? 'border-primary bg-primary text-white shadow-sm' : 'border-border bg-surface text-ink hover:border-primary/50 hover:bg-primary-soft/50',
        className,
      )}
    >
      {Icon && <Icon size={16} className={clsx('shrink-0', selected ? 'text-white' : 'text-primary')} />}
      <span>
        <span className="block leading-tight">{label}</span>
        {hint && <span className={clsx('block text-[11px] font-normal leading-tight', selected ? 'text-white/85' : 'text-muted')}>{hint}</span>}
      </span>
    </button>
  )
}

export function StepHeader({ kicker, icon: Icon, title, hint }: { kicker?: string; icon?: LucideIcon; title: string; hint?: ReactNode }) {
  return (
    <header className="mb-5">
      {(kicker || Icon) && (
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          {Icon && <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft"><Icon size={15} /></span>}
          {kicker}
        </div>
      )}
      <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{title}</h1>
      {hint && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{hint}</p>}
    </header>
  )
}

/** Caixa de explicação (por que perguntamos isso). */
export function WhyBox({ icon: Icon, children, tone = 'info' }: { icon: LucideIcon; children: ReactNode; tone?: 'info' | 'green' | 'amber' }) {
  const t = { info: 'border-info/20 bg-info-soft text-info', green: 'border-primary/20 bg-primary-soft text-primary-dark', amber: 'border-accent/20 bg-accent-soft text-accent' }[tone]
  return (
    <div className={clsx('mt-5 flex items-start gap-2.5 rounded-xl border p-3 text-[13px] leading-relaxed', t)}>
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
