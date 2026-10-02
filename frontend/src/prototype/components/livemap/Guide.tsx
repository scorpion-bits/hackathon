// Painel-guia do "Mapa vivo": um caminho só, em 3 passos — ① onde olhar ② o que saber ③ o que significa.
// Desktop: coluna à esquerda. Celular: folha na parte de baixo, com os passos em faixas roláveis.
import clsx from 'clsx'
import { CalendarClock, ChevronDown, CloudRain, Earth, Home, Pencil, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { FIELDS, PRODUCER } from '../../mock'
import { OriginTag } from '../Shell'
import { DATA_LAYERS, RISK_COLOR, forecastAt, riskFor, shortDate, weekday, type DataLayer } from './layers'
import { DarkSource, PANEL } from './Panels'

/** Ordem das perguntas: das mais úteis no dia a dia para as mais técnicas. */
const ORDER = ['chuva', 'zarc', 'ndvi', 'umidade', 'temp', 'fogo', 'cor']
const LAYERS = ORDER.map((id) => DATA_LAYERS.find((l) => l.id === id)!).filter(Boolean)

export type Place = 'farm' | 'brazil' | number

function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[13px] font-bold text-white">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400 text-[11px] font-extrabold text-ink">{n}</span>
      {children}
    </h2>
  )
}

