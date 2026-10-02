// Produção: caderno de campo (linha do tempo) + talhões + resumo da safra.
import clsx from 'clsx'
import { Bot, Camera, Eye, Hand, MoreHorizontal, Plus, ShoppingCart, Sprout, Tractor, Trash2, Wheat } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RegisterModal, type RegisterKind } from '../components/RegisterModal'
import { Badge, Button, Card, Empty, ErrorBox, Loading, Modal, PageHeader, Select, Stat } from '../components/ui'
import { api, notifyDataChanged, type EventT, type EventType, type FieldT } from '../lib/api'
import { brl, dateBR, EVENT_LABEL, num } from '../lib/format'
import { useApi } from '../lib/hooks'

const EVENT_ICON: Record<EventType, typeof Sprout> = {
  plantio: Sprout, aplicacao: Tractor, colheita: Wheat, compra: ShoppingCart, observacao: Eye, outro: MoreHorizontal,
}
const EVENT_TONE: Record<EventType, string> = {
  plantio: 'bg-primary-soft text-primary-dark', aplicacao: 'bg-info-soft text-info', colheita: 'bg-accent-soft text-accent',
  compra: 'bg-bg text-muted border border-border', observacao: 'bg-bg text-ink border border-border', outro: 'bg-bg text-muted border border-border',
}
const STAGE_TONE = { plantado: 'green', colhido: 'amber', vazio: 'gray' } as const
const STAGE_BORDER = { plantado: 'border-primary', colhido: 'border-accent', vazio: 'border-border' } as const

