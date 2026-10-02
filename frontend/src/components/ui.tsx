// Componentes visuais compartilhados. Use estes em todas as telas para manter a identidade única.
import clsx from 'clsx'
import { X } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ title, action, children, className, padded = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={clsx('rounded-xl border border-border bg-surface shadow-sm', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={clsx(padded && 'p-4')}>{children}</div>
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...p}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'iso-btn bg-primary font-semibold text-white hover:bg-primary-dark',
        variant === 'secondary' && 'border border-border bg-surface text-ink hover:bg-bg',
        variant === 'ghost' && 'text-muted hover:bg-bg hover:text-ink',
        variant === 'danger' && 'bg-danger text-white hover:opacity-90',
        className,
      )}
    />
  )
}

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray'
const TONE: Record<Tone, string> = {
  green: 'bg-primary-soft text-primary-dark', amber: 'bg-accent-soft text-accent', red: 'bg-danger-soft text-danger',
  blue: 'bg-info-soft text-info', gray: 'bg-bg text-muted border border-border',
}
export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', TONE[tone], className)}>{children}</span>
}

export function Stat({ label, value, hint, icon, tone = 'green' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {icon && <span className={clsx('rounded-lg p-1.5', TONE[tone])}>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  )
}

export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16" onMouseDown={onClose}>
      <div className={clsx('w-full rounded-xl bg-surface shadow-xl', wide ? 'max-w-3xl' : 'max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-bg" aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Label({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

const inputCls = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft'
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(inputCls, p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={clsx(inputCls, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={clsx(inputCls, p.className)} />

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">{children}</div>
}

export function Loading() {
  return <div className="p-6 text-sm text-muted">Carregando…</div>
}

export function ErrorBox({ error }: { error: string }) {
  return <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">{error}</div>
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">{head.map((h, i) => <th key={i} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}
