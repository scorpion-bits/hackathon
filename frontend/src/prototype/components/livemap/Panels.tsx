// Painéis flutuantes do "Mapa vivo" (estilo Windy, escuro). Protótipo visual (D-009).
import clsx from 'clsx'
import {
  CalendarClock, ChevronDown, CloudRain, Earth, Info, LocateFixed, Map as MapIcon, Maximize, Minimize, Minus, Pause, Play, Plus, Satellite, Sparkles, X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FIELDS, FORECAST, INSIGHTS, PRODUCER } from '../../mock'
import { OriginTag, SourceChip } from '../Shell'
import {
  DATA_LAYERS, DAY_OFFSETS, RISK_COLOR, addDays, forecastAt, riskFor, shortDate, weekday, type DataLayer,
} from './layers'

export const PANEL = 'rounded-2xl border border-white/10 bg-sidebar/80 text-white shadow-2xl shadow-black/40 backdrop-blur-md'

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/85 ring-1 ring-white/10', className)}>{children}</span>
}

/** Selo de fonte para fundo escuro. */
export function DarkSource({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-md bg-sky-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-sky-200 ring-1 ring-sky-300/25"><Satellite size={11} />{children}</span>
}

function thumbBg(l: DataLayer) {
  if (l.id === 'cor') return 'linear-gradient(135deg,#1e3a5f,#3f7d4f 45%,#c8b98a 70%,#f5f5f5)'
  const c = l.legend.colors
  return `linear-gradient(135deg, ${c.join(', ')})`
}

// ---------------------------------------------------------------- cabeçalho
export function Header({ onHome, onBrazil, onField, selected }: {
  onHome: () => void; onBrazil: () => void; onField: (id: number) => void; selected: number | null
}) {
  return (
    <div className={clsx(PANEL, 'absolute left-3 top-3 z-20 max-w-[calc(100%-4.75rem)] p-3 lg:left-4 lg:top-4 lg:w-[23rem] lg:p-4')}>
      <h1 className="text-[15px] font-bold leading-snug lg:text-lg">
        <span className="text-emerald-300">Mapa vivo</span> · dados abertos sobre a sua propriedade
      </h1>
      <div className="mt-1.5"><Chip className="bg-emerald-400/15 text-emerald-200 ring-emerald-300/30"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />camadas oficiais: NASA, INPE, MAPA</Chip></div>

      {/* Minhas propriedades: um clique leva a câmera até lá */}
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/50">Minhas propriedades</div>
      <button onClick={onHome} className="mt-1 flex w-full items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-left ring-1 ring-white/10 hover:bg-white/15">
        <LocateFixed size={16} className="shrink-0 text-emerald-300" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{PRODUCER.farm}</span>
          <span className="text-[11px] text-white/60">{PRODUCER.municipality}/{PRODUCER.uf} · {PRODUCER.area_ha.toLocaleString('pt-BR')} ha · {FIELDS.length} talhões</span>
        </span>
      </button>
      <div className="mt-1.5 flex flex-wrap gap-1.5 max-sm:hidden">
        {FIELDS.map((f) => (
          <button key={f.id} onClick={() => onField(f.id)}
            className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition',
              selected === f.id ? 'bg-white text-ink ring-white' : 'bg-white/5 text-white/85 ring-white/15 hover:bg-white/15')}>
            <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />{f.name} · {f.crop}
          </button>
        ))}
      </div>
      <button onClick={onBrazil} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white">
        <Earth size={14} /> Ver o Brasil
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- controles
function CtrlBtn({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: ReactNode }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className={clsx('grid h-9 min-w-9 place-items-center rounded-lg px-2 text-xs font-semibold transition', active ? 'bg-white text-ink' : 'text-white/85 hover:bg-white/15')}>
      {children}
    </button>
  )
}

