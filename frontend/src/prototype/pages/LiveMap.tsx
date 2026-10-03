// "Mapa vivo" — GLOBO 3D com camadas de DADOS ABERTOS sobre a propriedade do produtor.
// Protótipo visual (D-009): talhões, previsão e textos vêm de mock.ts; camadas de satélite são NASA GIBS reais
// (tiles abertos, sem chave). Sem rede externa o globo continua com fundo, grade e talhões (erros de tile só vão ao log).
import 'maplibre-gl/dist/maplibre-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Guide, type Place } from '../components/livemap/Guide'
import { MobileUI } from '../components/livemap/MobileUI'
import { Controls, FarmPin, FieldCard, FieldLabel, ForecastBars, Timeline } from '../components/livemap/Panels'
import { kmPerPixel, useCoverage } from '../components/livemap/coverage'
import { DATA_LAYERS, GIBS_ATTRIBUTION, addDays, gibsTileUrl, gibsTime, shortDate } from '../components/livemap/layers'
import { Map as MLMap, Marker, type GeoJSONSource, type RasterTileSource } from '../components/livemap/maplibre'
import { L, buildStyle, centroid, fieldsGeoJSON } from '../components/livemap/mapStyle'
import { FIELDS, PRODUCER } from '../mock'

const BRAZIL = { center: [-53, -14.5] as [number, number], zoom: 2 }
/** Pontos e centro da propriedade lidos na hora (os talhões podem ter sido editados). */
const allPoints = () => { const pts = FIELDS.flatMap((f) => f.poly); return pts.length ? pts : [[PRODUCER.lon, PRODUCER.lat]] }
function homeCenter(): [number, number] {
  const a = allPoints()
  return [(Math.min(...a.map((p) => p[0])) + Math.max(...a.map((p) => p[0]))) / 2, (Math.min(...a.map((p) => p[1])) + Math.max(...a.map((p) => p[1]))) / 2]
}
// Os talhões somam ~10 ha (≈ 470 × 440 m): zoom ~16 enquadra a propriedade inteira (no celular, um pouco menos).
const HOME_ZOOM = 15.9
const LABEL_ZOOM = 14.5
const THEMATIC_SRC = 'thematic'

/** Área livre do mapa (descontando painéis flutuantes) para centralizar a câmera. */
function viewPadding(m: MLMap, withCard = false) {
  return m.getContainer().clientWidth >= 1024
    ? { top: 40, bottom: 100, left: 390, right: withCard ? 400 : 80 }
    : { top: 70, bottom: withCard ? 110 : 130, left: 0, right: 0 } // celular: só a barra do topo e um cartão embaixo
}

type MarkerEls = { labels: { id: number; el: HTMLElement }[]; pin: HTMLElement; forecast: HTMLElement }

const SPACE_BG = [
  'radial-gradient(1px 1px at 23px 41px, rgba(255,255,255,.75), transparent 60%)',
  'radial-gradient(1px 1px at 141px 97px, rgba(255,255,255,.55), transparent 60%)',
  'radial-gradient(1.5px 1.5px at 77px 163px, rgba(255,255,255,.65), transparent 60%)',
  'radial-gradient(1px 1px at 189px 21px, rgba(200,230,255,.6), transparent 60%)',
  'radial-gradient(1px 1px at 211px 189px, rgba(255,255,255,.45), transparent 60%)',
  'radial-gradient(ellipse at 50% 45%, #10314a 0%, #071420 50%, #02060a 100%)',
].join(',')