const monthLabel = (iso: string) => {
  const s = new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function Production() {
  const farm = useApi(api.farm)
  const fields = useApi(api.fields)
  const [seasonSel, setSeasonSel] = useState<number | null>(null)
  const [fieldId, setFieldId] = useState<number | ''>('')
  const [type, setType] = useState('')
  const [modal, setModal] = useState<{ kind: RegisterKind; fieldId?: number } | null>(null)
  const [toDelete, setToDelete] = useState<EventT | null>(null)
  const [delError, setDelError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const seasonId = seasonSel ?? farm.data?.current_season?.id
  const ready = !!farm.data
  const events = useApi(() => (ready ? api.events({ season_id: seasonId, field_id: fieldId || undefined, type: type || undefined }) : Promise.resolve([] as EventT[])), [ready, seasonId, fieldId, type])
  // resumo da safra não depende dos filtros de talhão/tipo
  const allEvents = useApi(() => (ready ? api.events({ season_id: seasonId }) : Promise.resolve([] as EventT[])), [ready, seasonId])
  const costs = useApi(() => (ready ? api.costs(seasonId) : Promise.resolve(null)), [ready, seasonId])

  const fieldName = useMemo(() => new Map((fields.data ?? []).map((f) => [f.id, f.name])), [fields.data])
  const groups = useMemo(() => {
    const g: { month: string; items: EventT[] }[] = []
    for (const e of events.data ?? []) {
      const m = e.date.slice(0, 7)
      const last = g[g.length - 1]
      if (last && last.month === m) last.items.push(e)
      else g.push({ month: m, items: [e] })
    }
    return g
  }, [events.data])

  if (farm.error) return <ErrorBox error={farm.error} />
  if (!farm.data) return <Loading />
  const seasonName = farm.data.seasons.find((s) => s.id === seasonId)?.name ?? farm.data.current_season?.name ?? ''
  const count = (t: EventType) => (allEvents.data ?? []).filter((e) => e.type === t).length

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true); setDelError(null)
    try {
      await api.deleteEvent(toDelete.id)
      setToDelete(null)
      notifyDataChanged()
    } catch (e) {
      setDelError((e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produção"
        subtitle={`Caderno de campo · safra ${seasonName} · tudo o que acontece na lavoura, em ordem`}
        actions={
          <>
            <Button onClick={() => setModal({ kind: 'plantio' })}><Plus size={15} /> Plantio</Button>
            <Button variant="secondary" onClick={() => setModal({ kind: 'aplicacao' })}><Plus size={15} /> Aplicação</Button>
            <Button variant="secondary" onClick={() => setModal({ kind: 'colheita' })}><Plus size={15} /> Colheita</Button>
            <Button variant="secondary" onClick={() => setModal({ kind: 'observacao' })}><Plus size={15} /> Observação</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Plantios" value={count('plantio')} hint="nesta safra" icon={<Sprout size={16} />} />
        <Stat label="Aplicações" value={count('aplicacao')} hint="adubo, defensivos, preparo…" icon={<Tractor size={16} />} tone="blue" />
        <Stat label="Colheitas" value={count('colheita')} hint="nesta safra" icon={<Wheat size={16} />} tone="amber" />
        <Stat
          label="Custo aplicado"
          value={costs.data ? brl(costs.data.applied_total) : '—'}
          hint={<Link to="/relatorios" className="font-medium text-primary hover:underline">Ver relatório de custos</Link>}
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Meus talhões <span className="font-normal text-muted">· clique para filtrar o caderno</span></h2>
        {fields.error && <ErrorBox error={fields.error} />}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(fields.data ?? []).map((f) => (
            <FieldCard
              key={f.id} field={f} active={fieldId === f.id}
              onToggle={() => setFieldId(fieldId === f.id ? '' : f.id)}
              onRegister={() => setModal({ kind: f.status.stage === 'plantado' ? 'aplicacao' : 'plantio', fieldId: f.id })}
            />
          ))}
          {fields.data?.length === 0 && <Empty>Nenhum talhão cadastrado. Desenhe o primeiro no mapa.</Empty>}
        </div>
      </section>

      <Card
        title="Linha do tempo"
        action={
          <div className="flex flex-wrap gap-2">
            <Select className="!w-auto !py-1 text-xs" value={seasonId ?? ''} onChange={(e) => setSeasonSel(Number(e.target.value))} aria-label="Safra">
              {farm.data.seasons.map((s) => <option key={s.id} value={s.id}>Safra {s.name}</option>)}
            </Select>
            <Select className="!w-auto !py-1 text-xs" value={fieldId} onChange={(e) => setFieldId(e.target.value ? Number(e.target.value) : '')} aria-label="Talhão">
              <option value="">Todos os talhões</option>
              {(fields.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
            <Select className="!w-auto !py-1 text-xs" value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipo de evento">
              <option value="">Todos os tipos</option>
              {Object.entries(EVENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        }
      >
        {events.error && <ErrorBox error={events.error} />}
        {!events.data && !events.error && <Loading />}
        {events.data && groups.length === 0 && <Empty>Nenhum registro com esses filtros. Use os botões “+” no topo para anotar o que você fez na lavoura.</Empty>}
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.month}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{monthLabel(g.month)}</h3>
              <ol className="space-y-3 border-l-2 border-border pl-4">
                {g.items.map((e) => <EventRow key={e.id} e={e} fieldName={e.field_id ? fieldName.get(e.field_id) : undefined} onDelete={() => { setDelError(null); setToDelete(e) }} />)}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      <RegisterModal open={!!modal} onClose={() => setModal(null)} initialKind={modal?.kind} fieldId={modal?.fieldId} />

      <Modal open={!!toDelete} title="Excluir registro?" onClose={() => setToDelete(null)}>
        {toDelete && (
          <div className="space-y-4 text-sm">
            <p><b>{toDelete.title}</b> · {dateBR(toDelete.date)}</p>
            {toDelete.type === 'compra' ? (
              <p className="text-muted">Esta compra será apagada e a quantidade comprada <b>sai do estoque</b>.</p>
            ) : toDelete.inputs.length > 0 ? (
              <p className="text-muted">Os insumos usados neste registro (<b>{toDelete.inputs.map((i) => `${num(i.quantity)} ${i.unit} de ${i.item_name}`).join(', ')}</b>) <b>voltam para o estoque</b> e o custo é retirado da safra.</p>
            ) : (
              <p className="text-muted">Este registro não usou insumos do estoque, então o estoque não muda.</p>
            )}
            {delError && <ErrorBox error={delError} />}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Excluindo…' : 'Excluir registro'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function FieldCard({ field: f, active, onToggle, onRegister }: { field: FieldT; active: boolean; onToggle: () => void; onRegister: () => void }) {
  return (
    <div
      className={clsx('w-56 shrink-0 rounded-xl border-l-4 border-y border-r bg-surface p-3 shadow-sm', STAGE_BORDER[f.status.stage], active ? 'ring-2 ring-primary' : 'border-y-border border-r-border')}
    >
      <button onClick={onToggle} className="block w-full text-left" aria-pressed={active}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{f.name}</span>
          <Badge tone={STAGE_TONE[f.status.stage]}>{f.status.stage}</Badge>
        </div>
        <div className="mt-1 text-xs text-muted">{num(f.area_ha, 2)} ha{f.crop ? ` · ${f.crop}` : ''}</div>
        <div className="mt-1 line-clamp-2 min-h-8 text-xs text-ink">{f.status.label}</div>
      </button>
      <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={onRegister}><Plus size={13} /> Registrar</Button>
    </div>
  )
}

function EventRow({ e, fieldName, onDelete }: { e: EventT; fieldName?: string; onDelete: () => void }) {
  const Icon = EVENT_ICON[e.type] ?? MoreHorizontal
  const d = e.details ?? {}
  const total = e.inputs.reduce((s, i) => s + (i.value ?? 0), 0)
  return (
    <li className="relative">
      <span className={clsx('absolute -left-[34px] top-0.5 rounded-full p-1.5', EVENT_TONE[e.type])}><Icon size={14} /></span>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-ink">{e.title}</span>
            {e.origin === 'ia' && <Badge tone="green"><Bot size={11} /> registrado via IA</Badge>}
            {e.origin === 'demo' && <span className="text-[10px] uppercase tracking-wide text-muted/70">demo</span>}
          </div>
          <div className="text-xs text-muted">
            {dateBR(e.date)} · {EVENT_LABEL[e.type]}{fieldName ? ` · ${fieldName}` : e.type === 'compra' ? '' : ' · propriedade toda'}
          </div>
          {e.type === 'colheita' && d.harvested_qty != null && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              <Wheat size={12} /> Colhido: {num(d.harvested_qty)} {d.harvested_unit ?? ''}
            </div>
          )}
          {d.text && <p className="mt-1 flex gap-1.5 text-sm text-ink"><Camera size={14} className="mt-0.5 shrink-0 text-muted" /><span>{String(d.text)}</span></p>}
          {e.type === 'compra' && d.supplier && <div className="mt-0.5 text-xs text-muted">Fornecedor: {String(d.supplier)}</div>}
          {e.inputs.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 rounded-lg bg-bg p-2 text-xs">
              {e.inputs.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span><Hand size={11} className="mr-1 inline text-muted" />{num(i.quantity, 2)} {i.unit} · {i.item_name}</span>
                  <span className="shrink-0 font-medium">{brl(i.value)}</span>
                </li>
              ))}
              {e.inputs.length > 1 && e.type !== 'compra' && (
                <li className="flex justify-between gap-3 border-t border-border pt-0.5 font-semibold"><span>Total dos insumos</span><span>{brl(total)}</span></li>
              )}
            </ul>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Excluir ${e.title}`} title="Excluir registro"><Trash2 size={14} /></Button>
      </div>
    </li>
  )
}
