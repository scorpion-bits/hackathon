// Criar / editar produto do estoque.
import { useEffect, useState } from 'react'
import { api, notifyDataChanged, type Category, type StockItemT } from '../../lib/api'
import { CATEGORY_LABEL } from '../../lib/format'
import { Button, ErrorBox, Input, Label, Modal, Select } from '../ui'

export const UNITS = ['kg', 'L', 'un', 'saco', 't', 'sc 60 kg', 'm', 'ml', 'g']

export function ItemFormModal({ open, item, crops, onClose }: { open: boolean; item?: StockItemT | null; crops: string[]; onClose: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('fertilizante')
  const [unit, setUnit] = useState('kg')
  const [min, setMin] = useState('')
  const [expiry, setExpiry] = useState('')
  const [supplier, setSupplier] = useState('')
  const [crop, setCrop] = useState('')
  const [reg, setReg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? ''); setCategory(item?.category ?? 'fertilizante'); setUnit(item?.unit ?? 'kg')
    setMin(item ? String(item.min_quantity) : ''); setExpiry(item?.expiry_date ?? ''); setSupplier(item?.supplier ?? '')
    setCrop(item?.crop ?? ''); setReg(item?.agrofit_registration ?? ''); setError(null)
  }, [open, item])

  async function save() {
    setError(null)
    if (!name.trim()) return setError('Informe o nome do produto.')
    if (!unit.trim()) return setError('Informe a unidade.')
    setSaving(true)
    try {
      const body = {
        name: name.trim(), category, unit: unit.trim(), min_quantity: Number(min) || 0, expiry_date: expiry || null,
        supplier: supplier.trim() || null, crop: category === 'semente' ? crop || null : null,
        agrofit_registration: category === 'defensivo' ? reg.trim() || null : null,
      }
      if (item) await api.updateItem(item.id, body)
      else await api.createItem(body)
      notifyDataChanged()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? `Editar ${item.name}` : 'Novo produto'}>
      <div className="space-y-4">
        <Label label="Nome do produto"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ureia, Magic (fungicida)" autoFocus /></Label>
        <div className="grid grid-cols-2 gap-3">
          <Label label="Categoria">
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Label>
          <Label label="Unidade">
            <Input list="unit-list" value={unit} onChange={(e) => setUnit(e.target.value)} />
            <datalist id="unit-list">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
          </Label>
          <Label label="Estoque mínimo" hint="Avisamos quando ficar abaixo disso."><Input type="number" min={0} step="any" value={min} onChange={(e) => setMin(e.target.value)} /></Label>
          <Label label="Validade (opcional)"><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></Label>
        </div>
        <Label label="Fornecedor (opcional)"><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} /></Label>
        {category === 'semente' && (
          <Label label="Cultura da semente">
            <Input list="crop-list" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Ex.: Feijão" />
            <datalist id="crop-list">{crops.map((c) => <option key={c} value={c} />)}</datalist>
          </Label>
        )}
        {category === 'defensivo' && (
          <Label label="Nº de registro no MAPA/Agrofit (opcional)" hint="Você pode conferir o registro depois, no botão “Consultar registro”."><Input value={reg} onChange={(e) => setReg(e.target.value)} /></Label>
        )}
        {!item && <p className="text-xs text-muted">O saldo começa em zero. Depois de criar, use “Entrada” para lançar a compra.</p>}
        {error && <ErrorBox error={error} />}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : item ? 'Salvar alterações' : 'Criar produto'}</Button>
        </div>
      </div>
    </Modal>
  )
}
