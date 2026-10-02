// "Resolver" — fluxo guiado de UM problema (modelo A, D-015): 1) o que os dados mostram  2) caminhos possíveis
// (informação, não prescrição)  3) levar o caso à assistência técnica pública, de graça.
import clsx from 'clsx'
import {
  ArrowLeft, ArrowRight, Bot, CheckCircle2, CircleDot, Database, FileText, Globe2, Landmark, Minus, Plus, Send, ShieldCheck,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { IsoFarm } from '../components/IsoFarm'
import { CUBE_TODO, IsoCube } from '../components/Brand'
import { SourceChip } from '../components/Shell'
import { FIELDS, FORECAST, INSIGHTS, PRODUCER, ZARC_MILHO } from '../mock'
import { BEST_EXPERT, EXPERTS, ORDER, PROBLEMS, ZARC_SOJA, nextOpen, sendCase, useCases, useResolved, type Evidence, type Problem } from '../resolve'

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
  const cases = useCases()
  const sent = cases[id]
  const [pick, setPick] = useState<string | undefined>(() => sent?.path)
  const [expert, setExpert] = useState<string>(() => BEST_EXPERT[id] ?? 'cati')
  const [channel, setChannel] = useState('WhatsApp')
  const [note, setNote] = useState('')
  const [consent, setConsent] = useState(false)
  if (!p || !insight) return <Navigate to="/prototipo" replace />

  const chosen = p.solutions.find((s) => s.id === (sent?.path ?? pick))
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
          <span className="text-muted">Assunto {position} de {ORDER.length} · {doneCount} encaminhado{doneCount === 1 ? '' : 's'}</span>
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

      {/* 2. Caminhos possíveis — informação para a conversa, não uma ordem */}
      <Step n={2} title="Caminhos possíveis" done={!!sent}>
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-straw-soft px-3 py-2.5 text-sm text-ink ring-1 ring-straw/40">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-accent" />
          <span><b>O AgroBits não decide por você.</b> Estes caminhos saem dos dados oficiais e servem para você conversar com a assistência técnica, que dá a orientação final.</span>
        </p>
        <div role="radiogroup" aria-label="Caminhos possíveis" className="space-y-3">
          {p.solutions.map((s) => {
            const on = pick === s.id
            return (
              <button key={s.id} role="radio" aria-checked={on} disabled={!!sent} onClick={() => setPick(on ? undefined : s.id)}
                className={clsx('w-full bg-surface p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default',
                  on ? 'iso-card bg-mint-soft/40' : 'rounded-2xl shadow-sm ring-1 ring-border hover:ring-primary/50', sent && !on && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  {on ? <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-primary" /> : <CircleDot size={22} className="mt-0.5 shrink-0 text-border" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-base">{s.title}</b>
                      {s.recommended && <span className="rounded-full bg-mint-soft px-2 py-0.5 text-[11px] font-bold text-primary-dark ring-1 ring-primary/30">Mais alinhado aos dados oficiais</span>}
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
        {!sent && <p className="mt-2 text-xs text-muted">Opcional: marque o caminho que você está pensando em seguir — ele vai junto no seu caso.</p>}
      </Step>

      {/* 3. Levar à assistência técnica pública (modelo A: gratuito, técnicos públicos) */}
      <Step n={3} title={sent ? 'Caso enviado' : 'Leve para um técnico — de graça'} done={!!sent}>
        {sent ? (
          <div className="iso-card bg-surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <CheckCircle2 size={26} className="text-primary" />
              <div className="flex-1"><b className="block text-lg">Protocolo {sent.protocol}</b><span className="text-sm text-muted">{EXPERTS.find((e) => e.id === sent.expertId)?.name} · enviado em {sent.sentAt} · {EXPERTS.find((e) => e.id === sent.expertId)?.eta}</span></div>
              <Link to="/prototipo/casos" className="text-sm font-semibold text-primary">Ver meus casos</Link>
            </div>
            <h3 className="mt-4 text-sm font-bold">Enquanto isso, o AgroBits:</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />Avisa você assim que o técnico responder ({sent.channel})</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />Continua de olho nos dados oficiais e atualiza o caso se algo mudar (ex.: previsão de chuva)</li>
              {chosen && chosen.then.slice(0, 1).map((t) => <li key={t} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />{t}</li>)}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div role="radiogroup" aria-label="Quem vai atender" className="grid gap-3 md:grid-cols-3">
              {EXPERTS.map((e) => {
                const on = expert === e.id
                return (
                  <button key={e.id} role="radio" aria-checked={on} onClick={() => setExpert(e.id)}
                    className={clsx('flex flex-col gap-1 bg-surface p-4 text-left transition', on ? 'iso-card bg-mint-soft/40' : 'rounded-2xl shadow-sm ring-1 ring-border hover:ring-primary/50')}>
                    <span className="flex items-center gap-2">
                      <Landmark size={18} className="shrink-0 text-primary" />
                      {BEST_EXPERT[id] === e.id && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Indicado para este assunto</span>}
                    </span>
                    <b className="leading-snug">{e.name}</b>
                    <span className="text-xs text-muted">{e.kind}</span>
                    <span className="text-xs">{e.how}</span>
                    <span className="mt-1 text-xs font-semibold text-primary-dark">Gratuito · {e.eta}</span>
                  </button>
                )
              })}
            </div>

            <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-border">
              <h3 className="flex items-center gap-2 text-sm font-bold"><FileText size={16} className="text-primary" /> O que vai no seu caso (já preenchido)</h3>
              <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
                <li>• Assunto: {p.question}</li>
                {field && <li>• {field.name}: {field.crop}, {field.area.toLocaleString('pt-BR')} ha, solo {field.soil.toLowerCase()}</li>}
                <li>• Dados oficiais: {p.evidenceNote}</li>
                <li>• Município: {PRODUCER.municipality}/{PRODUCER.uf}</li>
                {pick && <li>• Caminho que você está pensando: {p.solutions.find((x) => x.id === pick)?.title}</li>}
              </ul>
              <label className="mt-3 block">
                <span className="text-xs font-semibold text-muted">Quer contar mais alguma coisa? (opcional)</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: a terra do talhão está encharcando" className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-3 text-base outline-none focus:border-primary" />
              </label>
              <div className="mt-3">
                <span className="text-xs font-semibold text-muted">Como prefere receber a resposta?</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {['WhatsApp', 'Ligação', 'Visita na propriedade'].map((c) => (
                    <button key={c} onClick={() => setChannel(c)} aria-pressed={channel === c}
                      className={clsx('min-h-11 rounded-full px-4 text-sm font-semibold ring-1', channel === c ? 'bg-primary text-white ring-primary' : 'bg-surface ring-border')}>{c}</button>
                  ))}
                </div>
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
                <span>Autorizo enviar estas informações <b>só para o órgão escolhido</b>, para análise do meu caso (LGPD). Posso cancelar quando quiser.</span>
              </label>
            </div>

            <div className="sticky bottom-0 -mx-4 border-t border-border bg-bg/95 p-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
              <button disabled={!consent || !expert} onClick={() => expert && sendCase({ problemId: id, expertId: expert, channel, path: pick, note: note || undefined })}
                className="iso-btn flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-base font-bold text-white hover:bg-primary-dark disabled:opacity-50 md:inline-flex md:w-auto">
                <Send size={18} /> Enviar meu caso
              </button>
              {!consent && <p className="mt-1.5 text-center text-xs text-muted md:text-left">Marque a autorização acima para enviar.</p>}
            </div>
          </div>
        )}
      </Step>

      {sent && (
        <div className="flex flex-wrap gap-3 md:pl-12">
          {next ? (
            <button onClick={() => nav(`/prototipo/resolver/${next}`)} className="iso-btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-display text-base font-bold text-white hover:bg-ink/90 md:w-auto">
              Próximo assunto <ArrowRight size={18} />
            </button>
          ) : (
            <Link to="/prototipo" className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-base font-semibold text-white">Tudo encaminhado — voltar ao início <ArrowRight size={18} /></Link>
          )}
          <Link to="/prototipo/assistente" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink"><Bot size={16} /> Tirar dúvida sobre os dados</Link>
        </div>
      )}
    </div>
  )
}
