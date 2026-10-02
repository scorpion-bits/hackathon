// Risco climático oficial (Zarc/MAPA) do talhão selecionado.
import { AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/hooks'
import { InfoKind, RiskStrip, SourceBadge } from '../data'

export function ZarcSection({ fieldId, crop }: { fieldId: number; crop?: string }) {
  const { data: zarc, error, loading } = useApi(() => api.fieldZarc(fieldId, crop), [fieldId, crop])
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Risco climático oficial (Zarc)</h3>
        <InfoKind kind="oficial" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!zarc && !error && <p className="text-sm text-muted">Carregando…</p>}
      {zarc && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {zarc.available && zarc.crop && <p className="mb-2 text-xs text-muted">Cultura: <b className="text-ink">{zarc.crop}</b> · cada quadrado é um período de 10 dias (jan a dez)</p>}
          <RiskStrip zarc={zarc} />
          {zarc.available && (
            <>
              {zarc.soil_estimated && (
                <p className="mt-2 flex gap-1.5 rounded-lg bg-accent-soft p-2 text-xs text-accent">
                  <AlertTriangle size={14} className="mt-px shrink-0" />
                  <span>Solo estimado a partir do tipo informado ({zarc.soil_label}). Confirme com seu técnico.</span>
                </p>
              )}
              {zarc.notes?.map((n, i) => <p key={i} className="mt-1.5 text-xs text-muted">{n}</p>)}
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Safra {zarc.safra} · ciclo {zarc.cycle_label} · manejo {zarc.management?.toLowerCase()} · {zarc.ordinance?.replace(/_/g, ' ').replace('Port.', 'Portaria ')}
              </p>
            </>
          )}
          <div className="mt-2"><SourceBadge source={zarc.source} /></div>
        </div>
      )}
    </section>
  )
}
