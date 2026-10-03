// "Pergunte à IA" (M5): conversa com POST /api/assistant/chat. A IA explica dados oficiais e cita a fonte;
// com chave (Groq) usa um modelo com ferramentas, sem chave responde em modo offline com os mesmos dados reais.
import clsx from 'clsx'
import { ArrowRight, Bot, Database, Mic, Send, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeader } from '../../components/ui'
import { apiPost } from '../api/client'
import { useApi } from '../api/resource'
import { useTopics } from '../api/topics'
import { parseMarkdown, renderBlock } from '../components/views/Markdown'

type Source = { key: string; name?: string; agency?: string; extracted_at?: string }
type Msg = { id: string; role: 'user' | 'assistant'; text: string; sources: Source[]; time: string; mode?: string; warning?: string }
type Reply = { answer: string; sources: Source[]; mode: string; warning?: string }
type Hist = { role: 'user' | 'assistant'; content: string; sources: Source[]; created_at: string }[]
type Status = { llm: boolean; mode: string; model: string | null }

// respostas offline usam "•" e quebras simples; o renderizador espera markdown
const prepare = (t: string) => t.replace(/^\s*•\s*/gm, '- ').replace(/\n(?!\n|- |\d+\. )/g, '\n\n')
const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const FALLBACK_SUGGESTIONS = ['Quando eu planto o milho do Talhão 2?', 'Choveu mais que o normal?', 'O que é o Zarc?', 'O que eu faço?']

function Avatar({ ai }: { ai: boolean }) {
  return <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-full', ai ? 'bg-primary text-white' : 'bg-ink text-white')}>{ai ? <Bot size={16} /> : <User size={15} />}</span>
}