export function Controls(p: {
  onZoomIn: () => void; onZoomOut: () => void; proj: 'globe' | 'mercator'; onProj: () => void
  base: 'sat' | 'map'; onBase: () => void; fs: boolean; onFs: () => void
}) {
  return (
    <div className={clsx(PANEL, 'absolute right-3 top-3 z-20 flex flex-col gap-1 p-1 lg:right-4 lg:top-4 lg:flex-row lg:items-center')}>
      <CtrlBtn onClick={p.onZoomIn} title="Aproximar"><Plus size={16} /></CtrlBtn>
      <CtrlBtn onClick={p.onZoomOut} title="Afastar"><Minus size={16} /></CtrlBtn>
      <span className="mx-1 hidden h-5 w-px bg-white/15 lg:block" />
      <CtrlBtn onClick={p.onProj} title={p.proj === 'globe' ? 'Ver mapa plano' : 'Ver globo 3D'} active={p.proj === 'globe'}>
        <span className="flex items-center gap-1"><Earth size={15} /><span className="hidden lg:inline">{p.proj === 'globe' ? 'Globo' : 'Plano'}</span></span>
      </CtrlBtn>
      <CtrlBtn onClick={p.onBase} title={p.base === 'sat' ? 'Trocar para mapa de ruas' : 'Trocar para satélite'}>
        <span className="flex items-center gap-1">{p.base === 'sat' ? <Satellite size={15} /> : <MapIcon size={15} />}<span className="hidden lg:inline">{p.base === 'sat' ? 'Satélite' : 'Mapa'}</span></span>
      </CtrlBtn>
      <CtrlBtn onClick={p.onFs} title={p.fs ? 'Sair da tela cheia' : 'Tela cheia'}>{p.fs ? <Minimize size={15} /> : <Maximize size={15} />}</CtrlBtn>
    </div>
  )
}

