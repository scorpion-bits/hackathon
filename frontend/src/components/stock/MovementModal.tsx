// Entrada (compra) ou saída de um item do estoque.
import { useEffect, useState } from 'react'
import { api, notifyDataChanged, type FieldT, type StockItemT } from '../../lib/api'
import { brl, num, todayISO } from '../../lib/format'
import { Button, ErrorBox, Input, Label, Modal, Select } from '../ui'

export function MovementModal({ open, kind, item, fields, onClose }: { open: boolean; kind: 'entrada' | 'saida'; item: StockItemT | null; fields: FieldT[]; onClose: () => void }) {
  const [qty, setQty] = useState('')
  const [total, setTotal] = useState('')
  const [supplier, setSupplier] = useState('')
  const [date, setDate] = useState(todayISO())
  const [field, setField] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setQty(''); setTotal(''); setSupplier(item?.supplier ?? ''); setDate(todayISO()); setField(''); setError(null)
  }, [open, item])

  if (!item) return null
  const q = Number(qty)
  const t = Number(total)

  async function save() {
    if (!item) return
    setError(null)
    if (!(q > 0)) return setError('Informe a quantidade.')
    if (kind === 'saida' && q > item.quantity) return setError(`Estoque insuficiente: saldo de ${num(item.quantity, 2)} ${item.unit}.`)
    setSaving(true)
    try {
      await api.createMovement(item.id, kind === 'entrada'
        ? { kind, quantity: q, date, unit_price: t > 0 ? t / q : null, supplier: supplier.trim() || null }
        : { kind, quantity: q, date, field_id: field || null })
      notifyDataChanged()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${kind === 'entrada' ? 'Entrada (compra)' : 'Saída'} · ${item.name}`}>
      <div className="space-y-4">
        <p className="text-xs text-muted">Saldo atual: <b>{num(item.quantity, 2)} {item.unit}</b></p>
        <div className="grid grid-cols-2 gap-3">
          <Label label={`Quantidade (${item.unit})`}><Input type="number" min={0} step="any" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></Label>
          <Label label="Data"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Label>
          {kind === 'entrada' ? (
            <>
              <Label label="Valor total pago (R$)" hint={q > 0 && t > 0 ? `${brl(t / q)} por ${item.unit}` : 'Opcional, mas necessário para o custo da safra.'}>
                <Input type="number" min={0} step="any" value={total} onChange={(e) => setTotal(e.target.value)} />
              </Label>
              <Label label="Fornecedor"><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} /></Label>
            </>
          ) : (
            <div className="col-span-2">
              <Label label="Talhão (opcional)" hint={field ? 'Vai aparecer no caderno de campo como uma aplicação neste talhão e entra no custo da safra.' : 'Sem talhão: só baixa do estoque, sem registro no caderno.'}>
                <Select value={field} onChange={(e) => setField(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Nenhum</option>
                  {fields.map((f) => <option key={f.id} value={f.id}>{f.name} · {num(f.area_ha, 2)} ha</option>)}
                </Select>
              </Label>
            </div>
          )}
        </div>
        {kind === 'saida' && q > 0 && item.avg_price != null && <p className="text-xs text-muted">Custo estimado pelo preço médio: <b>{brl(q * item.avg_price)}</b></p>}
        {error && <ErrorBox error={error} />}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : kind === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}</Button>
        </div>
      </div>
    </Modal>
  )
}
