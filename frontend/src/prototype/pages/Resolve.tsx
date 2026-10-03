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
import { SourceStatus, Skeleton } from '../components/SourceStatus'
import { SourceChip } from '../components/Shell'
import { FIELDS } from '../mock'
import { fmtDate, sendCase, useCases, useExperts, type CaseRecord, type Expert } from '../api/cases'
import { nfmt, weekdayOf } from '../api/opendata'
import { useMe } from '../api/session'
import { useTopics, type Evidence, type Topic } from '../api/topics'

const RISK_BG = (r: number) => (r >= 40 ? 'bg-risk-40' : r >= 30 ? 'bg-risk-30' : r > 0 ? 'bg-risk-20' : 'bg-risk-0')
/** "1–10/out" → "1/out" · "21–fim/out" → "21/out" */
const shortLabel = (l: string) => l.replace(/–[^/]+\//, '/')

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

/** Faixa do Zarc a partir de 2 decêndios antes de hoje (até 12 barras), com "hoje" marcado. */
function ZarcStrip({ values, labels, today }: { values: number[]; labels: string[]; today: number }) {
  const from = Math.max(0, today - 3)
  const slice = values.slice(from, from + 12)
  return (
    <div>
      <div className="flex items-end gap-1">
        {slice.map((r, i) => {
          const dec = from + i + 1
          const isToday = dec === today
          return (
            <div key={dec} className="flex flex-1 flex-col items-center gap-1">
              <span className={clsx('text-[11px] font-bold', r ? 'text-ink' : 'text-muted')}>{r ? `${r}%` : '—'}</span>
              <div className={clsx('w-full rounded', RISK_BG(r), isToday && 'ring-2 ring-ink ring-offset-2')} style={{ height: r ? 18 + r * 1.4 : 10 }} />
              <span className={clsx('text-[10px] leading-tight', isToday ? 'font-bold text-ink' : 'text-muted')}>{shortLabel(labels[dec - 1] ?? '')}</span>
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

function RainBars({ days, threshold }: { days: { date: string; mm: number | null }[]; threshold: number }) {
  const max = Math.max(...days.map((f) => f.mm ?? 0), 1)
  return (
    <div className="flex h-40 items-end gap-2">
      {days.map((f) => {
        const mm = f.mm ?? 0
        return (
          <div key={f.date} className="flex flex-1 flex-col items-center gap-1">
            <span className={clsx('text-xs font-bold', mm >= threshold ? 'text-danger' : 'text-info')}>{Math.round(mm)}<span className="hidden sm:inline"> mm</span></span>
            <div className={clsx('w-full rounded-t', mm >= threshold ? 'bg-danger' : mm === 0 ? 'bg-primary/60' : 'bg-info/60')} style={{ height: Math.max(6, (mm / max) * 100) }} />
            <span className="text-xs uppercase text-muted">{weekdayOf(f.date)}</span>
          </div>
        )
      })}
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

const EVIDENCE_TITLE: Record<Evidence['type'], string> = {
  zarc: 'Risco de perder a lavoura pelo clima, por data de plantio', rain: 'Chuva prevista para a sua coordenada (mm por dia)',
  rain_normal: 'Chuva dos últimos dias × o normal da região', seeds: 'Semente necessária × semente em estoque',
  agrofit: 'Registro oficial do produto no seu estoque', drones: 'Drones agrícolas registrados no MAPA',
}

function EvidenceView({ ev }: { ev: Evidence }) {
  switch (ev.type) {
    case 'zarc': return <ZarcStrip values={ev.series} labels={ev.labels} today={ev.today_decendio} />
    case 'rain': return <RainBars days={ev.days} threshold={ev.threshold_mm} />
    case 'rain_normal': return (
      <div className="space-y-4">
        <Bar label="Choveu" value={ev.observed_mm} max={Math.max(ev.observed_mm, ev.normal_mm, 1)} className="bg-info" note={`${nfmt(ev.observed_mm)} mm`} />
        <Bar label="O normal para o período" value={ev.normal_mm} max={Math.max(ev.observed_mm, ev.normal_mm, 1)} className="bg-ink/60" note={`${nfmt(ev.normal_mm)} mm`} />
        <p className="rounded-xl bg-info-soft px-4 py-3 text-sm">{ev.period.start} a {ev.period.end} ({ev.period.days} dias): <b>{ev.label}</b>.</p>
      </div>
    )
    case 'seeds': {
      const max = Math.max(ev.needed_kg, ev.have_kg, 1) * 1.05
      return (
        <div className="space-y-4">
          <Bar label="Você precisa" value={ev.needed_kg} max={max} className="bg-ink/70" note={`~${nfmt(Math.round(ev.needed_kg))} kg`} />
          <Bar label="Você tem" value={ev.have_kg} max={max} className="bg-primary" note={`${nfmt(ev.have_kg)} kg`} />
          <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm"><b>Faltam ~{nfmt(Math.round(ev.missing_kg))} kg</b> para plantar {nfmt(ev.area_ha)} ha ({nfmt(ev.rate_kg_ha)} kg/ha, taxa informada por você).</p>
        </div>
      )
    }
    case 'agrofit': {
      const match = ev.matches[0]
      const rows: [string, string][] = [
        ['Produto', ev.found ? `${ev.brand}${ev.ingredient ? ` (${ev.ingredient})` : ''}` : ev.item],
        ['Registro MAPA', ev.registration ?? 'não encontrado no Agrofit'],
        ['Registrado para', match ? `${match.crop}${match.pests ? ` · ${match.pests}` : ''}` : ev.registered_crops.slice(0, 4).join(', ') || '—'],
        ['Classe toxicológica', ev.tox_class ?? '—'],
        ['Seu estoque', `${nfmt(ev.quantity)} ${ev.unit}`],
        ['Validade', `${fmtDate(ev.expiry_date)} · ${ev.days_to_expiry < 0 ? `vencido há ${-ev.days_to_expiry} dias` : `em ${ev.days_to_expiry} dias`}`],
      ]
      return (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {rows.map(([k, v]) => <div key={k} className="rounded-xl bg-bg px-4 py-3"><dt className="text-xs text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
        </dl>
      )
    }
    case 'drones': return (
      <div className="grid gap-3 sm:grid-cols-3">
        <Big value={nfmt(ev.drones)} label={`drones com operador em ${ev.municipality}`} />
        <Big value={nfmt(ev.uf_drones)} label={`drones no estado (${ev.uf})`} />
        <Big value={nfmt(ev.br_municipalities_with_drones)} label={`dos ${nfmt(ev.br_municipalities)} municípios têm algum operador`} />
      </div>
    )
  }
}

/** key={id}: ao ir para o próximo assunto, a tela recomeça do zero. */
export default function ResolveRoute() {
  const { id = '' } = useParams()
  const topics = useTopics()
  const cases = useCases()
  const experts = useExperts()
  if (topics.loading || cases.loading || experts.loading) return <div className="mx-auto max-w-4xl space-y-4"><Skeleton className="h-10" /><Skeleton className="h-64" /><Skeleton className="h-40" /></div>
  if (!topics.data) return <p className="mx-auto max-w-4xl rounded-2xl bg-surface p-6 text-sm text-muted ring-1 ring-border">Não consegui carregar o assunto: {topics.error} <button onClick={() => void topics.reload()} className="font-semibold text-primary">Tentar de novo</button></p>
  const topic = topics.data.topics.find((t) => t.key === id)
  const sent = (cases.data ?? []).find((c) => c.topic_key === id)
  // assunto que sumiu (dado mudou) mas já tem caso enviado: mostra o caso, não o assunto
  if (!topic) return sent ? <Navigate to="/casos" replace /> : <Navigate to="/" replace />
  return <Resolve key={id} topic={topic} all={topics.data.topics} status={topics.data.sources_status} sent={sent} experts={experts.data ?? []} />
}

type ResolveProps = { topic: Topic; all: Topic[]; status: Record<string, string>; sent?: CaseRecord; experts: Expert[] }

function Resolve({ topic, all, status, sent, experts }: ResolveProps) {
  const nav = useNavigate()
  const me = useMe().me
  const id = topic.key
  const [pick, setPick] = useState<string | undefined>(() => sent?.path ?? undefined)
  const [expert, setExpert] = useState<string>(() => sent?.expert_id ?? topic.expert_id ?? experts[0]?.id ?? 'cati')
  const [channel, setChannel] = useState('WhatsApp')
  const [note, setNote] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chosen = topic.paths.find((s) => s.id === (sent?.path ?? pick))
  const field = FIELDS.find((f) => f.id === topic.field_id)
  const position = all.findIndex((t) => t.key === id) + 1
  const doneCount = all.filter((t) => t.choice).length
  const next = [...all.slice(position), ...all.slice(0, position - 1)].find((t) => !t.choice)
  const official = topic.sources[0]?.key !== 'conta'
  const ev = topic.evidence
  const statusKey = ev.type === 'rain' ? 'clima' : ev.type === 'rain_normal' ? 'nasa' : null
  const expertOf = (eid: string) => experts.find((e) => e.id === eid)

  async function send() {
    setBusy(true)
    setError(null)
    try {
      await sendCase({ topic_key: id, expert_id: expert, channel, path: pick, note: note || undefined })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      {/* Cabeçalho + progresso */}
      <div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link to="/" className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Início</Link>
          <span className="text-muted">Assunto {position} de {all.length} · {doneCount} encaminhado{doneCount === 1 ? '' : 's'}</span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {all.map((t) => <span key={t.key} className={clsx('h-1.5 flex-1 rounded-full', t.choice ? 'bg-primary' : t.key === id ? 'bg-ink' : 'bg-border')} />)}
        </div>
        <h1 className="mt-5 text-2xl font-bold leading-tight md:text-3xl">{topic.question}</h1>
        <p className="mt-2 text-[15px] text-muted">{topic.summary}</p>
      </div>

      {/* 1. Dados */}
      <Step n={1} title="O que os dados mostram" done>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="iso-card min-w-0 bg-surface p-5 md:col-span-2">
            <h3 className="font-semibold">{EVIDENCE_TITLE[ev.type]}</h3>
            <p className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
              <Database size={12} className={official ? 'text-primary' : ''} />{topic.evidence_note}
              {official ? <b className="text-primary-dark">· dado oficial</b> : <span>· dados da sua conta</span>}
            </p>
            <EvidenceView ev={ev} />
            {statusKey && <SourceStatus status={status[statusKey]} fetchedAt={'fetched_at' in ev ? ev.fetched_at : undefined} what="Dado" />}
          </div>
          {field && (
            <Link to={`/mapa?talhao=${field.id}`} className="iso-card group flex flex-col overflow-hidden bg-surface">
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
          <ul className="mt-2 space-y-1.5">{topic.why.map((w) => <li key={w} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{w}</li>)}</ul>
          <div className="mt-2 flex flex-wrap gap-1.5">{topic.sources.map((s) => <SourceChip key={s.key} k={s.key === 'conta' ? 'voce' : s.name.split(' — ')[0]} />)}</div>
        </details>
      </Step>

      {/* 2. Caminhos possíveis — informação para a conversa, não uma ordem */}
      <Step n={2} title="Caminhos possíveis" done={!!sent}>
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-straw-soft px-3 py-2.5 text-sm text-ink ring-1 ring-straw/40">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-accent" />
          <span><b>O AgroBits não decide por você.</b> Estes caminhos saem dos dados oficiais e servem para você conversar com a assistência técnica, que dá a orientação final.</span>
        </p>
        <div role="radiogroup" aria-label="Caminhos possíveis" className="space-y-3">
          {topic.paths.map((s) => {
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
              <div className="flex-1"><b className="block text-lg">Protocolo {sent.protocol}</b><span className="text-sm text-muted">{expertOf(sent.expert_id)?.name} · enviado em {fmtDate(sent.created_at)} · {expertOf(sent.expert_id)?.eta}</span></div>
              <Link to="/casos" className="text-sm font-semibold text-primary">Ver meus casos</Link>
            </div>
            <Link to={`/tecnico/caso/${sent.id}`} className="iso-btn mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sidebar px-4 font-display text-sm font-bold text-white">Ver como o técnico recebe →</Link>
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
              {experts.map((e) => {
                const on = expert === e.id
                return (
                  <button key={e.id} role="radio" aria-checked={on} onClick={() => setExpert(e.id)}
                    className={clsx('flex flex-col gap-1 bg-surface p-4 text-left transition', on ? 'iso-card bg-mint-soft/40' : 'rounded-2xl shadow-sm ring-1 ring-border hover:ring-primary/50')}>
                    <span className="flex items-center gap-2">
                      <Landmark size={18} className="shrink-0 text-primary" />
                      {topic.expert_id === e.id && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Indicado para este assunto</span>}
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
                <li>• Assunto: {topic.question}</li>
                {field && <li>• {field.name}: {field.crop}, {field.area.toLocaleString('pt-BR')} ha, solo {field.soil.toLowerCase()}</li>}
                <li>• Dados: {topic.evidence_note ?? topic.sources.map((s) => s.name).join(' · ')}</li>
                <li>• Município: {me?.farm?.municipality}/{me?.farm?.uf}</li>
                {pick && <li>• Caminho que você está pensando: {topic.paths.find((x) => x.id === pick)?.title}</li>}
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
              <button disabled={!consent || !expert || busy} onClick={() => void send()}
                className="iso-btn flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-base font-bold text-white hover:bg-primary-dark disabled:opacity-50 md:inline-flex md:w-auto">
                <Send size={18} /> {busy ? 'Enviando…' : 'Enviar meu caso'}
              </button>
              {error && <p role="alert" className="mt-1.5 text-center text-sm text-danger md:text-left">{error}</p>}
              {!consent && <p className="mt-1.5 text-center text-xs text-muted md:text-left">Marque a autorização acima para enviar.</p>}
            </div>
          </div>
        )}
      </Step>

      {sent && (
        <div className="flex flex-wrap gap-3 md:pl-12">
          {next ? (
            <button onClick={() => nav(`/resolver/${encodeURIComponent(next.key)}`)} className="iso-btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-display text-base font-bold text-white hover:bg-ink/90 md:w-auto">
              Próximo assunto <ArrowRight size={18} />
            </button>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-base font-semibold text-white">Tudo encaminhado — voltar ao início <ArrowRight size={18} /></Link>
          )}
          <Link to="/assistente" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink"><Bot size={16} /> Tirar dúvida sobre os dados</Link>
        </div>
      )}
    </div>
  )
}
