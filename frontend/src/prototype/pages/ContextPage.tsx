// "Meu contexto" — o arquivo contexto.md que os agentes leem para filtrar os dados abertos.
import clsx from 'clsx'
import { Download, FileText, Filter, Info, Lock, Pencil, RefreshCcw, Save, ScrollText, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, PageHeader, Textarea } from '../../components/ui'
import { EMPTY_ANSWERS } from '../components/interview/types'
import { buildContextMd } from '../components/interview/context'
import { fromApi, type Onboarding } from '../api/fields'
import { nfmt, useFunnel } from '../api/opendata'
import { useApi } from '../api/resource'
import { Skeleton } from '../components/SourceStatus'
import { MarkdownDoc, RawMarkdown } from '../components/views/Markdown'
import { SourceChip } from '../components/Shell'

/** Cada seção do contexto liga a um filtro aplicado nos dados abertos. */
const FILTER_MAP: { section: string; title: string; filter: string; sources: string[] }[] = [
  { section: 'Perfil', title: 'Perfil', filter: 'Linguagem simples e respostas curtas quando a internet é instável. O crédito e o seguro que você informou ajustam os caminhos mostrados.', sources: ['seguro'] },
  { section: 'Localização', title: 'Localização', filter: 'Zarc só do município da sua propriedade. Previsão do tempo exatamente na coordenada da sede. Drones e seguro do município.', sources: ['zarc', 'clima', 'drones'] },
  { section: 'Propriedade', title: 'Propriedade e culturas', filter: 'Só as culturas, os solos e o manejo dos seus talhões. Satélite sobre a sua região.', sources: ['zarc', 'agrofit', 'satelite'] },
  { section: 'Recursos', title: 'Recursos', filter: 'Se você não tem drone, mostramos o serviço de drone na região. O que você tem de máquina ajusta os avisos de chuva.', sources: ['drones', 'clima'] },
  { section: 'Preocupações', title: 'Preocupações', filter: 'Definem a prioridade dos assuntos: o que mais preocupa vem primeiro.', sources: ['clima', 'zarc', 'agrofit'] },
  { section: 'Objetivos', title: 'Objetivos', filter: 'Os objetivos que você marcou destacam as janelas de plantio e a subvenção do seguro rural.', sources: ['zarc', 'seguro'] },
  { section: 'Filtros aplicados', title: 'Filtros aplicados', filter: 'O resumo técnico que os agentes de fato executam em cada fonte. É aqui que o contexto vira consulta.', sources: ['zarc', 'agrofit', 'clima', 'satelite'] },
]

export default function ContextPage() {
  const onboarding = useApi<Onboarding>('/onboarding')
  if (onboarding.loading) return <div className="mx-auto max-w-6xl space-y-3"><Skeleton className="h-16" /><Skeleton className="h-96" /></div>
  const o = onboarding.data
  if (!o?.answers) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-surface p-6 text-center ring-1 ring-border">
        <h1 className="text-xl font-bold">Seu contexto ainda não existe</h1>
        <p className="mt-1 text-sm text-muted">{onboarding.error ?? 'Ele é escrito a partir da entrevista inicial.'}</p>
        <Link to="/entrevista" className="iso-btn mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-display font-bold text-white">Fazer a entrevista</Link>
      </div>
    )
  }
  const md = buildContextMd({ ...EMPTY_ANSWERS, ...o.answers, fields: o.fields.map(fromApi) })
  return <ContextDoc initial={md} />
}

