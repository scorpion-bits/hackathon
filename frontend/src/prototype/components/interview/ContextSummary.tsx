// Resumo AMIGÁVEL do contexto do produtor (cartões com ícones), no lugar do contexto.md cru.
// O .md continua existindo para os agentes — fica num "ver versão técnica" recolhido.
import clsx from 'clsx'
import { Banknote, Bell, ChevronDown, Code2, HeartHandshake, MapPin, Sprout, Target, Tractor, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  BUDGETS, CHANNELS, CONCERNS, CREDITS, FREQUENCIES, GOALS, INCOMES, INTERNETS, IRRIGATION, MACHINES, PROFILES, SOILS, type Opt,
} from './options'
import { cropOf, totalHa } from './context'
import { fmtHa } from './format'
import type { Answers } from './types'

const optOf = (opts: Opt[], id?: string) => opts.find((o) => o.id === id)

function Card({ icon: Icon, title, children, className }: { icon: typeof Sprout; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-2xl border border-border bg-surface p-5 shadow-sm', className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted"><Icon size={16} className="text-primary" />{title}</h3>
      {children}
    </section>
  )
}

function Pill({ opt, fallback }: { opt?: Opt; fallback?: string }) {
  if (!opt && !fallback) return null
  const Icon = opt?.icon
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/70 px-3 py-1.5 text-sm font-medium text-primary-dark">
      {Icon && <Icon size={15} />}{opt?.label ?? fallback}
    </span>
  )
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm italic text-muted">{children}</p>

