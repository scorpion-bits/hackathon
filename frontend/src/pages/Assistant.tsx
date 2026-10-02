import clsx from 'clsx'
import { AlertCircle, Bot, ClipboardCheck, Mic, MicOff, Send, ShieldCheck, Sparkles, Trash2, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SourceBadge } from '../components/data'
import { RegisterModal } from '../components/RegisterModal'
import { Badge, Button, ErrorBox } from '../components/ui'
import { api, type Draft, type Source } from '../lib/api'
import { dateBR, EVENT_LABEL, num } from '../lib/format'
import { useApi } from '../lib/hooks'

// ---- Web Speech API (tipos locais; não fazem parte do lib.dom padrão) ----
type SpeechResultLike = { 0: { transcript: string }; isFinal: boolean; length: number }
type SpeechEventLike = { resultIndex: number; results: ArrayLike<SpeechResultLike> }
type RecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean
  onresult: ((e: SpeechEventLike) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type RecognitionCtor = new () => RecognitionLike
const getRecognitionCtor = (): RecognitionCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

type Msg = {
  id: string; role: 'user' | 'assistant'; content: string; sources: Source[]
  mode?: 'llm' | 'offline'; warning?: string; draft?: Draft | null; contextLabel?: string; error?: boolean
}

const SUGGESTIONS = [
  'Quero plantar milho no Talhão 2 semana que vem. Tenho semente suficiente?',
  'Quanto gastei com fertilizante nesta safra?',
  'Como está o Talhão 3?',
  'Quais produtos estão perto de vencer?',
  'Vai chover nos próximos dias?',
  'Quantos drones agrícolas tem na minha região?',
  'Plantei milho no talhão 2 hoje usando 40 kg de semente',
]

let seq = 0
const uid = () => `m${Date.now()}-${seq++}`

/** Texto da resposta: quebras preservadas; linhas com "•" viram lista. */
function AnswerText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((l, i) => {
        const t = l.trim()
        if (t.startsWith('•')) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-primary">•</span>
              <span className="whitespace-pre-wrap">{t.replace(/^•\s*/, '')}</span>
            </div>
          )
        }
        return t ? <p key={i} className="whitespace-pre-wrap">{l}</p> : <div key={i} className="h-1" />
      })}
    </div>
  )
}

function contextLabelOf(ctx: Record<string, unknown> | undefined, fieldName: (id: number) => string | undefined): string | undefined {
  if (!ctx) return undefined
  const parts: string[] = []
  const alert = ctx.alert as { title?: string } | undefined
  if (alert?.title) parts.push(`alerta "${alert.title}"`)
  if (typeof ctx.field === 'string') parts.push(`talhão ${ctx.field}`)
  const ids = ctx.field_ids as number[] | undefined
  if (ids?.length) {
    const names = ids.map(fieldName).filter(Boolean)
    if (names.length) parts.push(names.join(', '))
  }
  return parts.length ? parts.join(' / ') : 'tela de origem'
}

function DraftCard({ draft, onReview }: { draft: Draft; onReview: () => void }) {
  const rows: [string, string][] = [
    ['Tipo', EVENT_LABEL[draft.kind] ?? draft.kind],
    ['Data', dateBR(draft.date)],
    ['Talhão', draft.field_name ?? '—'],
    ['Produto', draft.item_name ?? '—'],
    ['Quantidade', draft.quantity != null ? `${num(draft.quantity, 2)} ${draft.unit ?? ''}`.trim() : '—'],
  ]
  if (draft.crop) rows.splice(3, 0, ['Cultura', draft.crop])
  return (
    <div className="mt-3 rounded-lg border border-primary/30 bg-primary-soft/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark"><ClipboardCheck size={16} /> Quer registrar isto?</div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="text-muted">{k}</dt><dd className="font-medium text-ink">{v}</dd></div>
        ))}
      </dl>
      {draft.missing.length > 0 && (
        <div className="mt-2 rounded-md bg-accent-soft px-2 py-1 text-xs text-accent">Faltando: {draft.missing.join(', ')}</div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onReview}>Revisar e confirmar</Button>
        <span className="text-[11px] text-muted">Nada é gravado até você confirmar.</span>
      </div>
    </div>
  )
}

