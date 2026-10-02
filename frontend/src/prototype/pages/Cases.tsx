// "Meus casos" — acompanhamento dos casos levados à assistência técnica pública (modelo A, D-015).
// Respostas dos técnicos são EXEMPLOS para a demonstração (nenhuma pessoa real é citada).
import clsx from 'clsx'
import { ArrowRight, CheckCircle2, Clock, Inbox, Landmark, MessageSquareText, RotateCcw, Send } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IsoCube } from '../components/Brand'
import { Skeleton } from '../components/SourceStatus'
import { demoReply, fmtDate, resetCases, useCases, useExperts } from '../api/cases'
import { useMe } from '../api/session'
import { useTopics } from '../api/topics'

export default function Cases() {
  const cases = useCases()
  const experts = useExperts().data ?? []
  const topics = useTopics().data?.topics ?? []
  const isDemo = !!useMe().me?.producer.is_demo
  const [busy, setBusy] = useState<number | null>(null)
  const list = cases.data ?? []
  async function reply(id: number) {
    setBusy(id)
    try { await demoReply(id) } finally { setBusy(null) }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Meus casos</h1>
        <p className="mt-1 text-[15px] text-muted">Assuntos que você levou à assistência técnica pública. O atendimento é <b className="text-ink">gratuito</b> e quem orienta é um técnico — o AgroBits só organiza os dados e acompanha.</p>
      </header>

      {cases.loading ? <Skeleton className="h-40" /> : cases.error && !cases.data ? (
        <p className="rounded-2xl bg-surface p-6 text-sm text-muted ring-1 ring-border">Não consegui carregar os casos: {cases.error}</p>
      ) : list.length === 0 ? (
        <div className="iso-card bg-surface p-8 text-center">
          <Inbox size={36} className="mx-auto text-muted" />
          <h2 className="mt-3 text-lg font-bold">Nenhum caso enviado ainda</h2>
          <p className="mt-1 text-sm text-muted">Na tela inicial, abra um assunto e toque em “Enviar meu caso”.</p>
          <Link to="/prototipo" className="iso-btn mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-display font-bold text-white">Ver assuntos <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <ol className="space-y-4">
          {list.map((c, n) => {
            const e = experts.find((x) => x.id === c.expert_id)
            const done = c.status !== 'enviado'
            const alive = topics.some((t) => t.key === c.topic_key)
            const steps = [
              { label: 'Enviado', on: true, icon: Send },
              { label: 'Recebido pelo órgão', on: true, icon: Landmark },
              { label: 'Técnico respondeu', on: !!done, icon: MessageSquareText },
            ]
            return (
              <li key={c.id} className="iso-card bg-surface p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <IsoCube size={30}>{list.length - n}</IsoCube>
                  <div className="min-w-0 flex-1">
                    {alive
                      ? <Link to={`/prototipo/resolver/${encodeURIComponent(c.topic_key)}`} className="font-display text-base font-bold leading-snug hover:underline">{c.question}</Link>
                      : <span className="font-display text-base font-bold leading-snug">{c.question}</span>}
                    <div className="text-xs text-muted">Protocolo {c.protocol} · {e?.name ?? c.expert_id} · {fmtDate(c.created_at)} · resposta por {c.channel}</div>
                    {c.snapshot.path_title && <div className="mt-0.5 text-xs text-muted">Caminho em que você pensava: {c.snapshot.path_title}</div>}
                    {c.note && <div className="mt-0.5 text-xs text-muted">Você contou: “{c.note}”</div>}
                  </div>
                </div>
                {/* linha do tempo do atendimento */}
                <ol className="mt-4 grid grid-cols-3 gap-1">
                  {steps.map((s) => (
                    <li key={s.label} className="flex flex-col items-center gap-1 text-center">
                      <span className={clsx('grid h-9 w-9 place-items-center rounded-full', s.on ? 'bg-primary text-white' : 'bg-bg text-muted ring-1 ring-border')}><s.icon size={16} /></span>
                      <span className={clsx('text-[11px] leading-tight', s.on ? 'font-semibold text-ink' : 'text-muted')}>{s.label}</span>
                    </li>
                  ))}
                </ol>
                {done ? (
                  <div className="mt-4 rounded-xl bg-mint-soft/60 p-4 ring-1 ring-primary/20">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary-dark"><CheckCircle2 size={14} /> Resposta do técnico{c.reply_is_example ? ' · exemplo' : ''}</div>
                    <p className="mt-1 text-[15px] leading-relaxed">{c.reply}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-muted"><Clock size={15} /> Aguardando o técnico · {e?.eta}</span>
                    {isDemo && (
                      <button disabled={busy === c.id} onClick={() => void reply(c.id)} className="min-h-11 rounded-lg px-3 text-xs font-semibold text-primary ring-1 ring-primary/30 hover:bg-primary-soft disabled:opacity-50">
                        {busy === c.id ? 'Simulando…' : 'Simular resposta (demo)'}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {list.length > 0 && isDemo && (
        <button onClick={() => void resetCases()} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><RotateCcw size={14} /> Recomeçar a demonstração</button>
      )}
    </div>
  )
}
