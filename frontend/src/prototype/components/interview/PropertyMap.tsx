// Etapa "Desenhe sua propriedade": mapa de satélite em tela grande (Leaflet + Geoman) + lista de talhões com mini-formulário por chips.
// Padrão do mapa igual ao de pages/MapPage.tsx: criado em useEffect com ref e map.remove() na limpeza (React 19 / StrictMode).
import '@geoman-io/leaflet-geoman-free'
import { area as turfArea, polygon as turfPolygon } from '@turf/turf'
import clsx from 'clsx'
import L from 'leaflet'
import { Check, ChevronDown, Lightbulb, MousePointerClick, Move, PenLine, Sparkles, Trash2, Undo2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SATELLITE, SATELLITE_ATTR } from '../../../components/FieldsMap'
import { cropOf } from './context'
import { CROPS, IRRIGATION, SOILS, labelOf } from './options'
import type { FieldDraft } from './types'
import { fmtHa } from './format'
import { Chip } from './ui'

const FIELD_COLORS = ['#2E7D4F', '#D69E2E', '#2F6E91', '#C0392B', '#7B4FA3', '#E07B39', '#3AA6A0', '#8C6D3F']

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
/** API de desenho do Geoman que não está nos tipos públicos (mesma usada em MapPage). */
type DrawApi = { _removeLastVertex?: () => void; _finishShape?: () => void }
const drawApi = (map: L.Map) => (map.pm.Draw as unknown as { Polygon?: DrawApi }).Polygon

const btn = (v: 'primary' | 'secondary' | 'ghost' | 'danger') => clsx(
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
  v === 'primary' && 'bg-primary text-white shadow-sm hover:bg-primary-dark',
  v === 'secondary' && 'border-2 border-border bg-surface text-ink hover:border-primary/40 hover:bg-primary-soft/40',
  v === 'ghost' && 'text-muted hover:bg-bg hover:text-ink',
  v === 'danger' && 'text-danger hover:bg-danger-soft',
)

type Props = {
  fields: FieldDraft[]
  setFields: (updater: (prev: FieldDraft[]) => FieldDraft[]) => void
  /** [lat, lng] inicial do mapa (município) */
  center: [number, number]
  header: ReactNode
  /** conteúdo extra no fim da coluna lateral (ex.: contador de fontes) */
  footer?: ReactNode
  onLoadExample: () => void
  /** talhão aberto ao entrar (ex.: vindo do Mapa vivo) */
  initialSelected?: number | null
  /** texto do botão de exemplo (padrão: "Usar exemplo") */
  exampleLabel?: string
}

