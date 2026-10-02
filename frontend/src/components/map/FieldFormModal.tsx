// Formulário da ficha do talhão (criar / editar). Usado pela tela do Mapa.
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { api, notifyDataChanged, type FieldT, type Polygon } from '../../lib/api'
import { num } from '../../lib/format'
import { InfoKind } from '../data'
import { Button, ErrorBox, Input, Label, Modal, Select, Textarea } from '../ui'

export const FIELD_COLORS = ['#2E7D4F', '#D69E2E', '#2F6E91', '#C0392B', '#7B4FA3', '#E07B39', '#3AA6A0', '#8C6D3F']

export function FieldFormModal({ open, field, geometry, areaHa, onClose, onSaved }: {
  open: boolean
  /** talhão existente (edição) ou null (novo) */
  field: FieldT | null
  /** geometria: desenho novo ou nova forma do talhão */
  geometry: Polygon | null
  areaHa: number | null
  onClose: () => void
  onSaved: (f: FieldT) => void | Promise<void>
}) {
  const [name, setName] = useState('')
  const [crop, setCrop] = useState('')
  const [soil, setSoil] = useState<'' | 'arenoso' | 'medio' | 'argiloso'>('')
  const [irrigated, setIrrigated] = useState(false)
  const [seed, setSeed] = useState('')
  const [color, setColor] = useState(FIELD_COLORS[0])
  const [notes, setNotes] = useState('')
  const [crops, setCrops] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    api.crops().then((c) => setCrops([...c.zarc_crops, ...c.other_crops])).catch(() => setCrops([]))
    setError(null); setSaving(false)
    setName(field?.name ?? '')
    setCrop(field?.crop ?? '')
    setSoil(field?.soil ?? '')
    setIrrigated(field?.irrigated ?? false)
    setSeed(field?.seed_rate_kg_ha != null ? String(field.seed_rate_kg_ha) : '')
    setColor(field?.color ?? FIELD_COLORS[0])
    setNotes(field?.notes ?? '')
  }, [open, field])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const geom = geometry ?? field?.geometry
    if (!name.trim()) return setError('Dê um nome ao talhão.')
    if (!geom) return setError('Falta o desenho do talhão no mapa.')
    const rate = seed.trim() === '' ? null : Number(seed.replace(',', '.'))
    if (rate !== null && (!isFinite(rate) || rate < 0)) return setError('A taxa de semeadura precisa ser um número positivo.')
    setSaving(true); setError(null)
    const body = {
      name: name.trim(), geometry: geom, crop: crop || null, soil: soil || null, irrigated,
      seed_rate_kg_ha: rate, color, notes: notes.trim() || null,
    }
    try {
      const saved = field ? await api.updateField(field.id, body) : await api.createField(body)
      notifyDataChanged()
      onSaved(saved)
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  const area = areaHa ?? field?.area_ha ?? null

  return (
    <Modal open={open} onClose={onClose} title={field ? `Ficha do talhão · ${field.name}` : 'Novo talhão'}>
      <form onSubmit={submit} className="space-y-4">
        {area != null && (
          <div className="flex items-center justify-between rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary-dark">
            <span>Área do desenho: <b>{num(area, 2)} ha</b></span>
            <span className="text-xs">calculada pelo mapa</span>
          </div>
        )}
        <Label label="Nome do talhão *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Talhão da Várzea" autoFocus />
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label label="Cultura">
            <Select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="">Sem cultura definida</option>
              {crop && !crops.includes(crop) && <option value={crop}>{crop}</option>}
              {crops.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Label>
          <Label label="Tipo de solo" hint="Se não sabe: arenoso solta, argiloso fica barrento.">
            <Select value={soil} onChange={(e) => setSoil(e.target.value as typeof soil)}>
              <option value="">Não sei</option>
              <option value="arenoso">Arenoso</option>
              <option value="medio">Textura média</option>
              <option value="argiloso">Argiloso (barrento)</option>
            </Select>
          </Label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label label="Taxa de semeadura (kg/ha)" hint={<><InfoKind kind="declarado" /> usada para calcular as sementes</>}>
            <Input type="number" min="0" step="any" inputMode="decimal" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Ex.: 55" />
          </Label>
          <label className="flex items-center gap-2 self-center rounded-lg border border-border px-3 py-2 text-sm">
            <input type="checkbox" checked={irrigated} onChange={(e) => setIrrigated(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
            Esta área é irrigada
          </label>
        </div>
        <Label label="Cor no mapa">
          <div className="flex flex-wrap items-center gap-2">
            {FIELD_COLORS.map((c) => (
              <button
                type="button" key={c} onClick={() => setColor(c)} aria-label={`Cor ${c}`}
                className={clsx('h-7 w-7 rounded-full border-2', color === c ? 'border-ink' : 'border-transparent')}
                style={{ background: c }}
              />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-border bg-surface" aria-label="Outra cor" />
          </div>
        </Label>
        <Label label="Observações">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: área mais plana, perto da estrada" />
        </Label>
        {error && <ErrorBox error={error} />}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : field ? 'Salvar ficha' : 'Salvar talhão'}</Button>
        </div>
      </form>
    </Modal>
  )
}
