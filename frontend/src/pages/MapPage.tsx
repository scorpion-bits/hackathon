// Mapa da propriedade: satélite, desenho/edição de talhões (Leaflet-Geoman) e ficha com Zarc + planejador.
import { area as turfArea } from '@turf/turf'
import '@geoman-io/leaflet-geoman-free'
import L from 'leaflet'
import { Check, Map as MapIcon, MousePointerClick, PenLine, Satellite, Undo2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { FIELD_COLORS, FieldFormModal } from '../components/map/FieldFormModal'
import { FieldSheet } from '../components/map/FieldSheet'
import { SATELLITE, SATELLITE_ATTR } from '../components/FieldsMap'
import { RegisterModal } from '../components/RegisterModal'
import { Badge, Button, Card, Empty, ErrorBox, Modal, PageHeader } from '../components/ui'
import { api, notifyDataChanged, type FieldT, type Polygon } from '../lib/api'
import { num } from '../lib/format'
import { useApi } from '../lib/hooks'

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTR = '© colaboradores do OpenStreetMap'
const DEFAULT_CENTER: L.LatLngTuple = [-21.83, -48.23]
const STAGE_TONE = { plantado: 'green', colhido: 'amber', vazio: 'gray' } as const

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const hectares = (geometry: Polygon) => turfArea({ type: 'Feature', properties: {}, geometry }) / 10000
/** API de desenho do Geoman que não está nos tipos públicos. */
type DrawApi = { _removeLastVertex?: () => void; _finishShape?: () => void }
const drawApi = (map: L.Map) => (map.pm.Draw as unknown as { Polygon?: DrawApi }).Polygon

type Draft = { geometry: Polygon; areaHa: number }

export default function MapPage() {
  const loc = useLocation()
  const { data: fields, error, reload } = useApi(api.fields)

  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const groupRef = useRef<L.FeatureGroup | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const layersRef = useRef(new Map<number, L.Polygon>())
  const draftLayerRef = useRef<L.Layer | null>(null)
  const pendingFocus = useRef<number | null>((loc.state as { field?: number } | null)?.field ?? null)
  const didFit = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [rebuild, setRebuild] = useState(0)

  const [base, setBase] = useState<'sat' | 'osm'>('sat')
  const [selectedId, setSelectedId] = useState<number | null>(pendingFocus.current)
  const [drawing, setDrawing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editArea, setEditArea] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formField, setFormField] = useState<FieldT | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const editingRef = useRef(false)
  editingRef.current = editing
  const selected = fields?.find((f) => f.id === selectedId) ?? null

  /** Enquadra um talhão (ou todos) no mapa. */
  const fitTo = useCallback((id?: number | null) => {
    const map = mapRef.current
    if (!map) return false
    const layer = id != null ? layersRef.current.get(id) : null
    if (layer) { map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 18 }); return true }
    const group = groupRef.current
    if (group && group.getLayers().length) { map.fitBounds(group.getBounds(), { padding: [30, 30] }); return true }
    return false
  }, [])

  const cancelEdit = useCallback(() => {
    layersRef.current.forEach((l) => l.pm.disable())
    setEditing(false); setEditArea(null)
    setRebuild((n) => n + 1) // volta a forma original
  }, [])

  const select = useCallback((id: number | null, focus = false) => {
    if (editingRef.current) cancelEdit()
    setActionError(null)
    setSelectedId(id)
    if (focus && id != null) fitTo(id)
  }, [cancelEdit, fitTo])

  // --- criação do mapa (uma vez; StrictMode monta duas vezes, por isso o map.remove()) ---
  useEffect(() => {
    if (!mapEl.current) return
    const map = L.map(mapEl.current, { center: DEFAULT_CENTER, zoom: 14, maxZoom: 19 })
    map.pm.setLang('pt_br')
    map.pm.setGlobalOptions({
      snappable: true, allowSelfIntersection: false, finishOn: 'dblclick', finishOnEnter: true,
      templineStyle: { color: '#FDE047', weight: 3 }, hintlineStyle: { color: '#FDE047', dashArray: '5,6' },
      pathOptions: { color: '#FDE047', weight: 3, fillColor: '#FDE047', fillOpacity: 0.3, dashArray: '6,6' },
    } as L.PM.GlobalOptions)
    groupRef.current = L.featureGroup().addTo(map)
    mapRef.current = map

    map.on('pm:create', (e) => {
      const layer = (e as unknown as { layer: L.Polygon }).layer
      const geometry = layer.toGeoJSON().geometry as Polygon
      const areaHa = hectares(geometry)
      layer.pm.disable()
      layer.bindTooltip(`${num(areaHa, 2)} ha`, { permanent: true, direction: 'center' })
      draftLayerRef.current = layer
      setDraft({ geometry, areaHa })
      setFormField(null)
      setFormOpen(true)
    })
    map.on('pm:drawend', () => setDrawing(false))

    setMapReady(true)
    return () => {
      map.off()
      map.remove()
      mapRef.current = null; groupRef.current = null; tileRef.current = null
      layersRef.current.clear(); draftLayerRef.current = null
      setMapReady(false)
    }
  }, [])

  // --- camada base (satélite / OpenStreetMap) ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    tileRef.current?.remove()
    const t = base === 'sat'
      ? L.tileLayer(SATELLITE, { attribution: SATELLITE_ATTR, maxZoom: 19 })
      : L.tileLayer(OSM, { attribution: OSM_ATTR, maxZoom: 19, subdomains: 'abc' })
    t.addTo(map).bringToBack()
    tileRef.current = t
  }, [base, mapReady])

  // --- desenha os talhões ---
  useEffect(() => {
    const map = mapRef.current, group = groupRef.current
    if (!map || !group || !mapReady || !fields) return
    group.clearLayers(); layersRef.current.clear()
    fields.forEach((f) => {
      const poly = L.geoJSON(f.geometry as GeoJSON.Polygon).getLayers()[0] as L.Polygon
      poly.bindTooltip(`<b>${esc(f.name)}</b><br/>${num(f.area_ha, 2)} ha · ${esc(f.status.label)}`, { sticky: true })
      poly.on('click', () => { if (!map.pm.globalDrawModeEnabled()) select(f.id) })
      poly.addTo(group)
      layersRef.current.set(f.id, poly)
      L.marker(poly.getBounds().getCenter(), {
        interactive: false, keyboard: false, pmIgnore: true,
        icon: L.divIcon({ className: '', html: `<div style="color:#fff;font-weight:700;font-size:12px;text-shadow:0 1px 3px #000,0 0 2px #000;white-space:nowrap;transform:translate(-50%,-50%)">${esc(f.name)}</div>` }),
      } as L.MarkerOptions).addTo(group)
    })
    if (pendingFocus.current != null && layersRef.current.has(pendingFocus.current)) {
      fitTo(pendingFocus.current); pendingFocus.current = null; didFit.current = true
    } else if (!didFit.current && fields.length) {
      fitTo(null); didFit.current = true
    }
  }, [fields, mapReady, rebuild, select, fitTo])

  // --- estilo (selecionado em destaque; contorno escuro no mapa claro) ---
  useEffect(() => {
    if (!fields) return
    const outline = base === 'sat' ? '#ffffff' : '#1C2B21'
    fields.forEach((f) => {
      const on = f.id === selectedId
      layersRef.current.get(f.id)?.setStyle({
        color: on ? '#FDE047' : outline, weight: on ? 4 : 2, fillColor: f.color ?? '#2E7D4F', fillOpacity: on ? 0.65 : 0.5,
      })
      if (on) layersRef.current.get(f.id)?.bringToFront()
    })
  }, [fields, selectedId, base, rebuild, mapReady])

  // se o talhão selecionado sumiu (excluído), limpa a seleção
  useEffect(() => {
    if (fields && selectedId != null && !fields.some((f) => f.id === selectedId)) setSelectedId(null)
  }, [fields, selectedId])

  // --- ações ---
  const startDraw = () => {
    const map = mapRef.current
    if (!map) return
    select(null)
    setDrawing(true)
    map.pm.enableDraw('Polygon')
  }
  const cancelDraw = () => { mapRef.current?.pm.disableDraw(); setDrawing(false) }

  const closeForm = () => {
    setFormOpen(false)
    if (draft) { draftLayerRef.current?.remove(); draftLayerRef.current = null; setDraft(null) }
  }
  const saved = async (f: FieldT) => {
    draftLayerRef.current?.remove(); draftLayerRef.current = null
    setDraft(null); setFormOpen(false)
    if (!formField) pendingFocus.current = f.id // talhão novo: enquadra assim que ele chegar na lista
    await reload() // só seleciona depois que a lista já tem o talhão novo
    setSelectedId(f.id)
  }

  const startEditShape = () => {
    if (!selected) return
    const layer = layersRef.current.get(selected.id)
    if (!layer) return
    setActionError(null)
    layer.pm.enable({ allowSelfIntersection: false, snappable: true })
    layer.on('pm:edit', () => setEditArea(hectares(layer.toGeoJSON().geometry as Polygon)))
    layer.on('pm:vertexremoved', () => setEditArea(hectares(layer.toGeoJSON().geometry as Polygon)))
    setEditArea(selected.area_ha)
    setEditing(true)
  }
  const saveShape = async () => {
    if (!selected) return
    const layer = layersRef.current.get(selected.id)
    if (!layer) return
    setBusy(true); setActionError(null)
    try {
      const geometry = layer.toGeoJSON().geometry as Polygon
      const { id: _id, area_ha: _a, status: _s, ...input } = selected
      await api.updateField(selected.id, { ...input, geometry })
      layer.pm.disable(); layer.off('pm:edit'); layer.off('pm:vertexremoved')
      setEditing(false); setEditArea(null)
      notifyDataChanged()
    } catch (e) {
      setActionError((e as Error).message)
    } finally { setBusy(false) }
  }
  const confirmDelete = async () => {
    if (!selected) return
    setBusy(true); setActionError(null)
    try {
      await api.deleteField(selected.id)
      setDeleteOpen(false)
      flushSync(() => setSelectedId(null)) // desmonta a ficha antes de avisar, para ela não recarregar um talhão que não existe mais
      notifyDataChanged()
    } catch (e) {
      setActionError((e as Error).message); setDeleteOpen(false)
    } finally { setBusy(false) }
  }

  const baseBtn = (k: 'sat' | 'osm', label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setBase(k)} aria-pressed={base === k}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${base === k ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-bg'}`}
    >{icon}{label}</button>
  )

  return (
    <div>
      <PageHeader
        title="Mapa da propriedade"
        subtitle="Desenhe os talhões marcando os cantos no mapa. A área em hectares é calculada sozinha."
        actions={
          <>
            <div className="inline-flex overflow-hidden rounded-lg border border-border">
              {baseBtn('sat', 'Satélite', <Satellite size={15} />)}
              {baseBtn('osm', 'Mapa', <MapIcon size={15} />)}
            </div>
            <Button onClick={startDraw} disabled={drawing || editing || !mapReady}><PenLine size={16} /> Desenhar talhão</Button>
          </>
        }
      />
      {error && <div className="mb-3"><ErrorBox error={error} /></div>}
      {actionError && <div className="mb-3"><ErrorBox error={actionError} /></div>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="relative isolate overflow-hidden rounded-xl border border-border shadow-sm">
          <div ref={mapEl} className="h-[calc(100vh-200px)] min-h-[420px] w-full bg-bg" />

          {drawing && (
            <div className="absolute left-1/2 top-3 z-[800] w-[min(92%,520px)] -translate-x-1/2 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
              <p className="flex items-start gap-2 text-sm"><MousePointerClick size={16} className="mt-0.5 shrink-0 text-primary" />
                <span><b>Clique em cada canto do talhão.</b> Para fechar, clique no primeiro ponto ou dê dois cliques no último.</span>
              </p>
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => drawApi(mapRef.current!)?._removeLastVertex?.()}><Undo2 size={14} /> Desfazer ponto</Button>
                <Button size="sm" onClick={() => drawApi(mapRef.current!)?._finishShape?.()}><Check size={14} /> Concluir desenho</Button>
                <Button size="sm" variant="ghost" onClick={cancelDraw}><X size={14} /> Cancelar</Button>
              </div>
            </div>
          )}

          {editing && selected && (
            <div className="absolute left-1/2 top-3 z-[800] w-[min(92%,520px)] -translate-x-1/2 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
              <p className="text-sm"><b>Editando os limites de {selected.name}.</b> Arraste os pontos para mover; clique no ponto do meio de uma linha para criar outro canto.</p>
              <p className="mt-1 text-xs text-muted">Área: <b className="text-ink">{num(editArea ?? selected.area_ha, 2)} ha</b></p>
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={busy}><X size={14} /> Cancelar</Button>
                <Button size="sm" onClick={saveShape} disabled={busy}><Check size={14} /> {busy ? 'Salvando…' : 'Salvar limites'}</Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-1">
          {selected ? (
            <FieldSheet
              key={selected.id} field={selected} busy={busy || editing}
              onClose={() => select(null)}
              onEditSheet={() => { setFormField(selected); setFormOpen(true) }}
              onEditShape={startEditShape}
              onDelete={() => setDeleteOpen(true)}
              onRegister={() => setRegisterOpen(true)}
            />
          ) : (
            <Card title="Seus talhões" padded={false}>
              {!fields ? <p className="p-4 text-sm text-muted">Carregando…</p> : fields.length === 0 ? (
                <div className="p-4"><Empty>Nenhum talhão ainda. Use <b>Desenhar talhão</b> para marcar o primeiro no mapa.</Empty></div>
              ) : (
                <>
                  <p className="border-b border-border px-4 py-2 text-xs text-muted">Clique em um talhão no mapa ou na lista para ver a ficha, o risco climático e o planejador de plantio.</p>
                  <ul className="divide-y divide-border">
                    {fields.map((f) => (
                      <li key={f.id}>
                        <button onClick={() => select(f.id, true)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg">
                          <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: f.color ?? FIELD_COLORS[0] }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{f.name} <span className="font-normal text-muted">· {num(f.area_ha, 2)} ha</span></span>
                            <span className="block truncate text-xs text-muted">{f.status.label}</span>
                          </span>
                          <Badge tone={STAGE_TONE[f.status.stage]}>{f.status.stage}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}
        </div>
      </div>

      <FieldFormModal
        open={formOpen} field={formField} geometry={draft?.geometry ?? null} areaHa={draft?.areaHa ?? null}
        onClose={closeForm} onSaved={saved}
      />
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} fieldId={selected?.id} />
      <Modal open={deleteOpen} title="Excluir talhão?" onClose={() => setDeleteOpen(false)}>
        <p className="text-sm">Você vai excluir o talhão <b>{selected?.name}</b> ({num(selected?.area_ha, 2)} ha) do mapa. Os registros antigos de atividades continuam guardados, mas deixam de aparecer neste talhão.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Manter talhão</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={busy}>{busy ? 'Excluindo…' : 'Sim, excluir'}</Button>
        </div>
      </Modal>
    </div>
  )
}
