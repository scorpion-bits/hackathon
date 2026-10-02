// Consulta de registro de defensivo no Agrofit/MAPA (dado oficial, aberto).
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type AgrofitT, type StockItemT } from '../../lib/api'
import { Badge, ErrorBox, Label, Loading, Modal, Select } from '../ui'
import { SourceBadge } from '../data'

/** "Magic (fungicida)" -> "Magic" */
export const baseProductName = (name: string) => name.split(' (')[0].trim()

export function AgrofitModal({ item, crops, onClose }: { item: StockItemT | null; crops: string[]; onClose: () => void }) {
  const [crop, setCrop] = useState('')
  const [res, setRes] = useState<AgrofitT | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setCrop(''); setRes(null); setError(null) }, [item?.id])
  useEffect(() => {
    if (!item) return
    let cancel = false
    setRes(null); setError(null)
    api.agrofit(baseProductName(item.name), crop || undefined)
      .then((r) => !cancel && setRes(r))
      .catch((e: Error) => !cancel && setError(e.message))
    return () => { cancel = true }
  }, [item, crop])

  return (
    <Modal open={!!item} onClose={onClose} title={`Registro no Agrofit · ${item ? baseProductName(item.name) : ''}`} wide>
      <div className="space-y-4 text-sm">
        <Label label="Conferir para a cultura (opcional)">
          <Select value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">Sem cultura específica</option>
            {crops.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Label>
        {error && <ErrorBox error={error} />}
        {!res && !error && <Loading />}
        {res && !res.found && (
          <p className="rounded-lg border border-dashed border-border p-4 text-muted">Não encontramos “{res.product}” no Agrofit. Confira o nome do produto ou o número de registro na bula.</p>
        )}
        {res && res.found && (
          <div className="space-y-3">
            {res.crop && (
              <div className={`flex items-center gap-2 rounded-lg p-3 font-medium ${res.registered_for_crop ? 'bg-primary-soft text-primary-dark' : 'bg-danger-soft text-danger'}`}>
                {res.registered_for_crop ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {res.registered_for_crop ? `Registrado para ${res.crop}: sim` : `Registrado para ${res.crop}: não (neste registro oficial)`}
              </div>
            )}
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <Info label="Ingrediente ativo" value={res.ingredient} />
              <Info label="Registro MAPA" value={res.registration} />
              <Info label="Classe" value={res.product_class} />
              <Info label="Classe toxicológica" value={res.tox_class} />
              <Info label="Classe ambiental" value={res.env_class} />
              <Info label="Marcas" value={res.brands?.join(', ')} />
            </dl>
            {res.crop && res.registered_for_crop && (
              <div><dt className="text-xs font-medium text-muted">Pragas-alvo em {res.crop}</dt><dd>{res.pests_for_crop ?? 'Não informado'}</dd></div>
            )}
            {res.crops && res.crops.length > 0 && !res.crop && (
              <div>
                <dt className="text-xs font-medium text-muted">Culturas com registro (parcial)</dt>
                <dd className="mt-1 flex flex-wrap gap-1">{res.crops.map((c) => <Badge key={c}>{c}</Badge>)}</dd>
              </div>
            )}
          </div>
        )}
        {res && (
          <div className="space-y-2 border-t border-border pt-3">
            {res.disclaimer && <p className="flex gap-2 rounded-lg bg-accent-soft p-3 text-xs text-accent"><ShieldAlert size={16} className="shrink-0" /> {res.disclaimer}</p>}
            <SourceBadge source={res.source} />
          </div>
        )}
      </div>
    </Modal>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-xs font-medium text-muted">{label}</dt><dd>{value || '—'}</dd></div>
}
