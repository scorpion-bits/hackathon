// "Para você" — tela inicial do protótipo. Princípio de UX: uma decisão por vez.
// 1º nível (bater o olho): o que fazer hoje + de quais dados oficiais isso veio.
// 2º nível (um clique): por que, com fontes e números. Detalhe completo fica nas telas Dados abertos / Mapa vivo.
import clsx from 'clsx'
import { AlertTriangle, ArrowRight, ChevronDown, CloudRain, Database, Globe2, Lightbulb, Sparkles, SlidersHorizontal, Zap } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { FIELDS, FORECAST, FUNNEL, INSIGHTS, PRODUCER, type Insight } from '../mock'
import { SourceChip } from '../components/Shell'

const PRIORITY = {
  agir: { label: 'Agir agora', icon: Zap, bar: 'bg-danger', icoBg: 'bg-danger-soft text-danger' },
  atencao: { label: 'Atenção', icon: AlertTriangle, bar: 'bg-risk-30', icoBg: 'bg-accent-soft text-accent' },
  oportunidade: { label: 'Oportunidade', icon: Lightbulb, bar: 'bg-primary', icoBg: 'bg-primary-soft text-primary-dark' },
  info: { label: 'Para saber', icon: Sparkles, bar: 'bg-info', icoBg: 'bg-info-soft text-info' },
} as const

/** Para onde leva o botão de ação de cada recomendação. */
const ACTION_TO: Record<string, string> = {
  i1: '/prototipo/propriedade', i2: '/prototipo/mapa', i3: '/prototipo/propriedade',
  i4: '/prototipo/propriedade', i5: '/prototipo/dados', i6: '/prototipo/dados',
}

const SOURCE_NAME: Record<string, string> = {
  zarc: 'Zarc · MAPA', clima: 'Previsão · Open-Meteo', agrofit: 'Agrofit · MAPA', seguro: 'Seguro Rural · MAPA',
  drones: 'SIPEAGRO · MAPA', satelite: 'Satélite · NASA', pivos: 'Pivôs · ANA',
}

// Fontes oficiais que alimentam a tela (mostradas como "de onde vem").
const HERO_SOURCES = ['Zarc · MAPA', 'Agrofit · MAPA', 'Seguro Rural · MAPA', 'SIPEAGRO · MAPA', 'NASA', 'Open-Meteo']