function SourcesCard({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-bg p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted"><ShieldCheck size={13} /> Por que estou dizendo isso</div>
      <div className="flex flex-wrap gap-1.5">{sources.map((s) => <SourceBadge key={s.key} source={s} />)}</div>
    </div>
  )
}

function Bubble({ m, onReview, canSpeak }: { m: Msg; onReview: (d: Draft) => void; canSpeak: boolean }) {
  const speak = () => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(m.content.replace(/•/g, ''))
    u.lang = 'pt-BR'
    window.speechSynthesis.speak(u)
  }
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-white">
          {m.contextLabel && (
            <div className="mb-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]"><Sparkles size={11} /> <span className="truncate">Contexto: {m.contextLabel}</span></div>
          )}
          <p className="whitespace-pre-wrap text-sm">{m.content}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark"><Bot size={17} /></span>
      <div className="min-w-0 max-w-[90%] rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 shadow-sm">
        {m.error ? <div className="flex items-start gap-2 text-sm text-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" /> {m.content}</div> : <AnswerText text={m.content} />}
        {m.warning && <div className="mt-2 rounded-md bg-accent-soft px-2 py-1 text-xs text-accent">{m.warning}</div>}
        {m.draft && <DraftCard draft={m.draft} onReview={() => onReview(m.draft!)} />}
        {m.sources.length > 0 && <SourcesCard sources={m.sources} />}
        {!m.error && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
            {m.mode && <span>{m.mode === 'llm' ? 'IA' : 'modo offline'}</span>}
            {canSpeak && <button onClick={speak} className="inline-flex items-center gap-1 hover:text-ink"><Volume2 size={12} /> Ouvir resposta</button>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Assistant() {
  const status = useApi(api.assistantStatus)
  const fields = useApi(api.fields)
  const [messages, setMessages] = useState<Msg[]>([])
  const [ready, setReady] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draftOpen, setDraftOpen] = useState<Draft | null>(null)
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<RecognitionLike | null>(null)
  const sentFromState = useRef(false)
  const fieldsRef = useRef(fields.data)
  fieldsRef.current = fields.data

  const speechSupported = useMemo(() => typeof window !== 'undefined' && getRecognitionCtor() !== null, [])
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

  // histórico
  useEffect(() => {
    let alive = true
    api.chatHistory()
      .then((h) => { if (alive) setMessages(h.map((x) => ({ id: uid(), role: x.role, content: x.content, sources: x.sources ?? [] }))) })
      .catch((e: Error) => { if (alive) setLoadError(e.message) })
      .finally(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])
  useEffect(() => () => { recRef.current?.abort(); if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  const send = useCallback(async (text: string, context?: Record<string, unknown>) => {
    const message = text.trim()
    if (!message || busy) return
    const fieldName = (id: number) => fieldsRef.current?.find((f) => f.id === id)?.name
    setMessages((m) => [...m, { id: uid(), role: 'user', content: message, sources: [], contextLabel: contextLabelOf(context, fieldName) }])
    setInput('')
    setBusy(true)
    try {
      const r = await api.chat(message, context)
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: r.answer, sources: r.sources ?? [], mode: r.mode, warning: r.warning, draft: r.draft }])
    } catch (e) {
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: `Não consegui responder agora: ${(e as Error).message}`, sources: [], error: true }])
    } finally {
      setBusy(false)
    }
  }, [busy])

  // pergunta vinda de outra tela (botão "Perguntar à IA"): envia uma única vez
  useEffect(() => {
    const st = location.state as { question?: string; context?: Record<string, unknown> } | null
    if (!ready || !st?.question || sentFromState.current) return
    sentFromState.current = true
    navigate(location.pathname, { replace: true, state: null })
    send(st.question, st.context)
  }, [ready, location, navigate, send])

  function toggleMic() {
    if (listening) { recRef.current?.stop(); return }
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    setMicError(null)
    const rec = new Ctor()
    rec.lang = 'pt-BR'
    rec.interimResults = true
    rec.continuous = false
    const base = input ? `${input.trim()} ` : ''
    rec.onresult = (e) => {
      let t = ''
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
      setInput(base + t)
    }
    rec.onerror = (e) => {
      setMicError(e.error === 'not-allowed' ? 'Permita o uso do microfone no navegador para falar com o assistente.' : e.error === 'no-speech' ? 'Não ouvi nada. Tente de novo.' : 'Não consegui ouvir. Tente de novo ou digite.')
    }
    rec.onend = () => { setListening(false); recRef.current = null }
    recRef.current = rec
    try { rec.start(); setListening(true) } catch { setListening(false) }
  }

  async function clear() {
    if (!window.confirm('Apagar toda a conversa?')) return
    try { await api.clearChat(); setMessages([]) } catch (e) { setLoadError((e as Error).message) }
  }

  const llm = status.data?.llm
  const empty = ready && messages.length === 0 && !busy

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] min-h-[28rem] max-w-4xl flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink"><Bot size={24} className="text-primary" /> Assistente IA</h1>
          <p className="mt-0.5 text-sm text-muted">
            {status.data == null ? 'Verificando…' : llm
              ? <><Badge tone="green">Conectado a modelo de IA</Badge></>
              : <><Badge tone="amber">Modo offline</Badge> <span className="ml-1">respostas a partir dos dados, sem modelo de linguagem</span></>}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={clear} disabled={messages.length === 0}><Trash2 size={14} /> Limpar conversa</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-bg/60 p-3 md:p-4">
        {loadError && <ErrorBox error={loadError} />}
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary-dark"><Bot size={28} /></span>
            <div>
              <h2 className="text-lg font-semibold">Como posso ajudar na sua propriedade?</h2>
              <p className="mt-1 text-sm text-muted">Pergunte sobre plantio, estoque, custos, clima ou alertas. Você também pode contar o que fez e eu preparo o registro.</p>
            </div>
            <div className="flex max-w-2xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-primary/30 bg-surface px-3 py-1.5 text-left text-xs font-medium text-primary-dark hover:bg-primary-soft">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => <Bubble key={m.id} m={m} onReview={setDraftOpen} canSpeak={canSpeak} />)}
            {busy && (
              <div className="flex gap-2.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark"><Bot size={17} /></span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-sm text-muted shadow-sm">
                  pensando
                  <span className="inline-flex gap-0.5"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" /></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {!empty && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} disabled={busy} onClick={() => send(s)} className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted hover:border-primary/40 hover:text-primary-dark disabled:opacity-50">{s}</button>
          ))}
        </div>
      )}

      <div className="mt-2">
        {listening && <div className="mb-1 flex items-center gap-2 text-xs font-medium text-danger"><span className="h-2 w-2 animate-pulse rounded-full bg-danger" /> ouvindo… fale agora</div>}
        {micError && <div className="mb-1 text-xs text-danger">{micError}</div>}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input) } }}
            rows={2}
            placeholder="Escreva sua pergunta ou conte o que fez no campo… (Enter envia, Shift+Enter pula linha)"
            className="min-h-[3rem] flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
          {speechSupported && (
            <button
              onClick={toggleMic}
              aria-label={listening ? 'Parar de ouvir' : 'Falar'}
              title={listening ? 'Parar de ouvir' : 'Falar a pergunta'}
              className={clsx('grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition', listening ? 'animate-pulse border-danger bg-danger text-white' : 'border-border bg-surface text-muted hover:text-ink')}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <Button onClick={() => send(input)} disabled={busy || !input.trim()} className="h-12 rounded-xl px-5"><Send size={16} /> Enviar</Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          A IA usa seus registros e dados oficiais. Não substitui engenheiro agrônomo.
          {!speechSupported && ' Voz indisponível neste navegador (use o Chrome ou o Edge).'}
        </p>
      </div>

      <RegisterModal
        open={!!draftOpen} draft={draftOpen} onClose={() => setDraftOpen(null)}
        onDone={() => setMessages((ms) => ms.map((m) => (m.draft && m.draft === draftOpen ? { ...m, draft: null, content: `${m.content}\n✅ Registro confirmado e gravado no caderno de campo.` } : m)))}
      />
    </div>
  )
}
