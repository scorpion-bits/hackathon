// "Pergunte à IA" — chat de exemplo (sem backend). Cada resposta mostra de onde veio cada informação.
import clsx from 'clsx'
import { ArrowRight, Bot, ChevronDown, Gauge, Lightbulb, Mic, Send, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { InfoKind } from '../../components/data'
import { Button, Card, PageHeader } from '../../components/ui'
import { RISK_COLOR } from '../../lib/format'
import { FORECAST, SOURCES, ZARC_MILHO } from '../mock'
import { COST_TOTAL, FERTILIZER, FERTILIZER_TOTAL, brl0 } from '../components/views/demo'
import { DECENDIO_LABELS } from '../components/views/SourceSamples'
import { SourceChip } from '../components/Shell'

type Kind = Parameters<typeof InfoKind>[0]['kind']
type Why = { kind: Kind; src?: string; text: ReactNode }
type Msg =
  | { id: string; role: 'user'; text: string; time: string }
  | { id: string; role: 'ai'; time: string; answer: ReactNode; extra?: ReactNode; why: Why[]; uncertainty?: string; unknown?: string; actions?: { label: string; to: string }[] }

/* ------------------------------------------------------------------ visuais dentro das respostas */
function DecendioPicker() {
  const items = [28, 29, 30, 31].map((d) => ({ d, label: DECENDIO_LABELS[d - 1], risk: ZARC_MILHO[d - 1] }))
  return (
    <div className="rounded-xl border border-border bg-bg p-3">
      <div className="mb-2 text-xs font-medium text-muted">Risco de perda por clima se plantar milho no Talhão 2</div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((it) => (
          <div key={it.d} className="overflow-hidden rounded-lg border border-border bg-surface text-center">
            <div className="py-1.5 text-sm font-extrabold text-white" style={{ background: RISK_COLOR[it.risk] }}>{it.risk}%</div>
            <div className="px-1 py-1.5 text-[11px] leading-tight text-ink">{it.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-[11px] text-muted"><span className="rounded bg-ink px-1.5 py-0.5 font-semibold text-white">semana que vem: 5 a 11/out</span><span>→ espere pela faixa verde (20%)</span></div>
    </div>
  )
}

function FertilizerRows() {
  return (
    <div className="rounded-xl border border-border bg-bg p-3">
      {FERTILIZER.map((f) => (
        <div key={f.item} className="flex items-center justify-between border-b border-border py-1.5 text-sm last:border-0">
          <span className="text-ink">{f.item} <span className="text-muted">· {f.qty}</span></span><span className="font-semibold text-ink">{brl0(f.value)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2 text-sm font-bold text-ink"><span>Total em adubo</span><span className="text-primary-dark">{brl0(FERTILIZER_TOTAL)}</span></div>
    </div>
  )
}

function RainBars() {
  return (
    <div className="rounded-xl border border-border bg-bg p-3">
      <div className="mb-2 text-xs font-medium text-muted">Chuva prevista nos próximos 7 dias (mm)</div>
      <div className="flex items-end gap-2">
        {FORECAST.map((d) => (
          <div key={d.d} className="flex flex-1 flex-col items-center gap-1">
            <span className={clsx('text-[11px] font-semibold', d.rain >= 50 ? 'text-danger' : 'text-info')}>{d.rain}</span>
            <div className="flex h-16 w-full items-end"><div className="w-full rounded-t" style={{ height: `${Math.max(3, (d.rain / 62) * 64)}px`, background: d.rain >= 50 ? 'var(--color-danger)' : 'var(--color-info)' }} /></div>
            <span className="text-[11px] uppercase text-muted">{d.d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ conversa de exemplo */
const INITIAL: Msg[] = [
  { id: 'u1', role: 'user', time: '09:12', text: 'Posso plantar milho no talhão 2 semana que vem?' },
  {
    id: 'a1', role: 'ai', time: '09:12',
    answer: (<>
      <p><b>Eu esperaria até 21/10.</b> Na semana que vem (5 a 11/out) o risco de perder o milho por causa do clima é de <b>40%</b> até o dia 10 e <b>30%</b> a partir do dia 11. A faixa de risco baixo (20%) só começa em 21/10.</p>
      <p className="mt-2">Plantar fora da janela do zoneamento pode tirar seu acesso ao Proagro e à subvenção do seguro. E a semente que você tem (40 kg) não cobre o talhão inteiro.</p>
    </>),
    extra: <DecendioPicker />,
    why: [
      { kind: 'oficial', src: 'zarc', text: 'Zarc 2026/27 · Araraquara · milho 1ª safra · solo argiloso: 40% (1–10/out), 30% (11–20/out) e 20% a partir de 21/out. Atualizado em 02/10/2026.' },
      { kind: 'previsao', src: 'clima', text: 'Chuva forte na quinta (08/10): cerca de 62 mm em 24 h. O solo do Talhão 2 foi preparado em 20/09 e está exposto.' },
      { kind: 'declarado', src: 'voce', text: 'Talhão 2: 3,08 ha, solo argiloso, sequeiro. Você tem 40 kg de semente de milho, quer plantar em outubro e sua maior preocupação é a seca.' },
      { kind: 'estimativa', text: '3,08 ha × 20 kg/ha ≈ 62 kg de semente. Faltam cerca de 22 kg.' },
    ],
    uncertainty: 'Confiança média. O Zarc mostra o risco histórico, não garante a safra, e a previsão de chuva pode mudar até lá.',
    actions: [{ label: 'Ver o Talhão 2', to: '/prototipo/propriedade' }, { label: 'Ver como o Zarc funciona', to: '/prototipo/dados' }],
  },
  { id: 'u2', role: 'user', time: '09:14', text: 'Quanto gastei com adubo nesta safra?' },
  {
    id: 'a2', role: 'ai', time: '09:14',
    answer: (<p>Você gastou <b>{brl0(FERTILIZER_TOTAL)} com adubo</b> na safra 2026/27. Isso é {Math.round((FERTILIZER_TOTAL / COST_TOTAL) * 100)}% de tudo o que você gastou com insumos ({brl0(COST_TOTAL)}) e o seu maior gasto até agora.</p>),
    extra: <FertilizerRows />,
    why: [
      { kind: 'declarado', src: 'voce', text: 'Compras de NPK e ureia que você registrou em “Minha propriedade”.' },
      { kind: 'estimativa', text: `Percentual calculado sobre o total de ${brl0(COST_TOTAL)} registrado até hoje.` },
    ],
    unknown: 'Não achei nas fontes oficiais um preço de referência do adubo na sua região, então não comparei com o mercado. Prefiro não chutar.',
    actions: [{ label: 'Ver custos da safra', to: '/prototipo/propriedade' }],
  },
  { id: 'u3', role: 'user', time: '09:15', text: 'Vai chover?' },
  {
    id: 'a3', role: 'ai', time: '09:15',
    answer: (<>
      <p><b>Sim, e forte na quinta (08/10): cerca de 62 mm em 24 horas.</b> Antes disso chove pouco: 2 mm no domingo, 8 mm na segunda e 12 mm na quarta.</p>
      <p className="mt-2">Se for pulverizar, faça até terça. Na quarta e na quinta o produto pode ser lavado e o Talhão 2 pode sofrer erosão.</p>
    </>),
    extra: <RainBars />,
    why: [
      { kind: 'previsao', src: 'clima', text: 'Previsão de 7 dias para a coordenada da sede (-21,832; -48,236), atualizada hoje às 06:00.' },
      { kind: 'declarado', src: 'voce', text: 'Seu contexto.md pede aviso para chuva de 50 mm ou mais em um dia. Você também tem pulverizador de barra e costuma aplicar no meio da semana.' },
    ],
    uncertainty: 'Confiança média para quinta (6 dias à frente). Vale olhar de novo na terça.',
    actions: [{ label: 'Ver alertas para você', to: '/prototipo' }],
  },
]

const SUGGESTIONS = [
  'Qual defensivo posso usar no feijão contra mofo-branco?',
  'Vale a pena contratar um drone na região?',
  'O que faço com o fungicida que vence dia 12?',
  'Preciso de seguro rural para a soja?',
]

const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function genericAnswer(q: string): Msg {
  return {
    id: `a${Date.now()}`, role: 'ai', time: now(),
    answer: (<>
      <p>Você perguntou: <i>“{q}”</i></p>
      <p className="mt-2">Esta é uma <b>resposta de exemplo</b>. No protótipo as respostas são ilustrativas — ainda não há uma IA de verdade conectada.</p>
      <p className="mt-2">Na versão completa eu leria o seu contexto.md, consultaria as fontes oficiais certas (Zarc, Agrofit, previsão do tempo, satélite…) e responderia em poucas linhas, dizendo de onde veio cada informação.</p>
    </>),
    why: [
      { kind: 'simulado', text: 'Texto fixo do protótipo, igual para qualquer pergunta nova.' },
      { kind: 'declarado', src: 'voce', text: 'Na versão real: Araraquara, soja, milho e feijão, solo argiloso e preocupação com seca.' },
      { kind: 'oficial', text: 'Na versão real: as linhas das 7 fontes oficiais que tiverem a ver com a sua pergunta, com data de atualização.' },
    ],
    uncertainty: 'Sem confiança a medir: não há análise real nesta resposta.',
  }
}

/* ------------------------------------------------------------------ peças do chat */
function Avatar({ ai }: { ai: boolean }) {
  return <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-full', ai ? 'bg-primary text-white' : 'bg-ink text-white')}>{ai ? <Bot size={16} /> : <User size={15} />}</span>
}

function WhyBlock({ why }: { why: Why[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 bg-bg px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-primary-soft/50">
        <span className="inline-flex items-center gap-2"><Lightbulb size={15} className="text-accent" /> Por que estou dizendo isso</span>
        <ChevronDown size={16} className={clsx('text-muted transition', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="divide-y divide-border">
          {why.map((w, i) => (
            <li key={i} className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:gap-3">
              <div className="flex shrink-0 flex-wrap items-start gap-1.5 sm:w-44 sm:flex-col"><InfoKind kind={w.kind} />{w.src && <SourceChip k={w.src} />}</div>
              <p className="text-sm leading-relaxed text-ink">{w.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AiBubble({ m }: { m: Extract<Msg, { role: 'ai' }> }) {
  return (
    <div className="flex gap-3">
      <Avatar ai />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-surface p-4 shadow-sm">
        <div className="text-sm leading-relaxed text-ink">{m.answer}</div>
        {m.extra && <div className="mt-3">{m.extra}</div>}
        <WhyBlock why={m.why} />
        {m.uncertainty && <div className="mt-3 flex gap-2 rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent"><Gauge size={14} className="mt-0.5 shrink-0" /><span><b>Quanto confiar:</b> {m.uncertainty}</span></div>}
        {m.unknown && <div className="mt-3 flex gap-2 rounded-lg bg-bg px-3 py-2 text-xs text-muted ring-1 ring-border"><ShieldCheck size={14} className="mt-0.5 shrink-0" /><span><b className="text-ink">O que eu não sei:</b> {m.unknown}</span></div>}
        {m.actions && <div className="mt-3 flex flex-wrap gap-2">{m.actions.map((a) => (
          <Link key={a.label} to={a.to} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft px-2.5 py-1.5 text-xs font-medium text-primary-dark hover:bg-primary hover:text-white">{a.label} <ArrowRight size={12} /></Link>
        ))}</div>}
        <div className="mt-3 text-[11px] text-muted">{m.time} · fontes oficiais atualizadas hoje às 06:00</div>
      </div>
    </div>
  )
}

function Thinking() {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <Avatar ai />
      <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm text-muted shadow-sm">
        pensando
        <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 150}ms` }} />)}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ página */
export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const prevLen = useRef(INITIAL.length)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (msgs.length === prevLen.current && !thinking) return
    prevLen.current = msgs.length
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs.length, thinking])
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const send = (text: string) => {
    const q = text.trim()
    if (!q || thinking) return
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: q, time: now() }])
    setInput('')
    setThinking(true)
    timers.current.push(window.setTimeout(() => { setMsgs((m) => [...m, genericAnswer(q)]); setThinking(false) }, 1600))
  }

  const mic = () => {
    if (listening) { setListening(false); return }
    setListening(true)
    timers.current.push(window.setTimeout(() => { setListening(false); setInput('Qual defensivo posso usar no feijão contra mofo-branco?') }, 2200))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Pergunte à IA" subtitle="Converse como com um vizinho que entende de dados. Toda resposta diz de onde veio." />

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-primary/25 bg-primary-soft/60 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white"><Sparkles size={16} /></span>
        <div className="text-sm text-primary-dark"><b>A IA lê:</b> seu contexto.md + {SOURCES.length} fontes oficiais</div>
        <div className="hidden flex-wrap gap-1.5 md:flex">{['voce', ...SOURCES.map((s) => s.key)].map((k) => <SourceChip key={k} k={k} />)}</div>
        <Link to="/prototipo/contexto" className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">Ver meu contexto <ArrowRight size={14} /></Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="space-y-5">
            {msgs.map((m) => m.role === 'user' ? (
              <div key={m.id} className="flex flex-row-reverse gap-3">
                <Avatar ai={false} />
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white shadow-sm">{m.text}</div>
                  <div className="mt-1 text-right text-[11px] text-muted">{m.time}</div>
                </div>
              </div>
            ) : <AiBubble key={m.id} m={m} />)}
            {thinking && <Thinking />}
            <div ref={endRef} />
          </div>

          <div className="sticky bottom-0 -mx-1 mt-5 bg-gradient-to-t from-bg via-bg to-bg/0 px-1 pb-1 pt-4">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={thinking} className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink shadow-sm transition hover:border-primary hover:bg-primary-soft disabled:opacity-50">{s}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft">
              <button type="button" onClick={mic} aria-label="Falar a pergunta" aria-pressed={listening}
                className={clsx('relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition', listening ? 'bg-danger text-white' : 'bg-bg text-muted hover:bg-primary-soft hover:text-primary-dark')}>
                {listening && <span className="absolute inset-0 animate-ping rounded-xl bg-danger/40" />}
                <Mic size={18} className="relative" />
              </button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={thinking}
                placeholder={listening ? 'Ouvindo… (exemplo)' : 'Pergunte sobre plantio, clima, produtos, custos…'}
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink outline-none placeholder:text-muted" />
              <Button type="submit" disabled={!input.trim() || thinking}><Send size={15} /> Enviar</Button>
            </form>
            <p className="mt-1.5 text-center text-[11px] text-muted">Protótipo: perguntas novas recebem uma resposta de exemplo. Falar em vez de digitar também funciona na versão real.</p>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <Card title="Como a IA responde">
            <ul className="space-y-3 text-sm text-ink">
              <li className="flex gap-2"><span className="mt-0.5 text-primary">●</span><span>Resposta curta e em palavras simples.</span></li>
              <li className="flex gap-2"><span className="mt-0.5 text-primary">●</span><span>Mostra <b>de onde veio</b> cada informação, com fonte e data.</span></li>
              <li className="flex gap-2"><span className="mt-0.5 text-primary">●</span><span>Diz <b>quanto confiar</b> e quando não sabe.</span></li>
            </ul>
          </Card>
          <Card title="Tipos de informação">
            <div className="space-y-2 text-xs text-muted">
              <div className="flex items-center gap-2"><InfoKind kind="oficial" /> publicado por órgão do governo</div>
              <div className="flex items-center gap-2"><InfoKind kind="previsao" /> pode mudar</div>
              <div className="flex items-center gap-2"><InfoKind kind="declarado" /> você contou</div>
              <div className="flex items-center gap-2"><InfoKind kind="estimativa" /> conta feita pelo app</div>
              <div className="flex items-center gap-2"><InfoKind kind="simulado" /> exemplo do protótipo</div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