// ---------------------------------------------------------------- camadas (direita / barra inferior no mobile)
export function LayerPanel({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <div className={clsx(
      'absolute z-10 flex gap-2',
      'inset-x-0 bottom-[4.25rem] overflow-x-auto px-3 pb-1 [scrollbar-width:none]',
      'lg:inset-x-auto lg:bottom-auto lg:right-4 lg:top-[4.75rem] lg:flex-col lg:items-end lg:overflow-visible lg:px-0',
    )}>
      <div className="hidden pr-1 text-[11px] font-semibold uppercase tracking-wider text-white/70 [text-shadow:0_1px_3px_#000] lg:block">Camadas de dados abertos</div>
      {DATA_LAYERS.map((l) => {
        const on = l.id === active
        const Icon = l.icon
        return (
          <button key={l.id} onClick={() => onPick(on ? 'none' : l.id)} title={l.source.detail}
            className="group flex shrink-0 flex-col items-center gap-1 lg:flex-row lg:gap-2">
            <span className={clsx('rounded-full px-3 py-1 text-[11px] font-medium shadow transition lg:text-sm',
              on ? 'bg-white font-semibold text-ink' : 'bg-black/55 text-white backdrop-blur group-hover:bg-black/75')}>
              {l.label}
            </span>
            <span className={clsx('order-first grid h-10 w-10 place-items-center rounded-full text-white shadow-lg ring-2 transition lg:order-last lg:h-11 lg:w-11',
              on ? 'scale-110 ring-white' : 'ring-white/25 group-hover:ring-white/60')}
              style={{ background: thumbBg(l) }}>
              <Icon size={18} className="drop-shadow-[0_1px_2px_rgba(0,0,0,.8)]" />
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- legenda + significado
export function LegendCard(p: {
  layer: DataLayer; date: Date; time: string | null; offset: number; opacity: number; onOpacity: (v: number) => void
  latest: boolean; onLatest: () => void; hidden: boolean
}) {
  const { layer, date } = p
  const Icon = layer.icon
  const futureSat = !!layer.gibs && p.offset > 0
  const f = forecastAt(p.offset)
  const [open, setOpen] = useState(false) // só afeta telas < lg (no desktop tudo fica visível)
  const more = open ? '' : 'max-lg:hidden'
  return (
    <div className={clsx(PANEL, 'absolute inset-x-3 bottom-[9.25rem] z-10 max-h-[50%] overflow-y-auto p-3 lg:inset-x-auto lg:bottom-[5.75rem] lg:left-4 lg:max-h-[calc(100%-25.5rem)] lg:w-[23rem] lg:p-4',
      p.hidden && 'hidden')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full ring-1 ring-white/30" style={{ background: thumbBg(layer) }}><Icon size={16} /></span>
          <div>
            <div className="text-sm font-bold leading-tight">{layer.label}</div>
            <div className="text-[11px] text-white/60">{layer.gibs ? `satélite · ${layer.gibs.cadence}` : 'zoneamento oficial · por decêndio'}</div>
          </div>
        </div>
        <OriginTag origin={layer.origin} />
      </div>

      {layer.legend.colors.length > 0 && (
        <div className="mt-3">
          {layer.legend.discrete ? (
            <div className="flex gap-1">
              {layer.legend.colors.map((c, i) => (
                <div key={c} className="flex-1">
                  <div className="h-2.5 rounded-full ring-1 ring-white/20" style={{ background: c }} />
                  <div className="mt-1 text-center text-[10px] font-semibold tabular-nums text-white/85">{layer.legend.labels[i]}</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="h-2.5 rounded-full ring-1 ring-white/20" style={{ background: `linear-gradient(90deg, ${layer.legend.colors.join(', ')})` }} />
              <div className="mt-1 flex justify-between text-[10px] font-medium tabular-nums text-white/80">
                {layer.legend.labels.map((t, i) => <span key={i}>{t}</span>)}
              </div>
            </>
          )}
          {layer.legend.unit && <div className="text-[10px] text-white/55">{layer.legend.unit}{layer.gibs && ' · cores aproximadas'}</div>}
        </div>
      )}
      {layer.legend.note && <p className={clsx('mt-1.5 text-[11px] text-white/60', more)}>{layer.legend.note}</p>}
      <button onClick={() => setOpen((v) => !v)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-white/10 py-1 text-[12px] font-semibold text-emerald-200 lg:hidden">
        {open ? 'Mostrar menos' : 'O que isso significa para mim?'} <ChevronDown size={14} className={clsx('transition', open && 'rotate-180')} />
      </button>

      {futureSat && (
        <div className="mt-2.5 flex gap-2 rounded-lg bg-amber-400/15 p-2 text-[11px] text-amber-100 ring-1 ring-amber-300/30">
          <CloudRain size={14} className="mt-0.5 shrink-0" />
          <span>Satélite só enxerga o passado — mostrando a imagem mais recente. Para {weekday(date)} {shortDate(date)}{f ? ` a previsão é de ${f.rain} mm de chuva e máxima de ${f.t} °C` : ' ainda não há previsão'} (veja sobre a sua propriedade).</span>
        </div>
      )}

      <div className={clsx('mt-3 rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10', more)}>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300"><Sparkles size={13} /> O que esta camada significa para você</div>
        <p className="mt-1 text-[13px] leading-snug text-white/95">{layer.meaning(date)}</p>
      </div>

      <div className={clsx('mt-3 flex flex-wrap items-center gap-1.5', more)}>
        <DarkSource>{layer.source.chip}</DarkSource>
        {layer.id === 'chuva' && <DarkSource>Previsão · Open-Meteo</DarkSource>}
        <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
          <CalendarClock size={12} />
          {layer.gibs ? (p.time === 'default' ? 'imagem mais recente disponível' : `imagem de ${date.toLocaleDateString('pt-BR')}`) : `plantio em ${date.toLocaleDateString('pt-BR')} · safra 2026/27`}
        </span>
      </div>

      <div className={clsx('mt-3 flex items-center gap-3', more)}>
        <label className="flex flex-1 items-center gap-2 text-[11px] text-white/70">
          Opacidade
          <input type="range" min={0.1} max={1} step={0.05} value={p.opacity} onChange={(e) => p.onOpacity(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-amber-400" aria-label="Opacidade da camada" />
          <span className="w-8 text-right tabular-nums">{Math.round(p.opacity * 100)}%</span>
        </label>
        {layer.gibs && (
          <button onClick={p.onLatest} title="Usar TIME=default (imagem mais recente do GIBS)"
            className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 transition', p.latest ? 'bg-amber-400 text-ink ring-amber-300' : 'text-white/70 ring-white/20 hover:bg-white/10')}>
            mais recente
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- linha do tempo
export function Timeline(p: { today: Date; offset: number; onOffset: (o: number) => void; playing: boolean; onPlay: () => void; attribution: string }) {
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { // mantém o dia escolhido visível quando a barra rola (mobile)
    const c = scroller.current
    const b = c?.querySelector<HTMLElement>('[data-sel="1"]')
    if (c && b && c.scrollWidth > c.clientWidth) c.scrollTo({ left: b.offsetLeft - c.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' })
  }, [p.offset])
  return (
    <div className={clsx(PANEL, 'absolute inset-x-0 bottom-0 z-20 rounded-none border-x-0 border-b-0 px-2 pb-1 pt-1.5 lg:inset-x-4 lg:bottom-4 lg:rounded-2xl lg:border lg:px-3 lg:pt-2')}>
      <div className="flex items-center gap-2">
        <button onClick={p.onPlay} aria-label={p.playing ? 'Pausar' : 'Reproduzir'}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-400 text-ink shadow-lg hover:bg-amber-300">
          {p.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        <div ref={scroller} className="relative flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
          {DAY_OFFSETS.map((o) => {
            const d = addDays(p.today, o)
            const f = forecastAt(o)
            const sel = o === p.offset
            return (
              <button key={o} onClick={() => p.onOffset(o)} data-sel={sel ? '1' : undefined}
                className={clsx('relative flex min-w-[3.25rem] flex-1 flex-col items-center rounded-lg px-1 py-1 transition',
                  sel ? 'bg-amber-400 text-ink' : o === 0 ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/10',
                  o === 1 && 'ml-1 border-l border-dashed border-white/25 pl-2')}>
                <span className="text-[11px] font-semibold leading-tight">{o === 0 ? 'hoje' : weekday(d)}</span>
                <span className="text-[10px] tabular-nums leading-tight opacity-80">{shortDate(d)}</span>
                <span className={clsx('mt-0.5 flex items-center gap-0.5 text-[9px] leading-none', sel ? 'text-ink/80' : o > 0 ? 'text-sky-300' : 'text-white/45')}>
                  {o > 0
                    ? (f ? <><CloudRain size={9} />{f.rain} mm</> : '—')
                    : <><Satellite size={9} />{o === 0 ? 'parcial' : 'imagem'}</>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[10px] text-white/50">
        <span className="truncate">◀ passado: imagens de satélite (NASA GIBS) · futuro: previsão sobre a sua propriedade ▶</span>
        <span className="hidden shrink-0 truncate sm:inline">{p.attribution}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- cartão do talhão
const NDVI: Record<number, [number, string]> = { 1: [0.32, 'palhada, aguardando plantio'], 2: [0.21, 'solo preparado e exposto'], 3: [0.74, 'feijão vigoroso'] }
const SOIL: Record<number, string> = { 1: 'na média da região', 2: 'abaixo da média (mais seco)', 3: 'boa — irrigado' }

function Row({ label, value, children, tag }: { label: string; value: ReactNode; children?: ReactNode; tag: 'real' | 'ilustrativo' }) {
  return (
    <div className="rounded-lg bg-white/[0.06] px-2.5 py-2 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] uppercase tracking-wide text-white/60">{label}</span>
        <span className="shrink-0 whitespace-nowrap"><OriginTag origin={tag} /></span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-sm font-semibold">{value}</span>
        {children}
      </div>
    </div>
  )
}

export function FieldCard({ id, date, onClose }: { id: number; date: Date; onClose: () => void }) {
  const f = FIELDS.find((x) => x.id === id)
  if (!f) return null
  const risk = riskFor(f, date)
  const rain7 = FORECAST.reduce((s, x) => s + x.rain, 0)
  const peak = FORECAST.reduce((a, b) => (b.rain > a.rain ? b : a))
  const [ndvi, ndviTxt] = NDVI[f.id] ?? [0.4, '']
  const insight = INSIGHTS.find((i) => i.field === f.name)
  return (
    <div className={clsx(PANEL, 'absolute inset-x-3 bottom-[9.25rem] z-30 max-h-[55%] overflow-y-auto p-3',
      'lg:inset-x-auto lg:bottom-[5.75rem] lg:left-4 lg:max-h-[calc(100%-25.5rem)] lg:w-[23rem] lg:p-4')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 shrink-0 rounded-lg ring-2 ring-white" style={{ background: f.color }} />
          <div>
            <div className="text-base font-bold leading-tight">{f.name} · {f.crop}</div>
            <div className="text-[12px] text-white/65">{f.area.toLocaleString('pt-BR')} ha · solo {f.soil.toLowerCase()} · {f.status}</div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Fechar"><X size={16} /></button>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300"><Info size={13} /> O que os dados dizem aqui</div>
      <div className="mt-2 space-y-1.5">
        <Row label={`Risco Zarc · plantio em ${shortDate(date)}`} tag="real"
          value={<span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLOR(risk) }} />{risk ? `${risk}% de chance de perda` : 'fora da janela indicada'}</span>}>
          <SourceChip k="zarc" />
        </Row>
        <Row label="Chuva prevista · 7 dias" tag="ilustrativo" value={`${rain7} mm · pico de ${peak.rain} mm na ${peak.d}`}>
          <SourceChip k="clima" />
        </Row>
        <Row label="Satélite · vegetação e umidade" tag="ilustrativo"
          value={<span className="block text-[13px] leading-snug">NDVI {ndvi.toLocaleString('pt-BR')} — {ndviTxt}<br />Umidade do solo {SOIL[f.id] ?? '—'}</span>}>
          <SourceChip k="satelite" />
        </Row>
      </div>
      {insight && (
        <div className={clsx('mt-3 rounded-lg p-2.5 text-[13px] font-medium ring-1',
          insight.priority === 'agir' ? 'bg-red-500/15 text-red-100 ring-red-300/30' : insight.priority === 'atencao' ? 'bg-amber-400/15 text-amber-100 ring-amber-300/30' : 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30')}>
          <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">Recomendação para este talhão</div>
          {insight.title}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- conteúdo dos marcadores no mapa
export function FieldLabel({ id, show, zarc, date }: { id: number; show: boolean; zarc: boolean; date: Date }) {
  const f = FIELDS.find((x) => x.id === id)
  if (!f) return null
  const risk = riskFor(f, date)
  return (
    <div className={clsx('pointer-events-none select-none whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-center text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm transition-opacity duration-500',
      show ? 'opacity-100' : 'opacity-0')}>
      <div className="text-[12px] font-bold leading-tight">{f.name}</div>
      <div className="text-[10px] leading-tight text-white/80">{f.crop} · {f.area.toLocaleString('pt-BR')} ha</div>
      {zarc && (
        <div className="mt-0.5 rounded px-1 text-[10px] font-bold" style={{ background: RISK_COLOR(risk) }}>
          {risk ? `risco ${risk}%` : 'fora da janela'}
        </div>
      )}
    </div>
  )
}

export function FarmPin({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={clsx('flex flex-col items-center transition-opacity duration-500', show ? 'opacity-100' : 'pointer-events-none opacity-0')}>
      <span className="mb-1 whitespace-nowrap rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/25 backdrop-blur">
        {PRODUCER.farm} · {PRODUCER.municipality}/{PRODUCER.uf}
      </span>
      <span className="relative grid h-4 w-4 place-items-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
        <span className="relative h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white" />
      </span>
    </button>
  )
}

export function ForecastBars({ show, offset }: { show: boolean; offset: number }) {
  const max = Math.max(...FORECAST.map((f) => f.rain), 1)
  return (
    <div className={clsx('pointer-events-none w-64 transition-opacity duration-500', show ? 'opacity-100' : 'opacity-0')}>
      <div className="rounded-xl bg-sidebar/90 p-2.5 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-sky-200"><CloudRain size={12} /> Chuva prevista aqui</span>
          <OriginTag origin="ilustrativo" />
        </div>
        <div className="mt-2 flex h-[5.5rem] items-end gap-1.5">
          {FORECAST.map((f, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5">
              <span className={clsx('text-[9px] font-semibold tabular-nums', f.rain >= 50 ? 'text-amber-300' : 'text-white/80')}>{f.rain || ''}</span>
              <div className={clsx('w-full rounded-t-sm', i === offset ? 'bg-amber-400' : f.rain >= 50 ? 'bg-sky-400' : 'bg-sky-300/70')}
                style={{ height: `${Math.max(3, (f.rain / max) * 44)}px` }} />
              <span className={clsx('text-[9px]', i === offset ? 'font-bold text-amber-300' : 'text-white/70')}>{f.d}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 text-[10px] text-white/55">mm/dia · Previsão Open-Meteo (exemplo)</div>
      </div>
      <div className="mx-auto h-3 w-3 -translate-y-1.5 rotate-45 bg-sidebar/90" />
    </div>
  )
}
