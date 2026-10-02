// Aviso único de estado da fonte (D-022): fresca = nada; guardada = "dado real de <data>"; fora = "indisponível agora".
import { CloudOff, History } from 'lucide-react'
import { fmtWhen } from '../api/opendata'

export function SourceStatus({ status, fetchedAt, what = 'dado' }: { status?: string | null; fetchedAt?: string | null; what?: string }) {
  if (!status || status === 'live' || status === 'cache' || status === 'local') return null
  if (status === 'stale') {
    return <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent"><History size={13} /> {what} real de {fmtWhen(fetchedAt)}; a fonte está fora do ar agora.</p>
  }
  if (status === 'simulated') return <p className="mt-2 text-xs text-accent">Previsão SIMULADA (teste automatizado).</p>
  return <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted"><CloudOff size={13} /> {what} indisponível agora — a fonte não respondeu e não há dado guardado.</p>
}

export function Skeleton({ className = 'h-24' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-border/60 ${className}`} aria-hidden />
}