function AiBubble({ m }: { m: Msg }) {
  return (
    <div className="flex gap-3">
      <Avatar ai />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-surface p-4 shadow-sm">
        <div className="space-y-2">{m.role === 'assistant' && parseMarkdown(prepare(m.text)).map((b, i) => renderBlock(b, i))}</div>
        {m.warning && <div className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent">{m.warning}</div>}
        {m.sources.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">De onde veio</div>
            <div className="flex flex-wrap gap-1.5">
              {m.sources.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1 rounded-md border border-info/20 bg-info-soft px-1.5 py-0.5 text-[11px] font-medium text-info">
                  <Database size={11} />{s.name ?? s.key}{s.extracted_at ? ` · ${s.extracted_at}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span>{m.time}</span>
          {m.mode && <span className="rounded bg-bg px-1.5 py-0.5 font-bold uppercase tracking-wide ring-1 ring-border">{m.mode === 'llm' ? 'IA' : 'modo offline'}</span>}
          <Link to="/casos" className="ml-auto inline-flex items-center gap-1 font-medium text-primary-dark hover:underline">Levar a um técnico <ArrowRight size={11} /></Link>
        </div>
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

export default function Assistant() {
  const status = useApi<Status>('/assistant/status').data
  const history = useApi<Hist>('/assistant/history')
  const topics = useTopics().data?.topics ?? []
  const [msgs, setMsgs] = useState<Msg[] | null>(null)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgs !== null || !history.data) return
    setMsgs(history.data.map((h, i) => ({ id: `h${i}`, role: h.role, text: h.content, sources: h.sources ?? [], time: hhmm(new Date(h.created_at)) })))
  }, [history.data, msgs])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs?.length, thinking])

  const list = msgs ?? []
  const suggestions = [...topics.slice(0, 2).map((t) => t.question), ...FALLBACK_SUGGESTIONS].filter(Boolean).slice(0, 5)

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || thinking) return
    setError(null)
    setMsgs((m) => [...(m ?? []), { id: `u${Date.now()}`, role: 'user', text: q, sources: [], time: hhmm(new Date()) }])
    setInput('')
    setThinking(true)
    try {
      const r = await apiPost<Reply>('/assistant/chat', { message: q })
      setMsgs((m) => [...(m ?? []), { id: `a${Date.now()}`, role: 'assistant', text: r.answer, sources: r.sources, time: hhmm(new Date()), mode: r.mode, warning: r.warning }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setThinking(false)
    }
  }

  const mic = () => {
    const SR = (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
    const Ctor = SR.SpeechRecognition ?? SR.webkitSpeechRecognition
    if (!Ctor) { setError('Seu navegador não tem reconhecimento de voz. Digite a pergunta.'); return }
    if (listening) return
    const rec = new Ctor()
    rec.lang = 'pt-BR'
    rec.onresult = (ev: any) => setInput(ev.results[0][0].transcript)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    setListening(true)
    rec.start()
  }

  const llm = status?.llm
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Pergunte à IA" subtitle="Converse como com um vizinho que entende de dados. Toda resposta diz de onde veio." />

      <div className="mb-3 flex items-start gap-2 rounded-xl bg-straw-soft px-3 py-2.5 text-sm ring-1 ring-straw/40">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-accent" />
        <span><b>A IA explica dados, não dá receita.</b> Para decidir sobre plantio, adubo ou defensivo, leve o caso a um técnico da assistência pública — é de graça. <Link to="/casos" className="font-semibold text-primary-dark underline">Meus casos</Link></span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-primary/25 bg-primary-soft/60 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white"><Sparkles size={16} /></span>
        <div className="text-sm text-primary-dark">
          {status ? (llm ? <><b>IA ligada</b> ({status.model}) · lê dados oficiais com ferramentas</> : <><b>Modo offline</b> (sem chave) · responde com os mesmos dados oficiais, sem modelo de IA</>) : 'Conectando…'}
        </div>
        <Link to="/contexto" className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">Ver meu contexto <ArrowRight size={14} /></Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="space-y-5">
            {list.length === 0 && !thinking && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Nenhuma conversa ainda. Toque numa sugestão abaixo ou escreva sua pergunta.</p>}
            {list.map((m) => m.role === 'user' ? (
              <div key={m.id} className="flex flex-row-reverse gap-3">
                <Avatar ai={false} />
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white shadow-sm">{m.text}</div>
                  <div className="mt-1 text-right text-[11px] text-muted">{m.time}</div>
                </div>
              </div>
            ) : <AiBubble key={m.id} m={m} />)}
            {thinking && <Thinking />}
            {error && <div role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
            <div ref={endRef} />
          </div>

          <div className="sticky bottom-0 -mx-1 mt-5 bg-gradient-to-t from-bg via-bg to-bg/0 px-1 pb-1 pt-4">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((s) => (
                <button key={s} onClick={() => void send(s)} disabled={thinking} className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink shadow-sm transition hover:border-primary hover:bg-primary-soft disabled:opacity-50">{s}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void send(input) }} className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft">
              <button type="button" onClick={mic} aria-label="Falar a pergunta" aria-pressed={listening}
                className={clsx('relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition', listening ? 'bg-danger text-white' : 'bg-bg text-muted hover:bg-primary-soft hover:text-primary-dark')}>
                <Mic size={18} className="relative" />
              </button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={thinking}
                placeholder={listening ? 'Ouvindo…' : 'Pergunte sobre plantio, clima, produtos…'}
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink outline-none placeholder:text-muted" />
              <Button type="submit" disabled={!input.trim() || thinking}><Send size={15} /> Enviar</Button>
            </form>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <Card title="Como a IA responde">
            <ul className="space-y-3 text-sm text-ink">
              <li className="flex gap-2"><span className="mt-0.5 text-primary">●</span><span>Resposta curta e em palavras simples.</span></li>
              <li className="flex gap-2"><span className="mt-0.5 text-primary">●</span><span>Mostra <b>de onde veio</b> cada dado, com fonte e data.</span></li>
              <li className="flex gap-2"><span className="mt-0.5 text-primary">●</span><span>Não indica produto nem dose: para decidir, <b>leve a um técnico</b>.</span></li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
