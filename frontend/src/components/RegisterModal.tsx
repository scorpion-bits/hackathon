// "+ Registrar": formulário único para plantio, aplicação, colheita, compra e observação.
// Também usado pelo assistente para confirmar rascunhos ("registro por conversa").
import clsx from 'clsx'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api, notifyDataChanged, type Category, type Draft, type FieldT, type StockItemT } from '../lib/api'
import { CATEGORY_LABEL, brl, todayISO } from '../lib/format'
import { Button, ErrorBox, Input, Label, Modal, Select, Textarea } from './ui'

export type RegisterKind = 'plantio' | 'aplicacao' | 'colheita' | 'compra' | 'observacao'
const KINDS: { k: RegisterKind; label: string }[] = [
  { k: 'plantio', label: 'Plantio' }, { k: 'aplicacao', label: 'Aplicação' }, { k: 'colheita', label: 'Colheita' },
  { k: 'compra', label: 'Compra' }, { k: 'observacao', label: 'Observação' },
]

type InputRow = { item_id: number | ''; quantity: string }

export function RegisterModal({ open, onClose, initialKind = 'plantio', draft, fieldId, onDone }: {
  open: boolean; onClose: () => void; initialKind?: RegisterKind; draft?: Draft | null; fieldId?: number
  /** Chamado após gravar com sucesso (ex.: assistente desativa o rascunho já confirmado). */
  onDone?: () => void
}) {
  const [kind, setKind] = useState<RegisterKind>(initialKind)
  const [fields, setFields] = useState<FieldT[]>([])
  const [items, setItems] = useState<StockItemT[]>([])
  const [crops, setCrops] = useState<string[]>([])
  const [date, setDate] = useState(todayISO())
  const [field, setField] = useState<number | ''>('')
  const [crop, setCrop] = useState('')
  const [rows, setRows] = useState<InputRow[]>([{ item_id: '', quantity: '' }])
  const [harvestQty, setHarvestQty] = useState('')
  const [harvestUnit, setHarvestUnit] = useState('sc 60 kg')
  const [text, setText] = useState('')
  // compra
  const [buyItem, setBuyItem] = useState<number | 'novo' | ''>('')
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState<Category>('fertilizante')
  const [newUnit, setNewUnit] = useState('kg')
  const [buyQty, setBuyQty] = useState('')
  const [buyTotal, setBuyTotal] = useState('')
  const [supplier, setSupplier] = useState('')
  const [expiry, setExpiry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    Promise.all([api.fields(), api.items(), api.crops()]).then(([f, i, c]) => {
      setFields(f); setItems(i); setCrops([...c.zarc_crops, ...c.other_crops])
    })
    setError(null); setDone(null)
    setKind(draft ? (draft.kind as RegisterKind) : initialKind)
    setDate(draft?.date ?? todayISO())
    setField(draft?.field_id ?? fieldId ?? '')
    setCrop(draft?.crop ?? '')
    setRows([{ item_id: draft?.item_id ?? '', quantity: draft?.quantity != null && draft.kind !== 'compra' ? String(draft.quantity) : '' }])
    setBuyItem(draft?.kind === 'compra' ? draft.item_id ?? '' : '')
    setBuyQty(draft?.kind === 'compra' && draft.quantity != null ? String(draft.quantity) : '')
    setBuyTotal(draft?.total_price != null ? String(draft.total_price) : '')
    setHarvestQty(''); setText(''); setSupplier(''); setExpiry(''); setNewName('')
  }, [open, draft, initialKind, fieldId])

  const selField = fields.find((f) => f.id === field)
  useEffect(() => { if (kind === 'plantio' && selField && !crop) setCrop(selField.crop ?? '') }, [kind, selField, crop])

  const usable = useMemo(() => items.filter((i) => i.quantity > 0 && (kind !== 'plantio' || ['semente', 'fertilizante', 'combustivel'].includes(i.category))), [items, kind])
  const selBuy = items.find((i) => i.id === buyItem)

  async function save() {
    setError(null); setSaving(true)
    try {
      if (kind === 'compra') {
        let itemId = buyItem
        if (itemId === 'novo') {
          if (!newName) throw new Error('Informe o nome do produto.')
          itemId = (await api.createItem({ name: newName, category: newCat, unit: newUnit, min_quantity: 0, expiry_date: expiry || null, supplier: supplier || null })).id
        }
        if (!itemId) throw new Error('Escolha o produto.')
        const q = Number(buyQty)
        if (!q) throw new Error('Informe a quantidade.')
        const total = Number(buyTotal)
        if (expiry && buyItem !== 'novo' && selBuy) await api.updateItem(selBuy.id, { ...selBuy, expiry_date: expiry })
        await api.createMovement(itemId, { kind: 'entrada', quantity: q, date, unit_price: total ? total / q : null, supplier: supplier || null })
        setDone('Compra registrada: estoque e custos da safra atualizados.')
      } else {
        if (kind !== 'observacao' && !field) throw new Error('Escolha o talhão.')
        const inputs = rows.filter((r) => r.item_id && Number(r.quantity) > 0).map((r) => ({ item_id: Number(r.item_id), quantity: Number(r.quantity) }))
        const details: Record<string, unknown> = {}
        if (kind === 'plantio') details.crop = crop || selField?.crop
        if (kind === 'colheita') Object.assign(details, { crop: selField?.status.crop ?? selField?.crop, harvested_qty: Number(harvestQty) || null, harvested_unit: harvestUnit })
        if (kind === 'observacao') details.text = text
        await api.createEvent({ type: kind, date, field_id: field || null, details, inputs: kind === 'observacao' ? [] : inputs, origin: draft ? 'ia' : 'manual', title: kind === 'observacao' && text ? `Observação · ${selField?.name ?? 'Geral'}` : undefined })
        setDone(inputs.length ? 'Registrado no caderno de campo. Estoque baixado e custo lançado na safra.' : 'Registrado no caderno de campo.')
      }
      notifyDataChanged()
      onDone?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={draft ? 'Confirmar registro sugerido pela IA' : 'Novo registro'}>
      {done ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto text-primary" size={40} />
          <p className="text-sm">{done}</p>
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={() => { setDone(null); setRows([{ item_id: '', quantity: '' }]) }}>Registrar outro</Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 rounded-lg bg-bg p-1">
            {KINDS.map(({ k, label }) => (
              <button key={k} onClick={() => setKind(k)} className={clsx('flex-1 rounded-md px-2 py-1.5 text-xs font-medium', kind === k ? 'bg-surface text-primary-dark shadow-sm' : 'text-muted hover:text-ink')}>{label}</button>
            ))}
          </div>
          {draft?.missing?.length ? <div className="rounded-lg bg-accent-soft p-2 text-xs text-accent">Falta: {draft.missing.join(', ')}</div> : null}

          <div className="grid grid-cols-2 gap-3">
            <Label label="Data"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Label>
            {kind !== 'compra' && (
              <Label label="Talhão">
                <Select value={field} onChange={(e) => setField(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">{kind === 'observacao' ? 'Geral (propriedade)' : 'Escolha…'}</option>
                  {fields.map((f) => <option key={f.id} value={f.id}>{f.name} · {f.area_ha} ha</option>)}
                </Select>
              </Label>
            )}
          </div>

          {kind === 'plantio' && (
            <Label label="Cultura">
              <Select value={crop} onChange={(e) => setCrop(e.target.value)}>
                <option value="">Escolha…</option>
                {crops.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Label>
          )}

          {(kind === 'plantio' || kind === 'aplicacao' || kind === 'colheita') && (
            <div>
              <span className="mb-1 block text-xs font-medium text-muted">{kind === 'colheita' ? 'Insumos usados (ex.: diesel)' : 'Insumos usados do estoque'}</span>
              <div className="space-y-2">
                {rows.map((r, idx) => {
                  const it = items.find((i) => i.id === r.item_id)
                  return (
                    <div key={idx} className="flex gap-2">
                      <Select value={r.item_id} onChange={(e) => setRows(rows.map((x, j) => j === idx ? { ...x, item_id: e.target.value ? Number(e.target.value) : '' } : x))}>
                        <option value="">Produto…</option>
                        {usable.map((i) => <option key={i.id} value={i.id}>{i.name} (saldo {i.quantity} {i.unit})</option>)}
                      </Select>
                      <Input className="w-28" type="number" min={0} step="any" placeholder={it?.unit ?? 'qtd'} value={r.quantity} onChange={(e) => setRows(rows.map((x, j) => j === idx ? { ...x, quantity: e.target.value } : x))} />
                      <Button variant="ghost" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== idx))} aria-label="Remover"><Trash2 size={14} /></Button>
                    </div>
                  )
                })}
                <Button variant="ghost" size="sm" onClick={() => setRows([...rows, { item_id: '', quantity: '' }])}><Plus size={14} /> Adicionar insumo</Button>
              </div>
            </div>
          )}

          {kind === 'colheita' && (
            <div className="grid grid-cols-2 gap-3">
              <Label label="Quantidade colhida"><Input type="number" value={harvestQty} onChange={(e) => setHarvestQty(e.target.value)} /></Label>
              <Label label="Unidade"><Select value={harvestUnit} onChange={(e) => setHarvestUnit(e.target.value)}><option>sc 60 kg</option><option>kg</option><option>t</option><option>caixas</option></Select></Label>
            </div>
          )}

          {kind === 'observacao' && <Label label="O que você observou?"><Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: manchas nas folhas no canto norte" /></Label>}

          {kind === 'compra' && (
            <>
              <Label label="Produto">
                <Select value={buyItem} onChange={(e) => setBuyItem(e.target.value === 'novo' ? 'novo' : e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Escolha…</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  <option value="novo">+ Novo produto</option>
                </Select>
              </Label>
              {buyItem === 'novo' && (
                <div className="grid grid-cols-3 gap-3">
                  <Label label="Nome"><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></Label>
                  <Label label="Categoria"><Select value={newCat} onChange={(e) => setNewCat(e.target.value as Category)}>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Label>
                  <Label label="Unidade"><Select value={newUnit} onChange={(e) => setNewUnit(e.target.value)}><option>kg</option><option>L</option><option>un</option><option>saco</option><option>t</option></Select></Label>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Label label={`Quantidade${selBuy ? ` (${selBuy.unit})` : ''}`}><Input type="number" step="any" value={buyQty} onChange={(e) => setBuyQty(e.target.value)} /></Label>
                <Label label="Valor total (R$)" hint={Number(buyQty) && Number(buyTotal) ? `${brl(Number(buyTotal) / Number(buyQty))} por ${selBuy?.unit ?? newUnit}` : undefined}><Input type="number" step="any" value={buyTotal} onChange={(e) => setBuyTotal(e.target.value)} /></Label>
                <Label label="Fornecedor"><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} /></Label>
                <Label label="Validade (opcional)"><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></Label>
              </div>
            </>
          )}

          {error && <ErrorBox error={error} />}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Confirmar registro'}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