function Legend({ layer }: { layer: DataLayer }) {
  const { colors, labels, discrete, unit } = layer.legend
  if (!colors.length) return null
  return (
    <div>
      {discrete ? (
        <div className="flex gap-1">
          {colors.map((c, i) => (
            <div key={c} className="flex-1">
              <div className="h-2.5 rounded-full" style={{ background: c }} />
              <div className="mt-1 text-center text-[10px] font-semibold text-white/85">{labels[i]}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${colors.join(', ')})` }} />
          <div className="mt-1 flex justify-between text-[10px] font-medium text-white/80">{labels.map((t, i) => <span key={i}>{t}</span>)}</div>
        </>
      )}
      {unit && <div className="text-[10px] text-white/55">{unit}</div>}
    </div>
  )
}

export function Guide(p: {
  place: Place; onPlace: (pl: Place) => void
  layerId: string; onLayer: (id: string) => void
  date: Date; offset: number; time: string | null
  opacity: number; onOpacity: (v: number) => void; latest: boolean; onLatest: () => void
}) {
  const layer = DATA_LAYERS.find((l) => l.id === p.layerId) ?? null
  const [mobileOpen, setMobileOpen] = useState(false) // celular: passo ③ recolhido por padrão
  const f = forecastAt(p.offset)
  const futureSat = !!layer?.gibs && p.offset > 0

  return (
    <aside aria-label="Guia do mapa" className={clsx(PANEL,
      'absolute inset-x-2 bottom-[4.5rem] z-20 max-h-[52%] overflow-y-auto p-3',
      'lg:inset-x-auto lg:bottom-[5.5rem] lg:left-4 lg:top-4 lg:max-h-none lg:w-[22rem] lg:p-4')}>
      <div className="mb-3 hidden lg:block">
        <h1 className="text-lg font-bold leading-tight"><span className="text-emerald-300">Mapa vivo</span> da sua roça</h1>
        <p className="text-xs text-white/60">Dados oficiais de satélite e do governo sobre a sua propriedade.</p>
      </div>

      {/* ① Onde olhar */}
      <section>
        <StepTitle n={1}>Onde você quer olhar?</StepTitle>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible">
          <button onClick={() => p.onPlace('farm')} aria-pressed={p.place === 'farm'}
            className={clsx('flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 transition',
              p.place === 'farm' ? 'bg-emerald-400/20 ring-emerald-300' : 'bg-white/5 ring-white/10 hover:bg-white/10')}>
            <Home size={18} className="shrink-0 text-emerald-300" />
            <span>
              <span className="block whitespace-nowrap text-sm font-semibold">{PRODUCER.farm}</span>
              <span className="hidden text-[11px] text-white/60 lg:block">{PRODUCER.municipality}/{PRODUCER.uf} · {PRODUCER.area_ha.toLocaleString('pt-BR')} ha · {FIELDS.length} talhões</span>
            </span>
          </button>
          {FIELDS.map((fl) => {
            const risk = riskFor(fl, p.date)
            const on = p.place === fl.id
            return (
              <button key={fl.id} onClick={() => p.onPlace(fl.id)} aria-pressed={on}
                className={clsx('flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left ring-1 transition lg:ml-4 lg:py-1.5',
                  on ? 'bg-white text-ink ring-white' : 'bg-white/5 ring-white/10 hover:bg-white/10')}>
                <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/70" style={{ background: fl.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block whitespace-nowrap text-sm font-semibold">{fl.name} · {fl.crop.replace(' irrigado', '')} <span className={clsx('hidden text-[11px] font-normal lg:inline', on ? 'text-ink/60' : 'text-white/60')}>{fl.area.toLocaleString('pt-BR')} ha</span></span>
                </span>
                <span className="hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white lg:inline" style={{ background: RISK_COLOR(risk) }} title="Risco climático oficial (Zarc) para plantio na data escolhida">
                  {risk ? `risco ${risk}%` : 'fora'}
                </span>
              </button>
            )
          })}
          <button onClick={() => p.onPlace('brazil')} aria-pressed={p.place === 'brazil'}
            className={clsx('flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition lg:self-start lg:px-1',
              p.place === 'brazil' ? 'text-white' : 'text-white/60 hover:text-white')}>
            <Earth size={15} /> Ver o Brasil todo
          </button>
          <Link to="/prototipo/talhoes"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/30 hover:bg-emerald-400/15 lg:-mt-1 lg:self-stretch lg:justify-center">
            <Pencil size={14} /> Adicionar ou editar talhões
          </Link>
        </div>
      </section>

      {/* ② O que saber */}
      <section className="mt-3">
        <StepTitle n={2}>O que você quer saber?</StepTitle>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-1.5 lg:overflow-visible">
          {LAYERS.map((l) => {
            const on = l.id === p.layerId
            const Icon = l.icon
            return (
              <button key={l.id} onClick={() => p.onLayer(on ? 'none' : l.id)} aria-pressed={on} title={l.label}
                className={clsx('flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold ring-1 transition lg:rounded-lg lg:px-2.5 lg:py-1.5 lg:text-[12.5px]',
                  on ? 'bg-white text-ink ring-white' : 'bg-white/5 text-white/90 ring-white/10 hover:bg-white/10')}>
                <Icon size={16} className={on ? 'text-primary' : 'text-white/70'} />
                <span className="whitespace-nowrap lg:whitespace-normal lg:leading-tight">{l.question}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ③ O que significa */}
      {layer && (
        <section className="mt-4">
          <button onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen} className="flex w-full items-center gap-2 text-left lg:pointer-events-none">
            <StepTitle n={3}>O que isso significa para você</StepTitle>
            <ChevronDown size={16} className={clsx('ml-auto text-white/60 transition lg:hidden', mobileOpen && 'rotate-180')} />
          </button>
          <div className={clsx('mt-2 space-y-3 rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10', !mobileOpen && 'max-lg:hidden')}>
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-emerald-300" />
              <p className="text-[14px] leading-snug text-white">{layer.meaning(p.date)}</p>
            </div>
            {futureSat && (
              <p className="flex gap-2 rounded-lg bg-amber-400/15 p-2 text-[12px] text-amber-100">
                <CloudRain size={14} className="mt-0.5 shrink-0" />
                Satélite só mostra o passado. Para {weekday(p.date)} {shortDate(p.date)}{f ? `, a previsão é de ${f.rain} mm de chuva` : ''}.
              </p>
            )}
            <Legend layer={layer} />
            <div className="flex flex-wrap items-center gap-1.5">
              <DarkSource>{layer.source.chip}</DarkSource>
              <OriginTag origin={layer.origin} />
              <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
                <CalendarClock size={12} />
                {layer.gibs ? (p.time === 'default' ? 'imagem mais recente' : `imagem de ${p.date.toLocaleDateString('pt-BR')}`) : `plantio em ${p.date.toLocaleDateString('pt-BR')}`}
              </span>
            </div>
            <details className="text-[11px] text-white/70">
              <summary className="flex cursor-pointer items-center gap-1 font-semibold text-white/60 hover:text-white"><SlidersHorizontal size={12} /> Ajustes da camada</summary>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex flex-1 items-center gap-2">
                  Transparência
                  <input type="range" min={0.1} max={1} step={0.05} value={p.opacity} onChange={(e) => p.onOpacity(Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer accent-emerald-400" aria-label="Transparência da camada" />
                </label>
                {layer.gibs && (
                  <button onClick={p.onLatest} className={clsx('rounded-full px-2 py-0.5 font-semibold ring-1', p.latest ? 'bg-emerald-400 text-ink ring-emerald-300' : 'ring-white/20 hover:bg-white/10')}>
                    imagem mais recente
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-white/50">{layer.source.detail}{layer.gibs ? ' · cores aproximadas' : ''}</p>
            </details>
          </div>
        </section>
      )}
      {!layer && <p className="mt-4 text-xs text-white/60">Escolha uma pergunta acima para ver os dados sobre o mapa.</p>}
    </aside>
  )
}