/** Desenho simples dos talhões (SVG) a partir dos polígonos desenhados na entrevista. */
function FieldsSketch({ a }: { a: Answers }) {
  const pts = a.fields.flatMap((f) => f.ring)
  if (!pts.length) return null
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1])
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const w = maxX - minX || 1e-6; const h = maxY - minY || 1e-6
  const k = Math.min(260 / w, 130 / h)
  const sx = (x: number) => 10 + (x - minX) * k + (260 - w * k) / 2
  const sy = (y: number) => 10 + (maxY - y) * k + (130 - h * k) / 2
  return (
    <svg viewBox="0 0 280 150" className="h-36 w-full rounded-xl bg-[#1d3527]" role="img" aria-label="Desenho dos seus talhões">
      {a.fields.map((f) => {
        const d = f.ring.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0])},${sy(p[1])}`).join(' ') + 'Z'
        const cx = f.ring.slice(0, -1).reduce((s, p) => s + sx(p[0]), 0) / Math.max(1, f.ring.length - 1)
        const cy = f.ring.slice(0, -1).reduce((s, p) => s + sy(p[1]), 0) / Math.max(1, f.ring.length - 1)
        return (
          <g key={f.id}>
            <path d={d} fill={f.color} fillOpacity={0.8} stroke="#fff" strokeWidth={1.5} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight={700} fill="#fff">{f.name}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function ContextSummary({ a, md }: { a: Answers; md: string }) {
  const [tech, setTech] = useState(false)
  const profile = optOf(PROFILES, a.profile)
  const mun = a.municipality
  const ha = totalHa(a)

  return (
    <div className="space-y-4">
      {/* Quem é você */}
      <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-sidebar p-5 text-white shadow-sm">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">{profile ? <profile.icon size={28} /> : <Sprout size={28} />}</span>
        <div className="min-w-0 flex-1">
          <div className="text-xl font-bold">{profile?.label ?? 'Produtor'}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-white/75">
            <span className="inline-flex items-center gap-1"><MapPin size={14} />{mun ? `${mun.name}/${mun.uf}` : 'Município não informado'}</span>
            {a.fields.length > 0 && <span>{fmtHa(ha)} ha · {a.fields.length} {a.fields.length > 1 ? 'talhões' : 'talhão'}</span>}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Propriedade */}
        <Card icon={Sprout} title="Sua propriedade" className="md:col-span-2">
          {a.fields.length ? (
            <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
              <FieldsSketch a={a} />
              <ul className="space-y-2">
                {a.fields.map((f) => {
                  const crop = cropOf(f)
                  const soil = optOf(SOILS, f.soil)
                  const irr = optOf(IRRIGATION, f.irrigation)
                  return (
                    <li key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-bg px-3 py-2.5">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: f.color }} />
                      <b className="mr-1">{f.name}</b>
                      <span className="text-sm text-muted">{fmtHa(f.areaHa)} ha</span>
                      <span className="ml-auto flex flex-wrap gap-1.5 text-xs">
                        {crop && <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary-dark"><crop.icon size={12} />{crop.label}</span>}
                        {soil && <span className="rounded-full bg-surface px-2 py-0.5 ring-1 ring-border">Solo {soil.label.toLowerCase()}</span>}
                        {irr && <span className="rounded-full bg-surface px-2 py-0.5 ring-1 ring-border">{irr.id === 'nao' ? 'Sem irrigação' : irr.label}</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : <Empty>Você ainda não desenhou os talhões — usamos o município inteiro por enquanto.</Empty>}
        </Card>

        {/* Preocupações (ordem = prioridade) */}
        <Card icon={TriangleAlert} title="O que mais te preocupa">
          {a.concerns.length ? (
            <ol className="space-y-2">
              {a.concerns.map((c, i) => {
                const o = optOf(CONCERNS, c)
                return o && (
                  <li key={c} className="flex items-center gap-3">
                    <span className={clsx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold', i === 0 ? 'bg-danger text-white' : 'bg-bg text-muted ring-1 ring-border')}>{i + 1}</span>
                    <o.icon size={18} className="text-muted" />
                    <span><b className="block leading-tight">{o.label}</b><span className="text-xs text-muted">{o.hint}</span></span>
                  </li>
                )
              })}
            </ol>
          ) : <Empty>Nada informado.</Empty>}
        </Card>

        {/* Objetivos */}
        <Card icon={Target} title="Seus objetivos">
          {a.goals.length ? <div className="flex flex-wrap gap-2">{a.goals.map((g) => <Pill key={g} opt={optOf(GOALS, g)} />)}</div> : <Empty>Nada informado.</Empty>}
        </Card>

        {/* Dinheiro */}
        <Card icon={Banknote} title="Dinheiro e apoio">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Renda por ano</dt><dd className="text-right font-semibold">{optOf(INCOMES, a.income)?.label ?? '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Para a próxima safra</dt><dd className="text-right font-semibold">{optOf(BUDGETS, a.budget)?.label ?? '—'}</dd></div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">{a.credit.map((c) => <Pill key={c} opt={optOf(CREDITS, c)} />)}</div>
        </Card>

        {/* Máquinas */}
        <Card icon={Tractor} title="Máquinas e equipamentos">
          {a.machines.length ? <div className="flex flex-wrap gap-2">{a.machines.map((m) => <Pill key={m} opt={optOf(MACHINES, m)} />)}</div> : <Empty>Nada informado.</Empty>}
        </Card>

        {/* Comunicação */}
        <Card icon={Bell} title="Como vamos falar com você" className="md:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Pill opt={optOf(CHANNELS, a.channel)} />
            <Pill opt={optOf(FREQUENCIES, a.frequency)} />
            <Pill opt={optOf(INTERNETS, a.internet)} fallback="Internet boa" />
            <Pill opt={undefined} fallback={a.language === 'tecnica' ? 'Linguagem técnica' : 'Linguagem simples, sem termos técnicos'} />
          </div>
        </Card>
      </div>

      <p className="flex items-start gap-2 px-1 text-sm text-muted">
        <HeartHandshake size={16} className="mt-0.5 shrink-0 text-primary" />
        É com isso que filtramos os dados oficiais para mostrar só o que serve para você. Dá para mudar quando quiser em <b className="text-ink">Meu contexto</b>.
      </p>

      {/* Versão técnica: o arquivo que os agentes de IA leem */}
      <section className="rounded-2xl border border-dashed border-border">
        <button onClick={() => setTech(!tech)} aria-expanded={tech} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-muted hover:text-ink">
          <Code2 size={16} /> Ver versão técnica (arquivo que a IA lê)
          <ChevronDown size={16} className={clsx('ml-auto transition', tech && 'rotate-180')} />
        </button>
        {tech && <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap border-t border-border bg-[#FBFAF4] p-4 font-mono text-xs leading-relaxed text-ink">{md}</pre>}
      </section>
    </div>
  )
}
