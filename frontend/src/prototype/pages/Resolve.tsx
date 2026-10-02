// "Resolver" — fluxo guiado de UM problema: 1) o que os dados mostram  2) soluções do agente  3) próximo passo.
import clsx from 'clsx'
import {
  ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, CircleDot, Database, Globe2, Minus, Plus, RotateCcw, Sparkles,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { IsoFarm } from '../components/IsoFarm'
import { CUBE_TODO, IsoCube } from '../components/Brand'
import { SourceChip } from '../components/Shell'
import { FIELDS, FORECAST, INSIGHTS, ZARC_MILHO } from '../mock'
import { ORDER, PROBLEMS, ZARC_SOJA, nextOpen, resolveProblem, useResolved, type Evidence, type Problem } from '../resolve'

const RISK_BG = (r: number) => (r >= 40 ? 'bg-risk-40' : r >= 30 ? 'bg-risk-30' : r > 0 ? 'bg-risk-20' : 'bg-risk-0')
const MONTH = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DEC_START = ['1', '11', '21']
const TODAY_DEC = 28 // 1–10/out (decêndio 28, base 1)

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: ReactNode }) {
  return (
    <section className="relative md:pl-12">
      <h2 className="flex items-center gap-3 text-lg font-bold">
        <IsoCube size={34} {...(done ? {} : CUBE_TODO)} className="md:absolute md:-left-1 md:-top-1">{done ? '✓' : n}</IsoCube>
        <span className="md:pt-0.5">{title}</span>
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** Faixa do Zarc de setembro a dezembro, com "hoje" marcado. */
function ZarcStrip({ values }: { values: number[] }) {
  const from = 24 // decêndio 25 (1/set) em base 0
  const slice = values.slice(from, 36)
  return (
    <div>
      <div className="flex items-end gap-1">
        {slice.map((r, i) => {
          const dec = from + i + 1
          const today = dec === TODAY_DEC
          return (
            <div key={dec} className="flex flex-1 flex-col items-center gap-1">
              <span className={clsx('text-[11px] font-bold', r ? 'text-ink' : 'text-muted')}>{r ? `${r}%` : '—'}</span>
              <div className={clsx('w-full rounded', RISK_BG(r), today && 'ring-2 ring-ink ring-offset-2')} style={{ height: r ? 18 + r * 1.4 : 10 }} />
              <span className={clsx('text-[10px] leading-tight', today ? 'font-bold text-ink' : 'text-muted')}>
                {DEC_START[(dec - 1) % 3]}/{MONTH[Math.floor((dec - 1) / 3)]}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-risk-20" />20% risco baixo</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-risk-30" />30%</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-risk-40" />40% risco alto</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-risk-0" />fora da janela</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm ring-2 ring-ink" />hoje</span>
      </div>
    </div>
  )
}

function RainBars() {
  const max = Math.max(...FORECAST.map((f) => f.rain), 1)
  return (
    <div className="flex h-40 items-end gap-2">
      {FORECAST.map((f) => (
        <div key={f.d} className="flex flex-1 flex-col items-center gap-1">
          <span className={clsx('text-xs font-bold', f.rain >= 50 ? 'text-danger' : 'text-info')}>{f.rain}<span className="hidden sm:inline"> mm</span></span>
          <div className={clsx('w-full rounded-t', f.rain >= 50 ? 'bg-danger' : f.rain === 0 ? 'bg-primary/60' : 'bg-info/60')} style={{ height: Math.max(6, (f.rain / max) * 100) }} />
          <span className="text-xs uppercase text-muted">{f.d}</span>
        </div>
      ))}
    </div>
  )
}

function Bar({ label, value, max, className, note }: { label: string; value: number; max: number; className: string; note: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><b>{label}</b><span className="tabular-nums">{note}</span></div>
      <div className="mt-1 h-5 overflow-hidden rounded-full bg-bg ring-1 ring-border"><div className={clsx('h-full rounded-full', className)} style={{ width: `${(value / max) * 100}%` }} /></div>
    </div>
  )
}

function Big({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-bg p-4"><div className="text-3xl font-bold text-primary-dark">{value}</div><div className="text-sm text-muted">{label}</div></div>
}

function EvidenceView({ kind }: { kind: Evidence }) {
  switch (kind) {
    case 'zarc-milho': return <ZarcStrip values={ZARC_MILHO} />
    case 'zarc-soja': return <ZarcStrip values={ZARC_SOJA} />
    case 'rain': return <RainBars />
    case 'seeds': return (
      <div className="space-y-4">
        <Bar label="Você precisa" value={61.6} max={65} className="bg-ink/70" note="~62 kg" />
        <Bar label="Você tem" value={40} max={65} className="bg-primary" note="40 kg" />
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm"><b>Faltam ~22 kg</b> para plantar os 3,08 ha do Talhão 2.</p>
      </div>
    )
    case 'agrofit': return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {[['Produto', 'Magic (iprodiona)'], ['Registro MAPA', '00218'], ['Registrado para', 'Feijão · mofo-branco'], ['Classe toxicológica', '4 — pouco tóxico'], ['Seu estoque', '3,5 L'], ['Validade', '12/10 · em 10 dias']].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-bg px-4 py-3"><dt className="text-xs text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>
        ))}
      </dl>
    )
    case 'drones': return (
      <div className="grid gap-3 sm:grid-cols-3">
        <Big value="14" label="drones com operador em Araraquara" />
        <Big value="1.346" label="drones no estado de SP" />
        <Big value="1.306" label="dos 5.573 municípios têm algum operador" />
      </div>
    )
  }
}

/** key={id}: ao ir para o próximo assunto, a tela recomeça do zero. */
export default function ResolveRoute() {
  const { id = '' } = useParams()
  return <Resolve key={id} id={id} />
}

function Resolve({ id }: { id: string }) {
  const nav = useNavigate()
  const resolved = useResolved()
  const p: Problem | undefined = PROBLEMS[id]
  const insight = INSIGHTS.find((i) => i.id === id)
  const chosenId = resolved[id]
  const [pick, setPick] = useState<string | undefined>(() => chosenId ?? p?.solutions.find((s) => s.recommended)?.id)
  const [editing, setEditing] = useState(false)
  if (!p || !insight) return <Navigate to="/prototipo" replace />

  const done = !!chosenId && !editing
  const chosen = p.solutions.find((s) => s.id === chosenId)
  const field = FIELDS.find((f) => f.id === p.fieldId)
  const position = ORDER.indexOf(id) + 1
  const doneCount = ORDER.filter((k) => resolved[k]).length
  const next = nextOpen(resolved, id)

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      {/* Cabeçalho + progresso */}
      <div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link to="/prototipo" className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Início</Link>
          <span className="text-muted">Assunto {position} de {ORDER.length} · {doneCount} resolvido{doneCount === 1 ? '' : 's'}</span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {ORDER.map((k) => <span key={k} className={clsx('h-1.5 flex-1 rounded-full', resolved[k] ? 'bg-primary' : k === id ? 'bg-ink' : 'bg-border')} />)}
        </div>
        <h1 className="mt-5 text-2xl font-bold leading-tight md:text-3xl">{p.question}</h1>
        <p className="mt-2 text-[15px] text-muted">{insight.summary}</p>
      </div>

      {/* 1. Dados */}
      <Step n={1} title="O que os dados mostram" done>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="iso-card bg-surface p-5 md:col-span-2">
            <h3 className="font-semibold">{p.evidenceTitle}</h3>
            <p className="mb-4 flex items-center gap-1.5 text-xs text-muted">
              <Database size={12} className={insight.origin === 'real' ? 'text-primary' : ''} />{p.evidenceNote}
              {insight.origin === 'real' ? <b className="text-primary-dark">· dado oficial</b> : <span>· exemplo</span>}
            </p>
            <EvidenceView kind={p.evidence} />
          </div>
          {field && (
            <Link to={`/prototipo/mapa?talhao=${field.id}`} className="iso-card group flex flex-col overflow-hidden bg-surface">
              <div className="bg-gradient-to-b from-mint-soft to-surface"><IsoFarm fields={FIELDS} colorBy="crop" focusId={field.id} height={176} className="w-full" /></div>
              <div className="flex flex-1 flex-col justify-between gap-2 px-4 py-3">
                <span><b className="block text-sm">{field.name} · {field.crop}</b><span className="text-xs text-muted">{field.area.toLocaleString('pt-BR')} ha · solo {field.soil.toLowerCase()}</span></span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><Globe2 size={15} /> Ver no mapa vivo <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          )}
        </div>
        <details className="mt-3 rounded-xl bg-bg px-4 py-3 text-sm">
          <summary className="cursor-pointer font-semibold text-primary">Por que isso vale para você?</summary>
          <ul className="mt-2 space-y-1.5">{insight.why.map((w) => <li key={w} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{w}</li>)}</ul>
          <div className="mt-2 flex flex-wrap gap-1.5">{insight.sources.map((s) => <SourceChip key={s} k={s} />)}<SourceChip k="voce" /></div>
        </details>
      </Step>

      {/* 2. Soluções */}
      <Step n={2} title={done ? 'Sua escolha' : 'Escolha uma solução'} done={done}>
        {done && chosen ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-primary-soft/60 p-4 ring-1 ring-primary/30">
            <CheckCircle2 size={22} className="text-primary" />
            <b className="flex-1">{chosen.title}</b>
            <button onClick={() => { setEditing(true); setPick(chosen.id) }} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><RotateCcw size={14} /> Mudar escolha</button>
          </div>
        ) : (
          <>
            <p className="mb-3 flex items-center gap-1.5 text-sm text-muted"><Sparkles size={14} className="text-primary" /> O agente comparou as opções com o seu contexto (orçamento, máquinas, preocupações).</p>
            <div role="radiogroup" aria-label="Soluções" className="space-y-3">
              {p.solutions.map((s) => {
                const on = pick === s.id
                return (
                  <button key={s.id} role="radio" aria-checked={on} onClick={() => setPick(s.id)}
                    className={clsx('w-full bg-surface p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      on ? 'iso-card bg-mint-soft/40' : 'rounded-2xl shadow-sm ring-1 ring-border hover:ring-primary/50')}>
                    <div className="flex items-start gap-3">
                      {on ? <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-primary" /> : <CircleDot size={22} className="mt-0.5 shrink-0 text-border" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-base">{s.title}</b>
                          {s.recommended && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">Recomendado</span>}
                        </div>
                        <p className="mt-0.5 text-sm text-muted">{s.detail}</p>
                        {(s.pros.length > 0 || s.cons.length > 0) && (
                          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                            {s.pros.map((t) => <li key={t} className="flex gap-1.5"><Plus size={15} className="mt-0.5 shrink-0 text-primary" />{t}</li>)}
                            {s.cons.map((t) => <li key={t} className="flex gap-1.5 text-muted"><Minus size={15} className="mt-0.5 shrink-0 text-danger" />{t}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button disabled={!pick} onClick={() => { if (pick) { resolveProblem(id, pick); setEditing(false) } }}
              className="iso-btn mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-base font-bold text-white hover:bg-primary-dark disabled:opacity-50">
              Confirmar escolha <Check size={18} />
            </button>
          </>
        )}
      </Step>

      {/* 3. Próximo passo */}
      {done && chosen && (
        <Step n={3} title="Pronto! O que acontece agora" done>
          <ul className="space-y-2">
            {chosen.then.map((t) => <li key={t} className="flex items-start gap-2 rounded-xl bg-surface px-4 py-3 text-sm shadow-sm ring-1 ring-border"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />{t}</li>)}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            {next ? (
              <button onClick={() => nav(`/prototipo/resolver/${next}`)} className="iso-btn inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 font-display text-base font-bold text-white hover:bg-ink/90">
                Próximo assunto: {PROBLEMS[next].question} <ArrowRight size={18} />
              </button>
            ) : (
              <Link to="/prototipo" className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-base font-semibold text-white">Tudo resolvido por hoje — voltar ao início <ArrowRight size={18} /></Link>
            )}
            <Link to="/prototipo/assistente" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink"><Bot size={16} /> Tirar dúvida com a IA</Link>
          </div>
        </Step>
      )}
    </div>
  )
}
