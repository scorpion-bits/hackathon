// Mapa vivo no CELULAR: interface mínima sobre o mapa (D-016).
// Na tela: 2 botões no topo (lugar · camadas) e 1 cartão compacto embaixo. O detalhe técnico (legenda, fonte, dia,
// NDVI, ajustes) só aparece quando o usuário toca — numa gaveta que sobe de baixo.
import clsx from 'clsx'
import { CalendarDays, ChevronDown, ChevronRight, CloudRain, Earth, Home, Layers, Map as MapIcon, Pencil, Satellite, SlidersHorizontal, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FIELDS, PRODUCER } from '../../mock'
import { OriginTag } from '../Shell'
import { IsoCube } from '../Brand'
import { Legend, type Place } from './Guide'
import { DATA_LAYERS, RISK_COLOR, forecastAt, riskFor, riskPill, shortDate, useForecast, useMeaningCtx, weekday } from './layers'
import { DarkSource, FieldCard, PANEL, Timeline } from './Panels'

const ORDER = ['chuva', 'zarc', 'ndvi', 'umidade', 'temp', 'fogo', 'cor']
const LAYERS = ORDER.map((id) => DATA_LAYERS.find((l) => l.id === id)!).filter(Boolean)
/** cor do cubo de cada camada (topo, esquerda, direita) */
const CUBE: Record<string, [string, string, string]> = {
  chuva: ['#9CC9E6', '#5BA3D0', '#2F6E91'], zarc: ['#F3D29B', '#E2AE5F', '#9A6516'], ndvi: ['#7BE3A8', '#4FD08A', '#1F7A45'],
  umidade: ['#A8DCD6', '#5FB8AE', '#2F7F78'], temp: ['#F6B48A', '#E5844D', '#A8481C'], fogo: ['#F7A08F', '#E5484D', '#9B1C1F'], cor: ['#D6DCE3', '#AAB4BF', '#6B7684'],
}