function ContextDoc({ initial }: { initial: string }) {
  const nav = useNavigate()
  const funnel = useFunnel().data?.steps ?? []
  const [text, setText] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [mode, setMode] = useState<'doc' | 'raw'>('doc')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const docRef = useRef<HTMLDivElement>(null)

  const focusSection = (section: string) => {
    const next = active === section ? null : section
    setActive(next)
    if (next) {
      setMode('doc'); setEditing(false)
      window.setTimeout(() => {
        const el = Array.from(docRef.current?.querySelectorAll<HTMLElement>('[data-sec]') ?? []).find((e) => e.dataset.sec?.startsWith(section))
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'contexto.md'; a.click()
    URL.revokeObjectURL(url)
  }

  const save = () => { setText(draft); setEditing(false); setSaved(true); window.setTimeout(() => setSaved(false), 3000) }
  const bytes = new Blob([text]).size

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Meu contexto"
        subtitle="O arquivo que os agentes de IA leem para saber quem você é e filtrar só o que serve para você."
        actions={<>
          <Button variant="secondary" onClick={() => { setDraft(text); setEditing(true); setMode('doc') }}><Pencil size={15} /> Editar</Button>
          <Button variant="secondary" onClick={() => nav('/entrevista')}><RefreshCcw size={15} /> Refazer entrevista</Button>
          <Button onClick={download}><Download size={15} /> Baixar contexto.md</Button>
        </>}
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-info/25 bg-info-soft/60 p-3 text-sm text-ink">
        <Info size={18} className="mt-0.5 shrink-0 text-info" />
        <p>Na entrevista inicial, o AgroBits escreveu este arquivo com o que você contou. <b>Ele é seu</b>: você pode ler, corrigir e baixar. Quanto mais certo estiver, menos ruído você recebe — {funnel.length ? <>de {nfmt(funnel[0].value)} registros oficiais</> : null}, só {funnel.length ? nfmt(funnel[funnel.length - 1].value) : '…'} viram assuntos para você.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-lg bg-surface p-1 ring-1 ring-border" role="tablist">
              {([['doc', 'Ver como documento', FileText], ['raw', 'Ver arquivo .md', ScrollText]] as const).map(([k, l, Icon]) => (
                <button key={k} role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setEditing(false) }}
                  className={clsx('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition', mode === k ? 'bg-primary text-white' : 'text-muted hover:bg-bg hover:text-ink')}><Icon size={13} /> {l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              {saved && <Badge tone="green">alterações salvas (só nesta tela)</Badge>}
              <span className="font-mono">contexto.md · {(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB</span>
            </div>
          </div>

          {editing ? (
            <Card title="Editando contexto.md" action={<span className="text-xs text-muted">protótipo: a edição vale só enquanto a página está aberta</span>}>
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={26} spellCheck={false} className="font-mono text-[13px] leading-6" />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}><X size={15} /> Cancelar</Button>
                <Button onClick={save}><Save size={15} /> Salvar</Button>
              </div>
            </Card>
          ) : mode === 'doc' ? (
            <div ref={docRef} className="rounded-xl border border-border bg-surface p-3 shadow-sm md:p-5"><MarkdownDoc source={text} active={active} /></div>
          ) : (
            <RawMarkdown source={text} />
          )}
        </div>

        <aside className="space-y-4">
          <Card title={<span className="inline-flex items-center gap-2"><Filter size={15} className="text-primary" /> Como seu contexto filtra os dados</span>}>
            <p className="mb-3 text-xs text-muted">Toque numa seção para vê-la no documento.</p>
            <ul className="space-y-2">
              {FILTER_MAP.map((f) => (
                <li key={f.section}>
                  <button onClick={() => focusSection(f.section)} aria-pressed={active === f.section}
                    className={clsx('w-full rounded-lg border p-2.5 text-left transition', active === f.section ? 'border-primary bg-primary-soft/60' : 'border-border hover:bg-bg')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{f.title}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-primary-dark">→ filtro</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{f.filter}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">{f.sources.map((s) => <SourceChip key={s} k={s} />)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <div className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-xs text-muted shadow-sm">
            <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
            <p><b className="text-ink">Privacidade:</b> este arquivo descreve só a sua propriedade. Não vendemos nem repassamos seus dados.</p>
          </div>
          <Link to="/dados" className="block rounded-xl bg-sidebar p-4 text-sm text-white hover:opacity-95">
            <div className="text-xs uppercase tracking-wide text-white/60">Resultado do filtro</div>
            <div className="mt-1 text-lg font-bold">{funnel.length ? `${nfmt(funnel[0].value)} → ${nfmt(funnel[funnel.length - 1].value)}` : '…'}</div>
            <div className="text-xs text-white/70">Ver o funil completo em Dados abertos →</div>
          </Link>
        </aside>
      </div>
    </div>
  )
}
