// Componentes de dados compartilhados: selo de fonte, faixa de risco Zarc, botão "Perguntar à IA", alerta.
import clsx from 'clsx'
import { AlertTriangle, Bot, CloudRain, Database, Package, ShieldAlert, Sprout } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AlertT, Source, ZarcT } from '../lib/api'
import { RISK_COLOR, RISK_LABEL, dateBR } from '../lib/format'

/** Selo obrigatório em todo dado oficial (regra de ética: fonte + data de extração). */
export function SourceBadge({ source, compact }: { source?: Source | null; compact?: boolean }) {
  if (!source) return null
  const label = source.key === 'agroia' ? 'Seus registros' : `${source.agency ?? ''}`.split('(')[0].trim() || source.name
  return (
    <a
      href={source.url} target="_blank" rel="noreferrer"
      title={`${source.name ?? ''}${source.extracted_at ? ` · extraído em ${dateBR(source.extracted_at)}` : ''}${source.notes ? ` · ${source.notes}` : ''}`}
      className="inline-flex items-center gap-1 rounded-md border border-info/20 bg-info-soft px-1.5 py-0.5 text-[11px] font-medium text-info hover:underline"
    >
      <Database size={11} />
      {compact ? label : `Fonte: ${source.name ?? label}${source.extracted_at ? ` · ${dateBR(source.extracted_at)}` : ''}`}
    </a>
  )
}

/** Faixa dos 36 decêndios do Zarc com marcador de hoje. */
export function RiskStrip({ zarc, highlight }: { zarc: ZarcT; highlight?: number }) {
  if (!zarc.available || !zarc.risk) return <p className="text-sm text-muted">{zarc.reason ?? 'Sem zoneamento disponível.'}</p>
  const today = zarc.today_decendio ?? highlight
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  return (
    <div>
      <div className="flex gap-[2px]">
        {zarc.risk.map((r, i) => (
          <div key={i} className="flex-1" title={`${zarc.labels?.[i]}: ${RISK_LABEL[r]}`}>
            <div className={clsx('h-7 rounded-sm', today === i + 1 && 'ring-2 ring-ink ring-offset-1')} style={{ background: RISK_COLOR[r] }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex">
        {months.map((m, i) => <div key={i} className="flex-1 text-center text-[10px] text-muted">{m}</div>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        {[20, 30, 40, 0].map((r) => (
          <span key={r} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: RISK_COLOR[r] }} />{RISK_LABEL[r]}</span>
        ))}
        {today && <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm ring-2 ring-ink" />hoje</span>}
      </div>
    </div>
  )
}

/** Abre o assistente já com o contexto da tela. */
export function AskAI({ question, context, label = 'Perguntar à IA', size = 'sm' }: { question: string; context?: Record<string, unknown>; label?: string; size?: 'sm' | 'md' }) {
  const nav = useNavigate()
  return (
    <button
      onClick={() => nav('/assistente', { state: { question, context } })}
      className={clsx('inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft font-medium text-primary-dark hover:bg-primary hover:text-white',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm')}
    >
      <Bot size={size === 'sm' ? 13 : 16} /> {label}
    </button>
  )
}

const KIND_ICON = { estoque: Package, validade: ShieldAlert, zarc: Sprout, clima: CloudRain }

export function AlertRow({ alert, onOpen }: { alert: AlertT; onOpen?: () => void }) {
  const Icon = KIND_ICON[alert.kind] ?? AlertTriangle
  return (
    <button onClick={onOpen} className={clsx('flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-bg', alert.read && 'opacity-60')}>
      <span className={clsx('mt-0.5 rounded-lg p-1.5', alert.severity === 'critico' ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent')}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{alert.title}</span>
        <span className="line-clamp-2 block text-xs text-muted">{alert.why}</span>
      </span>
    </button>
  )
}

/** Rótulo de tipo de informação (representar a incerteza). */
export function InfoKind({ kind }: { kind: 'oficial' | 'previsao' | 'declarado' | 'estimativa' | 'simulado' }) {
  const map = {
    oficial: 'bg-info-soft text-info', previsao: 'bg-accent-soft text-accent', declarado: 'bg-primary-soft text-primary-dark',
    estimativa: 'bg-bg text-muted border border-border', simulado: 'bg-danger-soft text-danger',
  }
  const label = { oficial: 'Dado oficial', previsao: 'Previsão', declarado: 'Declarado por você', estimativa: 'Estimativa', simulado: 'Dado simulado' }
  return <span className={clsx('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', map[kind])}>{label[kind]}</span>
}
