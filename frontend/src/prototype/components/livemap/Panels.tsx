// Painéis flutuantes do "Mapa vivo" (estilo Windy, escuro). Protótipo visual (D-009).
import clsx from 'clsx'
import {
  CloudRain, Earth, Info, Map as MapIcon, Pencil, Maximize, Minimize, Minus, Pause, Play, Plus, Satellite, X,
} from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fmtWhen } from '../../api/opendata'
import { useTopics } from '../../api/topics'
import { FIELDS, PRODUCER } from '../../mock'
import { OriginTag, SourceChip } from '../Shell'
import {
  DAY_OFFSETS, RISK_COLOR, addDays, forecastAt, riskFor, riskPill, shortDate, useForecast, weekday,
} from './layers'

export const PANEL = 'rounded-2xl border border-white/10 bg-sidebar/80 text-white shadow-2xl shadow-black/40 backdrop-blur-md'

/** Selo de fonte para fundo escuro. */
export function DarkSource({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-md bg-sky-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-sky-200 ring-1 ring-sky-300/25"><Satellite size={11} />{children}</span>
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
    <div className={clsx(PANEL, 'absolute z-20 max-lg:hidden lg:right-4 lg:top-4 lg:flex lg:flex-row lg:items-center lg:gap-1 lg:p-1')}>
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

// ---------------------------------------------------------------- linha do tempo
export function Timeline(p: { today: Date; offset: number; onOffset: (o: number) => void; playing: boolean; onPlay: () => void; attribution: string; embedded?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { // mantém o dia escolhido visível quando a barra rola (mobile)
    const c = scroller.current
    const b = c?.querySelector<HTMLElement>('[data-sel="1"]')
    if (c && b && c.scrollWidth > c.clientWidth) c.scrollTo({ left: b.offsetLeft - c.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' })
  }, [p.offset])
  const fcast = useForecast()
  return (
    <div className={p.embedded ? 'rounded-xl bg-white/5 p-2' : clsx(PANEL, 'absolute z-20 max-lg:hidden lg:bottom-4 lg:left-[24.5rem] lg:right-4 lg:px-3 lg:pb-1 lg:pt-2')}>
      <div className="flex items-center gap-2">
        <button onClick={p.onPlay} aria-label={p.playing ? 'Pausar' : 'Reproduzir'}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-400 text-ink shadow-lg hover:bg-amber-300">
          {p.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        <div ref={scroller} className="relative flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
          {DAY_OFFSETS.map((o) => {
            const d = addDays(p.today, o)
            const f = forecastAt(fcast.days, o)
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

export function FieldCard({ id, date, onClose, embedded }: { id: number; date: Date; onClose: () => void; embedded?: boolean }) {
  const f = FIELDS.find((x) => x.id === id)
  if (!f) return null
  const risk = riskFor(f, date)
  const fcast = useForecast()
  const rain7 = fcast.days.reduce((s, x) => s + x.rain, 0)
  const peak = fcast.days.reduce((a, b) => (b.rain > a.rain ? b : a), fcast.days[0])
  const insight = useTopics().data?.topics.find((t) => t.field_id === f.id)
  return (
    <div className={embedded ? '' : clsx(PANEL, 'absolute z-30 overflow-y-auto max-lg:hidden lg:right-4 lg:top-[4.25rem] lg:max-h-[calc(100%-10.5rem)] lg:w-[22rem] lg:p-4')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 shrink-0 rounded-lg ring-2 ring-white" style={{ background: f.color }} />
          <div>
            <div className="text-base font-bold leading-tight">{f.name} · {f.crop}</div>
            <div className="text-[12px] text-white/65">{f.area.toLocaleString('pt-BR')} ha · solo {f.soil.toLowerCase()} · {f.status}</div>
          </div>
        </div>
        {!embedded && <button onClick={onClose} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Fechar"><X size={16} /></button>}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300"><Info size={13} /> O que os dados dizem aqui</div>
      <div className="mt-2 space-y-1.5">
        <Row label={`Risco Zarc · plantio em ${shortDate(date)}`} tag="real"
          value={<span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLOR(risk) }} />{risk == null ? 'sem zoneamento (Zarc) para esta cultura aqui' : risk ? `${risk}% de chance de perda` : 'fora da janela indicada'}</span>}>
          <SourceChip k="zarc" />
        </Row>
        <Row label="Chuva prevista · 7 dias" tag="real" value={fcast.days.length ? `${Math.round(rain7)} mm · pico de ${Math.round(peak.rain)} mm (${peak.d})` : 'previsão indisponível agora'}>
          <SourceChip k="clima" />
        </Row>
      </div>
      {insight && (
        <Link to={`/prototipo/resolver/${encodeURIComponent(insight.key)}`} className={clsx('mt-3 block rounded-lg p-2.5 text-[13px] font-medium ring-1',
          insight.priority === 'agir' ? 'bg-red-500/15 text-red-100 ring-red-300/30' : insight.priority === 'atencao' ? 'bg-amber-400/15 text-amber-100 ring-amber-300/30' : 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30')}>
          <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">Recomendação para este talhão</div>
          {insight.title}
        </Link>
      )}
      <Link to={`/prototipo/talhoes?talhao=${f.id}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2 text-[13px] font-semibold text-white hover:bg-white/20">
        <Pencil size={14} /> Editar este talhão (formato, cultura, solo)
      </Link>
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
          {riskPill(risk)}
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
  const { days, status, fetchedAt } = useForecast()
  const max = Math.max(...days.map((f) => f.rain), 1)
  return (
    <div className={clsx('pointer-events-none w-64 transition-opacity duration-500 max-lg:hidden', show ? 'opacity-100' : 'opacity-0')}>
      <div className="rounded-xl bg-sidebar/90 p-2.5 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-sky-200"><CloudRain size={12} /> Chuva prevista aqui</span>
          <OriginTag origin="real" />
        </div>
        {days.length === 0 && <div className="mt-2 text-[11px] text-white/70">Previsão indisponível agora.</div>}
        <div className="mt-2 flex h-[5.5rem] items-end gap-1.5">
          {days.map((f, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5">
              <span className={clsx('text-[9px] font-semibold tabular-nums', f.rain >= 50 ? 'text-amber-300' : 'text-white/80')}>{Math.round(f.rain) || ''}</span>
              <div className={clsx('w-full rounded-t-sm', i === offset ? 'bg-amber-400' : f.rain >= 50 ? 'bg-sky-400' : 'bg-sky-300/70')}
                style={{ height: `${Math.max(3, (f.rain / max) * 44)}px` }} />
              <span className={clsx('text-[9px]', i === offset ? 'font-bold text-amber-300' : 'text-white/70')}>{f.d}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 text-[10px] text-white/55">mm/dia · Previsão Open-Meteo{status === 'stale' ? ` · dado real de ${fmtWhen(fetchedAt)} (fonte fora do ar)` : ''}</div>
      </div>
      <div className="mx-auto h-3 w-3 -translate-y-1.5 rotate-45 bg-sidebar/90" />
    </div>
  )
}