type Sheet = null | 'place' | 'layers' | 'info' | 'field'

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 lg:hidden" role="dialog" aria-label={title}>
      <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div className={clsx(PANEL, 'absolute inset-x-0 bottom-0 max-h-[78%] overflow-y-auto rounded-b-none rounded-t-3xl px-4 pb-5 pt-2')}>
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/25" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function MobileUI(p: {
  place: Place; onPlace: (pl: Place) => void
  layerId: string; onLayer: (id: string) => void
  selected: number | null; onDeselect: () => void
  today: Date; date: Date; offset: number; onOffset: (o: number) => void; playing: boolean; onPlay: () => void; time: string | null
  opacity: number; onOpacity: (v: number) => void; latest: boolean; onLatest: () => void
  base: 'sat' | 'map'; onBase: () => void; proj: 'globe' | 'mercator'; onProj: () => void; attribution: string
}) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const layer = DATA_LAYERS.find((l) => l.id === p.layerId) ?? null
  const field = p.selected != null ? FIELDS.find((f) => f.id === p.selected) : undefined
  const placeLabel = field ? `${field.name} · ${field.crop.replace(' irrigado', '')}` : p.place === 'brazil' ? 'Brasil' : PRODUCER.farm
  const dayLabel = p.offset === 0 ? 'hoje' : `${weekday(p.date)} ${shortDate(p.date)}`
  const fcast = useForecast()
  const fc = forecastAt(fcast.days, p.offset)
  const mctx = useMeaningCtx(FIELDS)
  const go = (pl: Place) => { p.onPlace(pl); setSheet(null) }

  return (
    <div className="lg:hidden">
      {/* ---------- topo: lugar (esq.) e camadas (dir.) */}
      <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex items-start justify-between gap-2">
        <button onClick={() => setSheet('place')} className={clsx(PANEL, 'pointer-events-auto flex min-h-11 max-w-[70%] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3')}>
          <IsoCube size={30} />
          <span className="truncate text-sm font-semibold">{placeLabel}</span>
          <ChevronDown size={16} className="shrink-0 text-white/70" />
        </button>
        <button onClick={() => setSheet('layers')} aria-label="Escolher o que ver no mapa" className={clsx(PANEL, 'pointer-events-auto grid h-12 w-12 place-items-center rounded-2xl')}>
          {layer ? <layer.icon size={20} /> : <Layers size={20} />}
        </button>
      </div>

      {/* ---------- embaixo: UM cartão compacto */}
      <div className="absolute inset-x-2 bottom-2 z-20">
        {field ? (
          <div className={clsx(PANEL, 'flex items-center gap-3 p-3')}>
            <span className="h-10 w-10 shrink-0 rounded-xl ring-2 ring-white/80" style={{ background: field.color }} />
            <button onClick={() => setSheet('field')} className="min-w-0 flex-1 text-left">
              <span className="block truncate font-display font-bold">{field.name} · {field.crop.replace(' irrigado', '')}</span>
              <span className="mt-0.5 flex items-center gap-2 text-xs text-white/70">
                {field.area.toLocaleString('pt-BR')} ha
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: RISK_COLOR(riskFor(field, p.date)) }}>
                  {riskPill(riskFor(field, p.date))}
                </span>
              </span>
            </button>
            <button onClick={() => setSheet('field')} className="min-h-11 rounded-xl bg-white px-3 text-sm font-bold text-ink">Detalhes</button>
            <button onClick={p.onDeselect} aria-label="Fechar talhão" className="grid h-10 w-8 place-items-center text-white/60"><X size={18} /></button>
          </div>
        ) : layer ? (
          <button onClick={() => setSheet('info')} className={clsx(PANEL, 'flex w-full items-center gap-3 p-3 text-left')}>
            <IsoCube size={38} top={CUBE[layer.id]?.[0]} left={CUBE[layer.id]?.[1]} right={CUBE[layer.id]?.[2]} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-bold">{layer.question}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80"><CalendarDays size={10} />{dayLabel}</span>
              </span>
              <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/80">{layer.meaning(p.date, mctx)}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-white/50" />
          </button>
        ) : (
          <button onClick={() => setSheet('layers')} className={clsx(PANEL, 'flex min-h-14 w-full items-center justify-center gap-2 p-3 text-sm font-semibold')}><Layers size={18} /> O que você quer ver no mapa?</button>
        )}
      </div>

      {/* ---------- gavetas */}
      {sheet === 'place' && (
        <Drawer title="Onde você quer olhar?" onClose={() => setSheet(null)}>
          <div className="space-y-2">
            <button onClick={() => go('farm')} className={clsx('flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left ring-1', p.place === 'farm' ? 'bg-emerald-400/20 ring-emerald-300' : 'bg-white/5 ring-white/10')}>
              <Home size={20} className="text-emerald-300" />
              <span><b className="block">{PRODUCER.farm}</b><span className="text-xs text-white/60">{PRODUCER.municipality}/{PRODUCER.uf} · {PRODUCER.area_ha.toLocaleString('pt-BR')} ha · {FIELDS.length} talhões</span></span>
            </button>
            {FIELDS.map((f) => {
              const r = riskFor(f, p.date)
              return (
                <button key={f.id} onClick={() => go(f.id)} className={clsx('flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left ring-1', p.place === f.id ? 'bg-white text-ink ring-white' : 'bg-white/5 ring-white/10')}>
                  <span className="h-4 w-4 shrink-0 rounded ring-2 ring-white/70" style={{ background: f.color }} />
                  <span className="flex-1 font-semibold">{f.name} · {f.crop.replace(' irrigado', '')} <span className="text-xs font-normal opacity-60">{f.area.toLocaleString('pt-BR')} ha</span></span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: RISK_COLOR(r) }}>{r == null ? 'sem Zarc' : r ? `${r}%` : 'fora'}</span>
                </button>
              )
            })}
            <Link to="/talhoes" className="iso-btn mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display font-bold text-white">
              <Pencil size={17} /> Adicionar ou editar talhões
            </Link>
            <button onClick={() => go('brazil')} className="flex min-h-11 w-full items-center justify-center gap-1.5 text-sm font-semibold text-white/70"><Earth size={16} /> Ver o Brasil todo</button>
          </div>
        </Drawer>
      )}

      {sheet === 'layers' && (
        <Drawer title="O que você quer saber?" onClose={() => setSheet(null)}>
          <div className="grid grid-cols-2 gap-2">
            {LAYERS.map((l) => {
              const on = l.id === p.layerId
              const c = CUBE[l.id]
              return (
                <button key={l.id} onClick={() => { p.onLayer(l.id); setSheet(null) }} aria-pressed={on}
                  className={clsx('flex min-h-16 items-center gap-2.5 rounded-2xl p-2.5 text-left text-sm font-semibold ring-1', on ? 'bg-white text-ink ring-white' : 'bg-white/5 ring-white/10')}>
                  <IsoCube size={34} top={c?.[0]} left={c?.[1]} right={c?.[2]} />
                  <span className="leading-tight">{l.question}</span>
                </button>
              )
            })}
          </div>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-white/50">Fundo do mapa</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={p.onBase} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold">{p.base === 'sat' ? <><MapIcon size={16} /> Ver mapa de ruas</> : <><Satellite size={16} /> Ver satélite</>}</button>
            <button onClick={p.onProj} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold"><Earth size={16} /> {p.proj === 'globe' ? 'Ver plano' : 'Ver globo'}</button>
          </div>
        </Drawer>
      )}

      {sheet === 'info' && layer && (
        <Drawer title={layer.question} onClose={() => setSheet(null)}>
          <p className="text-[15px] leading-relaxed">{layer.meaning(p.date, mctx)}</p>
          {!!layer.gibs && p.offset > 0 && (
            <p className="mt-3 flex gap-2 rounded-xl bg-amber-400/15 p-3 text-sm text-amber-100"><CloudRain size={16} className="mt-0.5 shrink-0" />
              Satélite só mostra o passado. Para {dayLabel}{fc ? `, a previsão é de ${fc.rain} mm de chuva` : ''}.</p>
          )}
          <div className="mt-4"><Legend layer={layer} /></div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5"><DarkSource>{layer.source.chip}</DarkSource><OriginTag origin={layer.origin} /></div>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-white/50">Escolha o dia</h3>
          <Timeline embedded today={p.today} offset={p.offset} onOffset={p.onOffset} playing={p.playing} onPlay={p.onPlay} attribution={p.attribution} />
          <details className="mt-4 text-sm text-white/75">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold"><SlidersHorizontal size={15} /> Detalhes técnicos</summary>
            <p className="mt-1 text-xs text-white/60">{layer.source.detail}{layer.gibs ? ` · ${layer.gibs.cadence} · camada ${layer.gibs.layer} · cores aproximadas` : ''}</p>
            <p className="mt-1 text-xs text-white/60">{layer.gibs ? (p.time === 'default' ? 'imagem mais recente disponível' : `imagem de ${p.date.toLocaleDateString('pt-BR')}`) : `plantio em ${p.date.toLocaleDateString('pt-BR')}`}</p>
            <label className="mt-3 flex items-center gap-3">Transparência
              <input type="range" min={0.1} max={1} step={0.05} value={p.opacity} onChange={(e) => p.onOpacity(Number(e.target.value))} className="flex-1 accent-emerald-400" />
            </label>
            {layer.gibs && <button onClick={p.onLatest} className={clsx('mt-2 min-h-11 rounded-full px-4 text-xs font-semibold ring-1', p.latest ? 'bg-emerald-400 text-ink ring-emerald-300' : 'ring-white/20')}>usar imagem mais recente</button>}
          </details>
        </Drawer>
      )}

      {sheet === 'field' && field && (
        <Drawer title="O que os dados dizem aqui" onClose={() => setSheet(null)}>
          <FieldCard embedded id={field.id} date={p.date} onClose={() => setSheet(null)} />
        </Drawer>
      )}
    </div>
  )
}
