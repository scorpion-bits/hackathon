// Painel lateral "Ficha do talhão".
import { ClipboardPlus, Pencil, Shapes, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { FieldT } from '../../lib/api'
import { SOIL_LABEL, num } from '../../lib/format'
import { AskAI } from '../data'
import { Badge, Button, Card } from '../ui'
import { PlanSection } from './PlanSection'
import { ZarcSection } from './ZarcSection'

const STAGE_TONE = { plantado: 'green', colhido: 'amber', vazio: 'gray' } as const

export function FieldSheet({ field, busy, onClose, onEditSheet, onEditShape, onDelete, onRegister }: {
  field: FieldT; busy: boolean
  onClose: () => void; onEditSheet: () => void; onEditShape: () => void; onDelete: () => void; onRegister: () => void
}) {
  const [simCrop, setSimCrop] = useState('')
  const rows: [string, React.ReactNode][] = [
    ['Área', <b>{num(field.area_ha, 2)} ha</b>],
    ['Cultura', field.crop ?? 'Não definida'],
    ['Solo', field.soil ? SOIL_LABEL[field.soil] : 'Não informado'],
    ['Irrigado', field.irrigated ? 'Sim' : 'Não'],
    ['Situação', <span className="inline-flex flex-wrap items-center gap-1.5"><Badge tone={STAGE_TONE[field.status.stage]}>{field.status.stage}</Badge><span className="text-xs">{field.status.label}</span></span>],
  ]
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span className="h-4 w-1.5 rounded-full" style={{ background: field.color ?? 'var(--color-primary)' }} />
          Ficha do talhão · {field.name}
        </span>
      }
      action={<button onClick={onClose} className="rounded p-1 text-muted hover:bg-bg" aria-label="Fechar ficha"><X size={16} /></button>}
    >
      <div className="space-y-5">
        <dl className="space-y-1.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
          {field.notes && <p className="rounded-lg bg-bg p-2 text-xs text-muted">{field.notes}</p>}
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onRegister}><ClipboardPlus size={14} /> Registrar atividade</Button>
          <Button size="sm" variant="secondary" onClick={onEditSheet} disabled={busy}><Pencil size={14} /> Editar ficha</Button>
          <Button size="sm" variant="secondary" onClick={onEditShape} disabled={busy}><Shapes size={14} /> Editar limites</Button>
          <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={onDelete} disabled={busy}><Trash2 size={14} /> Excluir</Button>
        </div>
        <AskAI size="md" label={`Perguntar à IA sobre o ${field.name}`} question={`Como está o ${field.name}?`} context={{ field: field.name }} />

        <hr className="border-border" />
        <ZarcSection fieldId={field.id} crop={simCrop || undefined} />
        <hr className="border-border" />
        <PlanSection fieldId={field.id} fieldCrop={field.crop} crop={simCrop} onCropChange={setSimCrop} />
      </div>
    </Card>
  )
}
