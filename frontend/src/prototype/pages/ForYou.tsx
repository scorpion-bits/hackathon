// "Para você" — tela inicial do protótipo: dados abertos filtrados pelo contexto do produtor viram recomendações.
import clsx from 'clsx'
import { AlertTriangle, ArrowRight, ChevronDown, CloudRain, FileText, Filter, Globe2, Lightbulb, Radar, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FIELDS, FORECAST, FUNNEL, INSIGHTS, PRODUCER, SOURCES, type Insight } from '../mock'
import { OriginTag, SourceChip } from '../components/Shell'

const PRIORITY = {
  agir: { label: 'Agir agora', icon: Zap, ring: 'border-l-danger', chip: 'bg-danger-soft text-danger' },
  atencao: { label: 'Atenção', icon: AlertTriangle, ring: 'border-l-risk-30', chip: 'bg-accent-soft text-accent' },
  oportunidade: { label: 'Oportunidade', icon: Lightbulb, ring: 'border-l-primary', chip: 'bg-primary-soft text-primary-dark' },
  info: { label: 'Para saber', icon: Sparkles, ring: 'border-l-info', chip: 'bg-info-soft text-info' },
} as const

function InsightCard({ it }: { it: Insight }) {
  const [open, setOpen] = useState(it.priority === 'agir')
  const p = PRIORITY[it.priority]
  return (
    <article className={clsx('rounded-xl border border-l-4 border-border bg-surface p-4 shadow-sm', p.ring)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', p.chip)}><p.icon size={12} />{p.label}</span>
        {it.field && <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-border">{it.field}</span>}
        <span className="ml-auto"><OriginTag origin={it.origin} /></span>
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug">{it.title}</h3>
      <p className="mt-1 text-sm text-muted">{it.summary}</p>
      <button onClick={() => setOpen(!open)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        Por que estou dizendo isso? <ChevronDown size={14} className={clsx('transition', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 rounded-lg bg-bg p-3 text-sm">
          {it.why.map((w, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{w}</li>)}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {it.sources.map((s) => <SourceChip key={s} k={s} />)}
        <SourceChip k="voce" />
        {it.action && <button className="ml-auto inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark">{it.action}<ArrowRight size={13} /></button>}
      </div>
    </article>
  )
}

/** Mini mapa estático (SVG) dos talhões. */
function MiniFarm() {
  const pts = FIELDS.flatMap((f) => f.poly)
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1])
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const sx = (x: number) => 10 + ((x - minX) / (maxX - minX)) * 280
  const sy = (y: number) => 10 + ((maxY - y) / (maxY - minY)) * 150
  return (
    <svg viewBox="0 0 300 170" className="h-full w-full">
      <defs><pattern id="g" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#ffffff10" /></pattern></defs>
      <rect width="300" height="170" fill="#1d3527" /><rect width="300" height="170" fill="url(#g)" />
      {FIELDS.map((f) => {
        const d = f.poly.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0])},${sy(p[1])}`).join(' ') + 'Z'
        const cx = f.poly.reduce((a, p) => a + sx(p[0]), 0) / f.poly.length
        const cy = f.poly.reduce((a, p) => a + sy(p[1]), 0) / f.poly.length
        return (
          <g key={f.id}>
            <path d={d} fill={f.risk >= 40 ? '#C0392B' : f.risk >= 30 ? '#D69E2E' : '#2E7D4F'} fillOpacity={0.75} stroke="#fff" strokeWidth={1.5} />
            <text x={cx} y={cy} textAnchor="middle" fontSize="10" fontWeight={700} fill="#fff">{f.name}</text>
            <text x={cx} y={cy + 11} textAnchor="middle" fontSize="8" fill="#ffffffcc">{f.crop} · {f.risk}%</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ForYou() {
  const [filter, setFilter] = useState<'todos' | Insight['priority']>('todos')
  const list = INSIGHTS.filter((i) => filter === 'todos' || i.priority === filter)
  const maxRain = Math.max(...FORECAST.map((f) => f.rain), 1)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Saudação + funil */}
      <section className="overflow-hidden rounded-2xl bg-sidebar text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 pb-3">
          <div>
            <div className="text-sm text-white/60">Sexta, 2 de outubro · {PRODUCER.farm} · {PRODUCER.municipality}/{PRODUCER.uf}</div>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Bom dia, {PRODUCER.name}. Hoje <span className="text-[#7fd6a0]">6 coisas</span> importam para você.</h1>
            <p className="mt-1 text-sm text-white/70">Filtramos dados oficiais do governo e de satélites usando o que você nos contou sobre sua propriedade.</p>
          </div>
          <Link to="/prototipo/dados" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"><Radar size={16} /> Ver fontes</Link>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
          {FUNNEL.map((f, i) => (
            <div key={f.label} className="relative bg-sidebar p-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/50"><Filter size={11} /> etapa {i + 1}</div>
              <div className={clsx('mt-1 font-bold', i === FUNNEL.length - 1 ? 'text-3xl text-[#7fd6a0]' : 'text-2xl')}>{f.value}</div>
              <div className="text-xs text-white/80">{f.label}</div>
              <div className="text-[11px] text-white/50">{f.hint}</div>
              {i < FUNNEL.length - 1 && <ArrowRight size={16} className="absolute right-2 top-1/2 hidden -translate-y-1/2 text-white/30 md:block" />}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Feed de recomendações */}
        <section className="space-y-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-lg font-bold">Recomendações para você</h2>
            {(['todos', 'agir', 'atencao', 'oportunidade', 'info'] as const).map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={clsx('rounded-full px-3 py-1 text-xs font-semibold ring-1', filter === k ? 'bg-ink text-white ring-ink' : 'bg-surface text-muted ring-border hover:text-ink')}>
                {k === 'todos' ? 'Todas' : PRIORITY[k].label}
              </button>
            ))}
          </div>
          {list.map((it) => <InsightCard key={it.id} it={it} />)}
        </section>

        {/* Coluna lateral */}
        <aside className="space-y-5">
          <Link to="/prototipo/mapa" className="group block overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="relative h-44"><MiniFarm />
              <span className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">Risco Zarc hoje por talhão</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
              <span className="flex items-center gap-2"><Globe2 size={16} className="text-primary" /> Abrir mapa vivo</span>
              <ArrowRight size={16} className="text-muted transition group-hover:translate-x-1" />
            </div>
          </Link>

          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><CloudRain size={16} className="text-info" /> Chuva nos próximos 7 dias</h3>
              <OriginTag origin="ilustrativo" />
            </div>
            <div className="mt-3 flex h-28 items-end gap-2">
              {FORECAST.map((f) => (
                <div key={f.d} className="flex flex-1 flex-col items-center gap-1">
                  <span className={clsx('text-[11px] font-semibold', f.rain >= 50 ? 'text-danger' : 'text-info')}>{f.rain}</span>
                  <div className={clsx('w-full rounded-t', f.rain >= 50 ? 'bg-danger' : 'bg-info/70')} style={{ height: `${Math.max(4, (f.rain / maxRain) * 72)}px` }} />
                  <span className="text-[11px] uppercase text-muted">{f.d}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted"><span>mm por dia na sua coordenada</span><SourceChip k="clima" /></div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Radar size={16} className="text-primary" /> Radar de fontes oficiais</h3>
            <ul className="mt-3 space-y-2.5">
              {SOURCES.map((s) => (
                <li key={s.key} className="flex items-center gap-2.5 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.name.split(' (')[0].split(' —')[0]}</span>
                    <span className="text-[11px] text-muted">{s.agency} · {s.freshness} · atualizado: {s.updated}</span>
                  </span>
                  <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-bold', s.relevantForYou ? 'bg-primary-soft text-primary-dark' : 'bg-bg text-muted')}>{s.relevantForYou}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted">Número = itens relevantes para você hoje.</p>
          </section>

          <Link to="/prototipo/contexto" className="flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary-soft/50 p-4 text-sm hover:bg-primary-soft">
            <FileText size={20} className="text-primary" />
            <span className="flex-1"><b>Seu contexto</b><br /><span className="text-xs text-muted">3 talhões · soja, milho, feijão · preocupação: seca. É isso que filtra os dados.</span></span>
            <ArrowRight size={16} className="text-primary" />
          </Link>
        </aside>
      </div>
    </div>
  )
}