function InsightCard({ it, lead }: { it: Insight; lead?: boolean }) {
  const [open, setOpen] = useState(false)
  const whyId = useId()
  const p = PRIORITY[it.priority]
  const main = it.sources[0]
  return (
    <article className="relative overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border">
      <span className={clsx('absolute inset-y-0 left-0 w-1.5', p.bar)} aria-hidden />
      <div className={clsx('flex gap-4 p-5 pl-6', lead && 'md:p-6 md:pl-7')}>
        <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', p.icoBg)} aria-hidden><p.icon size={22} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
            <span className="uppercase tracking-wide text-muted">{p.label}{it.field ? ` · ${it.field}` : ''}</span>
          </div>
          <h3 className={clsx('mt-1 font-bold leading-snug', lead ? 'text-xl md:text-2xl' : 'text-lg')}>{it.title}</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">{it.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {it.action && (
              <Link to={ACTION_TO[it.id] ?? '/prototipo'} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {it.action} <ArrowRight size={16} />
              </Link>
            )}
            <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={whyId}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Por quê? <ChevronDown size={16} className={clsx('transition', open && 'rotate-180')} />
            </button>
            {/* Origem sempre visível, mas discreta: o dado aberto é o que dá credibilidade à recomendação */}
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted">
              <Database size={13} className={it.origin === 'real' ? 'text-primary' : 'text-muted'} />
              {main ? SOURCE_NAME[main] : 'Seus registros'}
              {it.origin === 'real' ? <b className="font-semibold text-primary-dark">· dado oficial</b> : <span>· exemplo</span>}
            </span>
          </div>

          {open && (
            <div id={whyId} className="mt-4 rounded-xl bg-bg p-4">
              <ul className="space-y-2 text-sm leading-relaxed">
                {it.why.map((w, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{w}</li>)}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {it.sources.map((s) => <SourceChip key={s} k={s} />)}
                <SourceChip k="voce" />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/** Mini mapa estático (SVG) dos talhões, colorido pelo risco Zarc de hoje. */
function MiniFarm() {
  const pts = FIELDS.flatMap((f) => f.poly)
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1])
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const sx = (x: number) => 14 + ((x - minX) / (maxX - minX)) * 272
  const sy = (y: number) => 14 + ((maxY - y) / (maxY - minY)) * 142
  return (
    <svg viewBox="0 0 300 170" className="h-full w-full" role="img" aria-label="Talhões coloridos pelo risco climático de hoje">
      <rect width="300" height="170" fill="#1d3527" />
      {FIELDS.map((f) => {
        const d = f.poly.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0])},${sy(p[1])}`).join(' ') + 'Z'
        const cx = f.poly.reduce((a, p) => a + sx(p[0]), 0) / f.poly.length
        const cy = f.poly.reduce((a, p) => a + sy(p[1]), 0) / f.poly.length
        return (
          <g key={f.id}>
            <path d={d} fill={f.risk >= 40 ? '#C0392B' : f.risk >= 30 ? '#D69E2E' : '#2E7D4F'} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize="12" fontWeight={700} fill="#fff">{f.crop.split(' ')[0]}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#ffffffdd">risco {f.risk}%</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ForYou() {
  const [showAll, setShowAll] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const list = showAll ? INSIGHTS : INSIGHTS.slice(0, 3)
  const maxRain = Math.max(...FORECAST.map((f) => f.rain), 1)
  const total = FUNNEL[0].value

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Saudação + de onde vem (o funil virou uma frase; detalhe sob demanda) */}
      <section className="rounded-3xl bg-sidebar px-6 py-6 text-white shadow-sm md:px-8">
        <p className="text-sm text-white/60">Sexta, 2 de outubro · {PRODUCER.farm}</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight md:text-[2rem]">
          Bom dia, {PRODUCER.name}. <span className="text-[#7fd6a0]">{INSIGHTS.length} avisos</span> para a sua roça hoje.
        </h1>
        <p className="mt-2 max-w-3xl text-[15px] text-white/75">
          Lemos <b className="text-white">{total} registros oficiais</b> do governo e de satélites e separamos só o que vale para você.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {HERO_SOURCES.map((s) => <span key={s} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">{s}</span>)}
          <button onClick={() => setHowOpen(!howOpen)} aria-expanded={howOpen}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-[#7fd6a0] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fd6a0]">
            Como chegamos aqui? <ChevronDown size={14} className={clsx('transition', howOpen && 'rotate-180')} />
          </button>
        </div>
        {howOpen && (
          <ol className="mt-4 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            {FUNNEL.map((f, i) => (
              <li key={f.label} className="bg-sidebar p-4">
                <div className={clsx('text-2xl font-bold', i === FUNNEL.length - 1 && 'text-[#7fd6a0]')}>{f.value}</div>
                <div className="text-sm text-white/85">{f.label}</div>
                <div className="mt-1 text-xs text-white/50">{f.hint}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 2. O que fazer — 3 principais; o resto sob demanda */}
        <section className="space-y-4 lg:col-span-2" aria-labelledby="todo">
          <h2 id="todo" className="text-lg font-bold">O que fazer agora</h2>
          {list.map((it, i) => <InsightCard key={it.id} it={it} lead={i === 0} />)}
          <button onClick={() => setShowAll(!showAll)}
            className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-muted hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {showAll ? 'Mostrar só os principais' : `Ver mais ${INSIGHTS.length - 3} avisos`}
          </button>
          <Link to="/prototipo/contexto" className="flex items-center gap-2 rounded-xl px-1 text-sm text-muted hover:text-ink">
            <SlidersHorizontal size={15} className="text-primary" />
            Avisos escolhidos a partir do seu contexto: 3 talhões · soja, milho, feijão · preocupação: seca.
            <span className="font-semibold text-primary">Ajustar</span>
          </Link>
        </section>

        {/* 3. Lateral: só o que se lê num relance */}
        <aside className="space-y-6">
          <Link to="/prototipo/mapa" className="group block overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="h-44"><MiniFarm /></div>
            <div className="flex items-center justify-between px-4 py-3">
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold"><Globe2 size={16} className="text-primary" /> Abrir mapa vivo</span>
                <span className="text-xs text-muted">Risco climático de hoje · Zarc/MAPA</span>
              </span>
              <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1" />
            </div>
          </Link>

          <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-border" aria-labelledby="rain">
            <h3 id="rain" className="flex items-center gap-2 text-sm font-semibold"><CloudRain size={16} className="text-info" /> Chuva nos próximos 7 dias</h3>
            <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={`Previsão de chuva: ${FORECAST.map((f) => `${f.d} ${f.rain} mm`).join(', ')}`}>
              {FORECAST.map((f) => (
                <div key={f.d} className="flex flex-1 flex-col items-center gap-1">
                  <span className={clsx('text-xs font-semibold', f.rain >= 50 ? 'text-danger' : 'text-info')}>{f.rain}</span>
                  <div className={clsx('w-full rounded-t', f.rain >= 50 ? 'bg-danger' : 'bg-info/70')} style={{ height: `${Math.max(4, (f.rain / maxRain) * 72)}px` }} />
                  <span className="text-xs uppercase text-muted">{f.d}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">mm por dia · Open-Meteo · exemplo</p>
            {/* Dado real consultado na NASA POWER em 02/10 (services/live.py) */}
            <div className="mt-4 rounded-xl bg-info-soft p-3 text-sm">
              <b>Últimos 30 dias: 93 mm</b> — quase o dobro do normal (48 mm).
              <div className="mt-0.5 text-xs text-info">NASA POWER · dado oficial · 31/08 a 29/09</div>
            </div>
          </section>

          <Link to="/prototipo/dados" className="flex items-center gap-3 rounded-2xl bg-primary-soft/60 p-4 text-sm ring-1 ring-primary/20 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Database size={20} className="shrink-0 text-primary" />
            <span className="flex-1"><b>7 fontes oficiais</b> conferidas hoje às 06:00<br /><span className="text-xs text-muted">Ver todos os dados abertos</span></span>
            <ArrowRight size={16} className="text-primary" />
          </Link>
        </aside>
      </div>
    </div>
  )
}
