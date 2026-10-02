// Planejador de plantio: cruza Zarc + previsão de chuva + sementes em estoque.
import clsx from 'clsx'
import { CloudRain, Sprout, Wheat } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../lib/api'
import { RISK_COLOR, RISK_LABEL, num } from '../../lib/format'
import { useApi } from '../../lib/hooks'
import { InfoKind } from '../data'
import { Badge, Select } from '../ui'

export function PlanSection({ fieldId, fieldCrop, crop, onCropChange }: {
  fieldId: number; fieldCrop: string | null; crop: string; onCropChange: (c: string) => void
}) {
  const { data: crops } = useApi(api.crops)
  const { data: plan, error, loading } = useApi(() => api.fieldPlan(fieldId, crop || undefined), [fieldId, crop])
  const [all, setAll] = useState(false)
  const list = crops ? [...crops.zarc_crops, ...crops.other_crops] : []
  const allOptions = plan?.options ?? []
  // períodos "fora da janela" só atrapalham: mostra apenas os indicados pelo Zarc
  const options = allOptions.filter((o) => o.risk > 0)
  const shown = all ? options : options.slice(0, 6)
  const maxRain = Math.max(100, ...options.map((o) => o.rain_mm ?? 0))
  const seed = plan?.seed

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Planejador de plantio</h3>
        <InfoKind kind="oficial" />
      </div>

      <Select value={crop} onChange={(e) => onCropChange(e.target.value)} aria-label="Cultura para simular">
        <option value="">{fieldCrop ? `${fieldCrop} (cultura do talhão)` : 'Escolha uma cultura para simular'}</option>
        {list.filter((c) => c !== fieldCrop).map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
      {crop && <p className="mt-1 text-[11px] text-accent">Simulação: nada é gravado na ficha do talhão.</p>}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {!plan && !error && <p className="mt-2 text-sm text-muted">Calculando…</p>}
      {plan && (
        <div className={clsx('mt-3 space-y-3 transition', loading && 'opacity-60')}>
          <div className="rounded-lg border border-primary/30 bg-primary-soft p-3 text-sm text-primary-dark">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"><Sprout size={14} /> Recomendação · {plan.crop}</div>
            {plan.recommendation}
          </div>

          {options.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-muted">
                <span>Quando plantar</span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap"><CloudRain size={12} /> chuva prevista <InfoKind kind={plan.weather_status === 'simulated' ? 'simulado' : 'previsao'} /></span>
              </div>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {shown.map((o) => (
                  <li key={o.decendio} className="flex items-center gap-2 px-2.5 py-2 text-xs">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: RISK_COLOR[o.risk] }} />
                    <span className="w-[4.5rem] shrink-0 font-medium" title={RISK_LABEL[o.risk]}>{o.label}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">
                      risco {o.risk}%
                      {plan.best?.decendio === o.decendio && <Badge tone="green" className="ml-1.5">melhor</Badge>}
                      {plan.now?.decendio === o.decendio && <Badge tone="blue" className="ml-1.5">agora</Badge>}
                    </span>
                    {o.rain_mm != null ? (
                      <span className="flex w-28 shrink-0 items-center gap-1.5 text-right">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                          <span className={clsx('block h-full rounded-full', o.heavy_rain ? 'bg-danger' : 'bg-info')} style={{ width: `${Math.min(100, (o.rain_mm / maxRain) * 100)}%` }} />
                        </span>
                        <span className={clsx('w-12 whitespace-nowrap tabular-nums', o.heavy_rain ? 'font-bold text-danger' : 'text-info')}>{num(o.rain_mm, 0)} mm</span>
                      </span>
                    ) : <span className="w-24 shrink-0 text-right text-[11px] text-muted">sem previsão</span>}
                  </li>
                ))}
              </ul>
              {options.some((o) => o.heavy_rain) && <p className="mt-1 text-[11px] text-danger">Chuva forte prevista em algum período: evite plantar nesses dias.</p>}
              {options.length > 6 && (
                <button onClick={() => setAll(!all)} className="mt-1 text-xs font-medium text-primary hover:underline">
                  {all ? 'Ver menos' : `Ver todos os ${options.length} períodos`}
                </button>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border p-3 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><Wheat size={14} /> Sementes</span>
              <InfoKind kind="declarado" />
            </div>
            {seed && seed.rate_kg_ha != null ? (
              <>
                <p className="text-xs text-muted">Taxa: <b className="text-ink">{num(seed.rate_kg_ha, 1)} kg/ha</b> ({seed.rate_origin ?? 'declarado pelo produtor'})</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-bg p-2"><div className="text-[10px] uppercase text-muted">Precisa</div><div className="font-bold">{num(seed.needed_kg, 1)} kg</div></div>
                  <div className="rounded-lg bg-bg p-2"><div className="text-[10px] uppercase text-muted">No estoque</div><div className="font-bold">{num(seed.available_kg, 1)} kg</div></div>
                  <div className={clsx('rounded-lg p-2', (seed.missing_kg ?? 0) > 0 ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary-dark')}>
                    <div className="text-[10px] uppercase">{(seed.missing_kg ?? 0) > 0 ? 'Faltam' : 'Sobra'}</div>
                    <div className="font-bold">{(seed.missing_kg ?? 0) > 0 ? `${num(seed.missing_kg, 1)} kg` : 'Tudo certo'}</div>
                  </div>
                </div>
                {seed.items.length > 0 && <p className="mt-2 text-[11px] text-muted">Considerado do estoque: {seed.items.join(', ')}</p>}
                {(seed.missing_kg ?? 0) > 0 && <p className="mt-1 text-xs font-medium text-danger">Compre ou registre a entrada das sementes antes de plantar.</p>}
              </>
            ) : (
              <p className="text-xs text-muted">Informe a taxa de semeadura (kg/ha) na ficha do talhão para calcular quantas sementes você precisa.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