export function PropertyMap({ fields, setFields, center, header, footer, onLoadExample, initialSelected = null, exampleLabel = 'Usar exemplo' }: Props) {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const groupRef = useRef<L.FeatureGroup | null>(null)
  const layersRef = useRef(new Map<number, L.Polygon>())
  const centerRef = useRef(center)
  const fieldsRef = useRef(fields)
  const setFieldsRef = useRef(setFields)
  const needFit = useRef(fields.length > 0)
  const [ready, setReady] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [pickedId, setSelectedId] = useState<number | null>(initialSelected)
  /** talhão com os cantos sendo arrastados (Geoman edit mode) */
  const [shapeId, setShapeId] = useState<number | null>(null)
  // se o talhão selecionado foi removido, a seleção some sozinha
  const selectedId = pickedId != null && fields.some((f) => f.id === pickedId) ? pickedId : null

  // chamado pelo handler do Geoman (registrado uma única vez), por isso via ref
  const addRing = useRef<(coords: [number, number][]) => void>(() => {})
  const handleRing = (coords: [number, number][]) => {
    const closed = [...coords, coords[0]]
    const areaHa = turfArea(turfPolygon([closed])) / 10000
    if (!isFinite(areaHa) || areaHa < 0.005) return
    const n = fieldsRef.current.reduce((m, f) => Math.max(m, f.id), 0) + 1
    const f: FieldDraft = { id: n, name: `Talhão ${n}`, areaHa, ring: closed, color: FIELD_COLORS[(n - 1) % FIELD_COLORS.length] }
    needFit.current = false
    setFieldsRef.current((prev) => [...prev, f])
    setSelectedId(f.id)
  }
  useEffect(() => {
    fieldsRef.current = fields
    setFieldsRef.current = setFields
    addRing.current = handleRing
  })

  // --- criação do mapa (uma vez; StrictMode monta duas vezes, por isso o map.remove()) ---
  useEffect(() => {
    const el = mapEl.current
    if (!el) return
    const map = L.map(el, { center: centerRef.current, zoom: 15, maxZoom: 19, zoomControl: false })
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(map)
    L.tileLayer(SATELLITE, { attribution: SATELLITE_ATTR, maxZoom: 19 }).addTo(map)
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
      const ring = (layer.getLatLngs() as L.LatLng[][])[0].map((p) => [p.lng, p.lat] as [number, number])
      layer.remove() // o talhão "oficial" é redesenhado a partir do estado
      addRing.current(ring)
    })
    map.on('pm:drawend', () => setDrawing(false))

    const layers = layersRef.current
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    setReady(true)
    return () => {
      ro.disconnect()
      map.off()
      map.remove()
      mapRef.current = null; groupRef.current = null; layers.clear()
      setReady(false)
    }
  }, [])

  // --- desenha os talhões a partir do estado ---
  useEffect(() => {
    const map = mapRef.current, group = groupRef.current
    if (!map || !group || !ready || shapeId != null) return // ajustando formato: não redesenha por cima
    group.clearLayers(); layersRef.current.clear()
    fields.forEach((f) => {
      const on = f.id === selectedId
      const poly = L.polygon(f.ring.map(([lng, lat]) => [lat, lng] as L.LatLngTuple), {
        color: on ? '#FDE047' : '#ffffff', weight: on ? 4 : 2, fillColor: f.color, fillOpacity: on ? 0.65 : 0.5,
      })
      poly.on('click', () => { if (!map.pm.globalDrawModeEnabled() && !poly.pm.enabled()) setSelectedId(f.id) })
      poly.addTo(group)
      layersRef.current.set(f.id, poly)
      const crop = cropOf(f)
      L.marker(poly.getBounds().getCenter(), {
        interactive: false, keyboard: false, pmIgnore: true,
        icon: L.divIcon({
          className: '',
          html: `<div style="transform:translate(-50%,-50%);text-align:center;color:#fff;font-size:12px;font-weight:700;line-height:1.2;white-space:nowrap;text-shadow:0 1px 3px #000,0 0 2px #000">${esc(f.name)}<br/><span style="font-size:11px;font-weight:600">${fmtHa(f.areaHa)} ha${crop ? ` · ${esc(crop.label)}` : ''}</span></div>`,
        }),
      } as L.MarkerOptions).addTo(group)
    })
    if (needFit.current && fields.length) {
      const target = selectedId != null ? layersRef.current.get(selectedId) : undefined
      map.fitBounds((target ?? group).getBounds(), { padding: [60, 60], maxZoom: 18 })
      needFit.current = false
    }
  }, [fields, selectedId, ready, shapeId])

  // leva a ficha do talhão selecionado para a área visível (útil no celular, onde a lista fica abaixo do mapa)
  useEffect(() => {
    if (selectedId == null) return
    const t = window.setTimeout(() => document.getElementById(`field-li-${selectedId}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80)
    return () => window.clearTimeout(t)
  }, [selectedId])

  const startDraw = () => {
    const map = mapRef.current
    if (!map) return
    setSelectedId(null)
    setDrawing(true)
    map.pm.enableDraw('Polygon')
  }
  const cancelDraw = () => { mapRef.current?.pm.disableDraw(); setDrawing(false) }
  const focusField = (id: number) => {
    setSelectedId((cur) => (cur === id ? null : id))
    const layer = layersRef.current.get(id)
    if (layer) mapRef.current?.fitBounds(layer.getBounds(), { padding: [80, 80], maxZoom: 18 })
  }
  const startShape = (id: number) => {
    const layer = layersRef.current.get(id)
    if (!layer) return
    layer.setStyle({ color: '#FDE047', weight: 3, dashArray: '6,6' })
    layer.pm.enable({ allowSelfIntersection: false, snappable: true } as L.PM.EditModeOptions)
    mapRef.current?.fitBounds(layer.getBounds(), { padding: [80, 80], maxZoom: 18 })
    setShapeId(id)
  }
  const finishShape = () => {
    const id = shapeId
    const layer = id != null ? layersRef.current.get(id) : undefined
    if (id == null || !layer) return setShapeId(null)
    layer.pm.disable()
    const ring = (layer.getLatLngs() as L.LatLng[][])[0].map((p) => [p.lng, p.lat] as [number, number])
    const closed = [...ring, ring[0]]
    const areaHa = turfArea(turfPolygon([closed])) / 10000
    setShapeId(null)
    if (isFinite(areaHa) && areaHa >= 0.005) patch(id, { ring: closed, areaHa })
  }
  const cancelShape = () => {
    const layer = shapeId != null ? layersRef.current.get(shapeId) : undefined
    layer?.pm.disable()
    setShapeId(null) // redesenha a partir do estado (descarta o arraste)
  }
  const patch = (id: number, p: Partial<FieldDraft>) => setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)))
  const remove = (id: number) => setFields((prev) => prev.filter((f) => f.id !== id))
  const loadExample = () => { needFit.current = true; setSelectedId(null); onLoadExample() }
  const total = fields.reduce((s, f) => s + f.areaHa, 0)

  return (
    <div className="flex flex-col lg:h-full lg:flex-row">
      <div className="relative isolate h-[58vh] min-h-[360px] shrink-0 lg:h-full lg:flex-1">
        <div ref={mapEl} className="h-full w-full" style={{ background: '#1d2b22' }} />

        {!drawing && fields.length === 0 && (
          <div className="absolute inset-0 z-[1000] grid place-items-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface/95 p-5 text-center shadow-xl backdrop-blur animate-[proto-up_.3s_ease-out]">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary"><PenLine size={24} /></span>
              <h2 className="mt-3 text-lg font-bold text-ink">Marque a sua plantação no mapa</h2>
              <p className="mt-1 text-sm text-muted">Toque em cada canto do talhão. A área em hectares é calculada sozinha.</p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={startDraw} disabled={!ready} className={btn('primary')}><PenLine size={18} /> Desenhar meu primeiro talhão</button>
                <button type="button" onClick={loadExample} className={btn('ghost')}><Sparkles size={17} /> Usar exemplo para a demo</button>
              </div>
            </div>
          </div>
        )}

        {!drawing && shapeId == null && fields.length > 0 && (
          <button type="button" onClick={startDraw} disabled={!ready} className={clsx(btn('primary'), 'absolute left-3 top-3 z-[1000] py-2.5! shadow-lg')}>
            <PenLine size={17} /> Desenhar outro talhão
          </button>
        )}

        {shapeId != null && (
          <div className="absolute left-1/2 top-3 z-[1000] w-[min(94%,540px)] -translate-x-1/2 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur animate-[proto-up_.2s_ease-out]">
            <p className="flex items-start gap-2 text-sm">
              <Move size={17} className="mt-0.5 shrink-0 text-primary" />
              <span><b>Arraste os pontos brancos</b> para ajustar os cantos. Arraste um ponto do meio para criar um canto novo.</span>
            </p>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" className={clsx(btn('primary'), 'px-3! py-1.5! text-xs!')} onClick={finishShape}><Check size={14} /> Salvar formato</button>
              <button type="button" className={clsx(btn('ghost'), 'px-3! py-1.5! text-xs!')} onClick={cancelShape}><X size={14} /> Cancelar</button>
            </div>
          </div>
        )}

        {drawing && (
          <div className="absolute left-1/2 top-3 z-[1000] w-[min(94%,540px)] -translate-x-1/2 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur animate-[proto-up_.2s_ease-out]">
            <p className="flex items-start gap-2 text-sm">
              <MousePointerClick size={17} className="mt-0.5 shrink-0 text-primary" />
              <span><b>Toque em cada canto do talhão.</b> Para fechar, toque no primeiro ponto ou dê dois toques no último.</span>
            </p>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" className={clsx(btn('secondary'), 'px-3! py-1.5! text-xs!')} onClick={() => drawApi(mapRef.current!)?._removeLastVertex?.()}><Undo2 size={14} /> Desfazer ponto</button>
              <button type="button" className={clsx(btn('primary'), 'px-3! py-1.5! text-xs!')} onClick={() => drawApi(mapRef.current!)?._finishShape?.()}><Check size={14} /> Concluir desenho</button>
              <button type="button" className={clsx(btn('ghost'), 'px-3! py-1.5! text-xs!')} onClick={cancelDraw}><X size={14} /> Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <aside className="w-full shrink-0 border-t border-border bg-surface p-4 lg:h-full lg:w-[400px] lg:overflow-y-auto lg:border-l lg:border-t-0">
        {header}
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-[1.3fr_1fr]">
          <button type="button" onClick={startDraw} disabled={drawing || shapeId != null || !ready} className={clsx(btn('primary'), 'whitespace-nowrap px-3!')}><PenLine size={17} /> Desenhar talhão</button>
          <button type="button" onClick={loadExample} disabled={shapeId != null} className={clsx(btn('secondary'), 'whitespace-nowrap px-3!')}><Sparkles size={17} /> {exampleLabel}</button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">O exemplo carrega 3 talhões de um sítio em Araraquara/SP, para a demo rápida.</p>

        <h2 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Seus talhões {fields.length > 0 && `(${fields.length})`}</h2>
        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">Nenhum talhão ainda. Desenhe no mapa ou use o exemplo.</div>
        ) : (
          <ul className="space-y-2">
            {fields.map((f) => {
              const open = f.id === selectedId
              const crop = cropOf(f)
              return (
                <li key={f.id} id={`field-li-${f.id}`} className={clsx('overflow-hidden rounded-xl border-2 bg-surface transition-colors duration-200', open ? 'border-primary' : 'border-border')}>
                  <button type="button" onClick={() => focusField(f.id)} aria-expanded={open} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-bg">
                    <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: f.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{f.name} <span className="font-normal text-muted">· {fmtHa(f.areaHa)} ha</span></span>
                      <span className={clsx('block truncate text-xs', crop ? 'text-muted' : 'font-medium text-accent')}>
                        {crop ? [crop.label, labelOf(SOILS, f.soil)?.toLowerCase(), f.irrigation && f.irrigation !== 'nao' ? `irrigado (${labelOf(IRRIGATION, f.irrigation)?.toLowerCase()})` : undefined].filter(Boolean).join(' · ') : 'Escolha a cultura'}
                      </span>
                    </span>
                    <ChevronDown size={18} className={clsx('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} />
                  </button>
                  {open && <FieldForm f={f} onPatch={(p) => patch(f.id, p)} onRemove={() => { cancelShape(); remove(f.id) }} onDone={() => { if (shapeId === f.id) finishShape(); setSelectedId(null) }}
                    shaping={shapeId === f.id} onShape={() => (shapeId === f.id ? finishShape() : startShape(f.id))} />}
                </li>
              )
            })}
          </ul>
        )}

        {fields.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-soft/70 px-4 py-3">
            <span className="text-sm text-primary-dark">Total desenhado</span>
            <span className="text-lg font-bold text-primary-dark tabular-nums">{fmtHa(total)} ha</span>
          </div>
        )}
        {footer && <div className="mt-4 rounded-xl border border-primary/20 bg-primary-soft/50 p-4">{footer}</div>}
      </aside>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-muted">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function FieldForm({ f, onPatch, onRemove, onDone, shaping, onShape }: {
  f: FieldDraft; onPatch: (p: Partial<FieldDraft>) => void; onRemove: () => void; onDone: () => void; shaping: boolean; onShape: () => void
}) {
  return (
    <div className="space-y-4 border-t border-border p-3.5 animate-[proto-up_.2s_ease-out]">
      <button type="button" onClick={onShape} className={clsx(btn(shaping ? 'primary' : 'secondary'), 'w-full py-2! text-sm!')}>
        {shaping ? <><Check size={15} /> Salvar formato no mapa</> : <><Move size={15} /> Ajustar formato no mapa</>}
      </button>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Nome do talhão</span>
        <input value={f.name} onChange={(e) => onPatch({ name: e.target.value })} maxLength={30}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft" />
      </label>
      <Group title="O que você planta aqui?">
        {CROPS.map((c) => <Chip key={c.id} icon={c.icon} label={c.label} selected={f.crop === c.id} onClick={() => onPatch({ crop: f.crop === c.id ? undefined : c.id })} />)}
      </Group>
      <div>
        <Group title="Como é a terra?">
          {SOILS.map((s) => <Chip key={s.id} label={s.label} hint={s.hint} selected={f.soil === s.id} onClick={() => onPatch({ soil: f.soil === s.id ? undefined : s.id })} />)}
        </Group>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted">
          <Lightbulb size={13} className="mt-px shrink-0 text-accent" />
          Dica: pegue um punhado de terra úmida e aperte. Se esfarela, é arenoso. Se gruda e faz uma bolinha firme, é argiloso.
        </p>
      </div>
      <Group title="Irriga?">
        {IRRIGATION.map((i) => <Chip key={i.id} icon={i.icon} label={i.label} selected={f.irrigation === i.id} onClick={() => onPatch({ irrigation: f.irrigation === i.id ? undefined : i.id })} />)}
      </Group>
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={onRemove} className={clsx(btn('danger'), 'px-3! py-2! text-sm!')}><Trash2 size={15} /> Excluir</button>
        <button type="button" onClick={onDone} className={clsx(btn('primary'), 'px-4! py-2! text-sm!')}><Check size={15} /> Pronto</button>
      </div>
    </div>
  )
}