export default function LiveMap() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const thematicKey = useRef<string | null>(null)
  const [params] = useSearchParams()
  const focusField = Number(params.get('talhao')) || null // vindo de um assunto: abre direto no talhão

  const today = useMemo(() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d }, [])
  const [ready, setReady] = useState(false)
  const [markers, setMarkers] = useState<MarkerEls | null>(null)
  const [zoom, setZoom] = useState(BRAZIL.zoom)
  const [layerId, setLayerId] = useState('zarc') // abre no dado que é do talhão (Zarc); satélite é da região
  const [opacity, setOpacity] = useState<Record<string, number>>(() => Object.fromEntries(DATA_LAYERS.map((l) => [l.id, l.defaultOpacity])))
  const [offset, setOffset] = useState(-1) // ontem: dia mais recente com imagem de satélite completa
  const [playing, setPlaying] = useState(false)
  const [latest, setLatest] = useState(false)
  const [base, setBase] = useState<'sat' | 'map'>('sat')
  const [proj, setProj] = useState<'globe' | 'mercator'>('globe')
  const [selected, setSelected] = useState<number | null>(null)
  const [area, setArea] = useState<'farm' | 'brazil'>('farm')
  const place: Place = selected ?? area
  const [fs, setFs] = useState(false)

  const layer = DATA_LAYERS.find((l) => l.id === layerId) ?? null
  const date = useMemo(() => addDays(today, offset), [today, offset])
  const time = layer?.gibs ? gibsTime(layer.gibs, today, offset, latest) : null
  const layerOpacity = layer ? opacity[layer.id] : 1
  const [homeLon, homeLat] = homeCenter()
  const coverage = useCoverage(layer?.gibs, time, homeLon, homeLat)

  const flyHome = useCallback((m = mapRef.current) => {
    if (m) m.flyTo({ center: homeCenter(), zoom: m.getContainer().clientWidth < 640 ? HOME_ZOOM - 0.7 : HOME_ZOOM, pitch: 52, bearing: -18, padding: viewPadding(m), duration: 7000, curve: 1.6, essential: true })
  }, [])
  const flyField = useCallback((id: number) => {
    const m = mapRef.current
    const f = FIELDS.find((x) => x.id === id)
    setSelected(id)
    if (m && f) m.flyTo({ center: centroid(f.poly), zoom: m.getContainer().clientWidth < 640 ? 16.6 : 17.2, pitch: 55, bearing: -18, padding: viewPadding(m, true), duration: 2500, curve: 1.5, essential: true })
  }, [])
  const flyBrazil = useCallback(() => {
    const m = mapRef.current
    setSelected(null)
    if (m) m.flyTo({ ...BRAZIL, pitch: 0, bearing: 0, padding: viewPadding(m), duration: 4500, curve: 1.6, essential: true })
  }, [])

  // Imagens da NASA têm 0,3–2 km por ponto: perto do talhão viram uma cor só. Ao escolher uma delas, afasta para a região.
  const flyRegion = useCallback((maxzoom: number) => {
    const m = mapRef.current
    setSelected(null)
    if (m) m.flyTo({ center: homeCenter(), zoom: maxzoom + 2, pitch: 30, bearing: 0, padding: viewPadding(m), duration: 2500, curve: 1.5, essential: true })
  }, [])
  useEffect(() => {
    const m = mapRef.current
    if (m && ready && layer?.gibs && m.getZoom() > layer.gibs.maxzoom + 3) flyRegion(layer.gibs.maxzoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando muda a camada
  }, [layerId, ready])

  // ---------- criação do mapa (uma vez; StrictMode-safe)
  useEffect(() => {
    if (!mapEl.current) return
    const map = new MLMap({
      container: mapEl.current,
      style: buildStyle(addDays(today, -1)),
      center: BRAZIL.center, zoom: 1.6,
      attributionControl: false, // atribuição exibida na linha do tempo
      maxPitch: 70,
      fadeDuration: 200,
    })
    mapRef.current = map
    if (import.meta.env.DEV) (window as unknown as { __liveMap?: MLMap }).__liveMap = map // depuração/capturas
    let timer: ReturnType<typeof setTimeout> | undefined

    // Rede externa pode estar bloqueada: tiles falham em silêncio, globo segue com fundo + talhões.
    map.on('error', (e) => console.debug('[Mapa vivo] recurso não carregou:', e.error?.message ?? e))
    map.on('zoom', () => setZoom(Math.round(map.getZoom() * 4) / 4))
    // 'style.load' (e não 'load'): sem rede, os tiles falham e o 'load' só dispara no próximo repaint.
    map.once('style.load', () => {
      setReady(true)
      map.triggerRepaint()
      timer = setTimeout(() => (focusField && FIELDS.some((f) => f.id === focusField) ? flyField(focusField) : flyHome(map)), 1400)
    })
    map.on('click', (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: [L.fill] })[0]
      const id = hit ? Number(hit.properties?.id) : null
      setSelected(id)
      const f = FIELDS.find((x) => x.id === id)
      if (f) {
        // o cartão ocupa a coluna esquerda (desktop) ou a parte de baixo (mobile): centraliza na área livre
        map.easeTo({ center: centroid(f.poly), padding: viewPadding(map, true), duration: 700 })
      }
    })
    map.on('mouseenter', L.fill, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', L.fill, () => { map.getCanvas().style.cursor = '' })

    // Marcadores HTML (rótulos não dependem de fontes/glyphs da internet); conteúdo via React portal.
    const mk = (lngLat: [number, number], anchor: 'center' | 'bottom', offsetY = 0, interactive = false) => {
      const el = document.createElement('div')
      if (!interactive) el.style.pointerEvents = 'none'
      new Marker({ element: el, anchor, offset: [0, offsetY] }).setLngLat(lngLat).addTo(map)
      return el
    }
    setMarkers({
      labels: FIELDS.map((f) => ({ id: f.id, el: mk(centroid(f.poly), 'center') })),
      pin: mk([PRODUCER.lon, PRODUCER.lat], 'bottom', 0, true),
      forecast: mk([homeCenter()[0], Math.max(...allPoints().map((p) => p[1]))], 'bottom', -18), // acima da borda norte da propriedade
    })

    return () => {
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
      thematicKey.current = null
      setReady(false)
      setMarkers(null)
    }
  }, [today, flyHome])

  // ---------- camada temática (GIBS) + modo de cor dos talhões
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const gibs = layer?.gibs
    const key = gibs ? `${layer.id}` : null
    if (thematicKey.current !== key) {
      if (map.getLayer(L.thematic)) map.removeLayer(L.thematic)
      if (map.getSource(THEMATIC_SRC)) map.removeSource(THEMATIC_SRC)
      if (gibs && time) {
        map.addSource(THEMATIC_SRC, { type: 'raster', tiles: [gibsTileUrl(gibs, time)], tileSize: 256, maxzoom: gibs.maxzoom, attribution: GIBS_ATTRIBUTION })
        map.addLayer({ id: L.thematic, type: 'raster', source: THEMATIC_SRC, paint: { 'raster-opacity': layerOpacity, 'raster-fade-duration': 300 } }, L.fill)
      }
      thematicKey.current = key
    } else if (gibs && time) {
      ;(map.getSource(THEMATIC_SRC) as RasterTileSource | undefined)?.setTiles([gibsTileUrl(gibs, time)])
    }
    const zarc = layerId === 'zarc'
    map.setPaintProperty(L.fill, 'fill-color', zarc ? ['get', 'riskColor'] : ['get', 'color'])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- opacidade tem efeito próprio
  }, [ready, layerId, time])

  // ---------- opacidade
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (layerId === 'zarc') map.setPaintProperty(L.fill, 'fill-opacity', layerOpacity)
    else {
      map.setPaintProperty(L.fill, 'fill-opacity', 0.38)
      if (map.getLayer(L.thematic)) map.setPaintProperty(L.thematic, 'raster-opacity', layerOpacity)
    }
  }, [ready, layerId, layerOpacity])

  // ---------- risco Zarc na data escolhida (decêndio)
  useEffect(() => {
    if (!ready) return
    ;(mapRef.current?.getSource('fields') as GeoJSONSource | undefined)?.setData(fieldsGeoJSON(date))
  }, [ready, date])

  // ---------- base satélite / mapa
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    map.setLayoutProperty(L.esri, 'visibility', base === 'sat' ? 'visible' : 'none')
    map.setLayoutProperty(L.osm, 'visibility', base === 'map' ? 'visible' : 'none')
  }, [ready, base])

  // ---------- globo / plano
  useEffect(() => {
    if (ready) mapRef.current?.setProjection({ type: proj })
  }, [ready, proj])

  // ---------- talhão selecionado (halo)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    FIELDS.forEach((f) => map.setFeatureState({ source: 'fields', id: f.id }, { selected: f.id === selected }))
  }, [ready, selected])

  // ---------- play da linha do tempo
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setOffset((o) => (o >= 7 ? -7 : o + 1)), 1500)
    return () => clearInterval(t)
  }, [playing])

  // ---------- tela cheia
  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void wrapRef.current?.requestFullscreen?.().catch(() => undefined)
  }

  const near = zoom >= LABEL_ZOOM
  const showForecast = zoom >= 9 && selected === null && (layerId === 'chuva' || offset > 0)
  const attribution = [base === 'sat' ? 'Imagens © Esri, Maxar' : '© OpenStreetMap', layer?.gibs ? GIBS_ATTRIBUTION : null, 'Zarc/MAPA'].filter(Boolean).join(' · ')

  return (
    <div ref={wrapRef} className="relative h-full min-h-[560px] w-full overflow-hidden text-white" style={{ background: SPACE_BG, backgroundSize: '233px 211px, 233px 211px, 233px 211px, 233px 211px, 233px 211px, 100% 100%' }}>
      <div className="absolute inset-0"><div ref={mapEl} className="h-full w-full" /></div>

      {markers && (
        <>
          {markers.labels.map(({ id, el }) => createPortal(<FieldLabel id={id} show={near} zarc={layerId === 'zarc'} date={date} />, el, `lbl-${id}`))}
          {createPortal(<FarmPin show={!near} onClick={() => { setArea('farm'); flyHome() }} />, markers.pin, 'pin')}
          {createPortal(<ForecastBars show={showForecast} offset={offset} />, markers.forecast, 'fc')}
        </>
      )}

      {layer?.gibs && (coverage === 'empty' || zoom > layer.gibs.maxzoom + 3) && (
        <div role="status" className="absolute left-3 right-3 top-16 z-20 mx-auto max-w-md rounded-xl bg-black/75 px-3.5 py-2.5 text-[13px] leading-snug text-white shadow-lg ring-1 ring-white/15 backdrop-blur md:left-[360px]">
          {coverage === 'empty' && (layer.gibs.emptyMeans
            ? <p>{layer.gibs.emptyMeans}</p>
            : <p><b>Sem imagem de {layer.label.toLowerCase()} sobre a sua propriedade {time === 'default' ? 'na imagem mais recente' : `em ${shortDate(date)}`}</b> (nuvem, ou o satélite não passou). Mude o dia na linha do tempo.</p>)}
          {zoom > layer.gibs.maxzoom + 3 && (
            <p className={coverage === 'empty' ? 'mt-1.5 text-white/80' : ''}>
              Cada ponto desta imagem cobre ≈{kmPerPixel(layer.gibs, homeLat).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km: mostra a região, não o talhão.{' '}
              <button type="button" onClick={() => flyRegion(layer.gibs!.maxzoom)} className="font-semibold text-emerald-300 underline">Ver a região</button>
            </p>
          )}
        </div>
      )}

      <Controls
        onZoomIn={() => mapRef.current?.zoomIn()} onZoomOut={() => mapRef.current?.zoomOut()}
        proj={proj} onProj={() => setProj((p) => (p === 'globe' ? 'mercator' : 'globe'))}
        base={base} onBase={() => setBase((b) => (b === 'sat' ? 'map' : 'sat'))}
        fs={fs} onFs={toggleFs}
      />
      <Guide
        place={place}
        onPlace={(pl) => {
          if (pl === 'brazil') { setArea('brazil'); flyBrazil() }
          else if (pl === 'farm') { setArea('farm'); setSelected(null); flyHome() }
          else flyField(pl)
        }}
        layerId={layerId} onLayer={(id) => { setLayerId(id); setLatest(false) }}
        date={date} offset={offset} time={time}
        opacity={layerOpacity} onOpacity={(v) => layer && setOpacity((o) => ({ ...o, [layer.id]: v }))}
        latest={latest} onLatest={() => setLatest((v) => !v)}
      />
      {selected !== null && <FieldCard id={selected} date={date} onClose={() => setSelected(null)} />}
      <MobileUI
        place={place}
        onPlace={(pl) => {
          if (pl === 'brazil') { setArea('brazil'); setSelected(null); flyBrazil() }
          else if (pl === 'farm') { setArea('farm'); setSelected(null); flyHome() }
          else flyField(pl)
        }}
        layerId={layerId} onLayer={(id) => { setLayerId(id); setLatest(false) }}
        selected={selected} onDeselect={() => setSelected(null)}
        today={today} date={date} offset={offset} onOffset={(o) => { setOffset(o); setPlaying(false) }} playing={playing} onPlay={() => setPlaying((v) => !v)} time={time}
        opacity={layerOpacity} onOpacity={(v) => layer && setOpacity((o) => ({ ...o, [layer.id]: v }))}
        latest={latest} onLatest={() => setLatest((v) => !v)}
        base={base} onBase={() => setBase((b) => (b === 'sat' ? 'map' : 'sat'))}
        proj={proj} onProj={() => setProj((pr) => (pr === 'globe' ? 'mercator' : 'globe'))}
        attribution={attribution}
      />
      <Timeline today={today} offset={offset} onOffset={(o) => { setOffset(o); setPlaying(false) }} playing={playing} onPlay={() => setPlaying((v) => !v)} attribution={attribution} />
    </div>
  )
}
