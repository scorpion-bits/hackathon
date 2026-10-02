// "Dados abertos" — vitrine das fontes oficiais, funil de relevância, caminho dos dados e ética (D-008/D-009).
import clsx from 'clsx'
import {
  ArrowDown, ArrowRight, Bot, Clock, Database, Eye, EyeOff, Filter, Gauge, Landmark, ListChecks, Lock, MapPin, RefreshCw, ShieldCheck, Sparkles, Wheat,
} from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { InfoKind } from '../../components/data'
import { Badge, Button, Card, Modal } from '../../components/ui'
import { FUNNEL, INSIGHTS, SOURCES } from '../mock'
import type { Source } from '../mock'
import { KIND_META, SOURCE_ICON, parseBR } from '../components/views/sourceMeta'
import { SAMPLE_TITLE, SourceSample } from '../components/views/SourceSamples'

const fmtInt = (n: number) => n.toLocaleString('pt-BR')

/* ------------------------------------------------------------------ cabeçalho */
function Hero() {
  const total = parseBR(FUNNEL[0].value)
  const millions = (total / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const recs = FUNNEL[FUNNEL.length - 1].value
  const nums = [
    { big: String(SOURCES.length), unit: '', label: 'fontes oficiais', sub: 'MAPA, ANA, Embrapa, NASA, INPE, Open-Meteo', icon: Landmark },
    { big: millions, unit: 'milhões', label: 'registros analisados', sub: `${FUNNEL[0].value} linhas lidas por máquina`, icon: Database },
    { big: recs, unit: '', label: 'recomendações hoje', sub: 'só o que serve para o seu sítio', icon: Sparkles },
  ]
  return (
    <section className="relative overflow-hidden rounded-2xl bg-sidebar p-6 text-white shadow-sm md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-info/20 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
          <RefreshCw size={12} /> última varredura: hoje, 06:00
        </div>
        <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-tight tracking-tight md:text-4xl">As fontes oficiais que trabalham para você</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
          O governo publica milhões de linhas de dados abertos, espalhadas em sites e formatos diferentes. O AgroIA lê tudo isso todo dia,
          separa o que importa para <b className="text-white">a sua propriedade</b> e entrega em linguagem simples.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {nums.map((n) => (
            <div key={n.label} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <div className="flex items-center justify-between"><span className="text-xs font-medium uppercase tracking-wide text-white/60">{n.label}</span><n.icon size={16} className="text-emerald-300" /></div>
              <div className="mt-1 flex items-baseline gap-1.5 text-4xl font-extrabold tracking-tight">{n.big}{n.unit && <span className="text-lg font-bold text-white/80">{n.unit}</span>}</div>
              <div className="mt-1 text-xs text-white/60">{n.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ funil */
const STAGE = [
  { bg: '#CFE0D3', fg: '#1C2B21', icon: Database, tag: 'Tudo o que as fontes publicam' },
  { bg: '#9CC9AB', fg: '#1C2B21', icon: MapPin, tag: 'Filtro 1 · onde você está e o que planta' },
  { bg: '#4F9A6C', fg: '#FFFFFF', icon: Wheat, tag: 'Filtro 2 · seu solo e seu manejo' },
  { bg: '#1F5C39', fg: '#FFFFFF', icon: Sparkles, tag: 'Cruzamento · previsão do tempo + seu contexto' },
]

function Funnel() {
  const vals = FUNNEL.map((f) => parseBR(f.value))
  const widths = [100, 66, 42, 24, 16]
  return (
    <Card
      title={<span className="inline-flex items-center gap-2"><Filter size={16} className="text-primary" /> Do volume bruto ao que importa para você</span>}
      action={<Link to="/prototipo/contexto" className="text-xs font-medium text-primary hover:underline">filtros vêm do seu contexto.md →</Link>}
    >
      <p className="mb-4 text-sm text-muted">
        Você não precisa ler {fmtInt(vals[0])} linhas. O AgroIA usa o que você contou na entrevista para filtrar,
        e entrega <b className="text-ink">{FUNNEL[3].value}</b>.
      </p>
      <div>
        {FUNNEL.map((f, i) => {
          const t = widths[i], b = widths[i + 1]
          const clip = `polygon(${(100 - t) / 2}% 0, ${(100 + t) / 2}% 0, ${(100 + b) / 2}% 100%, ${(100 - b) / 2}% 100%)`
          const S = STAGE[i]
          const ratio = i > 0 ? Math.round(vals[i - 1] / vals[i]) : null
          return (
            <div key={f.label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative mb-[3px] h-[92px] sm:w-[46%] sm:shrink-0" aria-label={`${f.label}: ${f.value}`}>
                <div className="absolute inset-0" style={{ background: S.bg, clipPath: clip }} />
                <div className="absolute inset-0 grid place-items-center text-center" style={{ color: S.fg }}>
                  <div className="text-[26px] font-extrabold leading-none tracking-tight">{f.value}</div>
                </div>
              </div>
              <div className="min-w-0 flex-1 pb-3 sm:pb-0">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-border"><S.icon size={11} />{S.tag}</div>
                <div className="text-sm font-semibold text-ink">{f.label}</div>
                <div className="text-xs text-muted">{f.hint}</div>
                {ratio != null && ratio > 1 && <div className="mt-1 text-[11px] font-medium text-primary-dark">só 1 em cada {fmtInt(ratio)} registros da etapa anterior segue adiante</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ cartões de fontes */
function SourceCard({ s, onSample }: { s: Source; onSample: () => void }) {
  const Icon = SOURCE_ICON[s.key] ?? Database
  const kind = KIND_META[s.kind]
  const KindIcon = kind.icon
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:shadow-md">
      <div className="h-1" style={{ background: s.color }} />
      <div className="flex-1 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${s.color}1A`, color: s.color }}><Icon size={22} /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-snug text-ink">{s.name}</h3>
            <p className="mt-0.5 text-xs text-muted">{s.agency}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="gray" className="gap-1"><KindIcon size={11} />{kind.label}</Badge>
          <Badge tone={s.freshness === 'tempo real' ? 'green' : 'gray'} className="gap-1"><Clock size={11} />{s.freshness}</Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div><dt className="text-muted">Volume</dt><dd className="font-semibold text-ink">{s.records}</dd></div>
          <div><dt className="text-muted">Atualização</dt><dd className="font-semibold text-ink">{s.updated}</dd></div>
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-ink"><span className="font-semibold">O que te conta: </span>{s.whatItTells}</p>
      </div>
      <footer className="flex items-center justify-between gap-2 border-t border-border bg-bg/60 px-4 py-3">
        {s.relevantForYou > 0
          ? <div className="flex items-baseline gap-1.5"><span className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.relevantForYou}</span><span className="text-xs text-muted">{s.relevantForYou === 1 ? 'item relevante' : 'itens relevantes'}<br />para você</span></div>
          : <div className="text-xs text-muted">Nada relevante<br />para você agora</div>}
        <Button size="sm" variant="secondary" onClick={onSample}><Eye size={14} /> Ver exemplo</Button>
      </footer>
    </article>
  )
}

const FILTERS = [['todas', 'Todas'], ['arquivo', 'Arquivos'], ['api', 'APIs'], ['mapa', 'Mapas']] as const

function Sources() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>('todas')
  const [open, setOpen] = useState<string | null>(null)
  const list = SOURCES.filter((s) => filter === 'todas' || s.kind === filter)
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-ink">As {SOURCES.length} fontes que monitoramos</h2>
          <p className="text-sm text-muted">Cada cartão mostra de onde vem o dado, o tamanho dele e o que ele muda na sua decisão.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface p-1 ring-1 ring-border" role="tablist">
          {FILTERS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={clsx('rounded-md px-3 py-1 text-xs font-medium transition', filter === k ? 'bg-primary text-white' : 'text-muted hover:bg-bg hover:text-ink')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => <SourceCard key={s.key} s={s} onSample={() => setOpen(s.key)} />)}
      </div>
      <Modal open={!!open} title={open ? SAMPLE_TITLE[open] : ''} onClose={() => setOpen(null)} wide>
        {open && <SourceSample k={open} />}
      </Modal>
    </section>
  )
}

/* ------------------------------------------------------------------ caminho dos dados */
const STEPS: { icon: typeof Landmark; title: string; text: string; tone: string }[] = [
  { icon: Landmark, title: 'Fontes oficiais', text: 'APIs e arquivos abertos do MAPA, ANA, Embrapa, NASA, INPE e Open-Meteo.', tone: '#2F6E91' },
  { icon: RefreshCw, title: 'Atualização automática', text: 'Todo dia de manhã (06:00) o AgroIA busca as novidades sozinho.', tone: '#7C5CBF' },
  { icon: Filter, title: 'Filtro pelo seu contexto', text: 'O arquivo contexto.md diz onde você está, o que planta e o que te preocupa.', tone: '#9A6516' },
  { icon: Bot, title: 'Agentes de IA interpretam', text: 'Cruzam os dados filtrados com a previsão do tempo e escrevem em palavras simples.', tone: '#2E7D4F' },
  { icon: ListChecks, title: 'Recomendações com fonte e data', text: 'Cada sugestão diz de onde veio, quando foi atualizada e o quanto é incerta.', tone: '#1F5C39' },
]

function Pipeline() {
  return (
    <Card title="Como os dados chegam até você">
      <ol className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-stretch lg:gap-0">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col items-center gap-2 lg:flex-1 lg:flex-row lg:gap-0">
            <div className="relative h-full w-full rounded-xl border border-border bg-bg p-3.5 lg:flex-1">
              <span className="absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
              <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `${s.tone}1F`, color: s.tone }}><s.icon size={20} /></span>
              <div className="mt-2 text-sm font-semibold leading-snug text-ink">{s.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{s.text}</p>
            </div>
            {i < STEPS.length - 1 && (
              <>
                <ArrowRight className="hidden shrink-0 text-muted lg:mx-1.5 lg:block" size={18} />
                <ArrowDown className="shrink-0 text-muted lg:hidden" size={18} />
              </>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">Sem internet? O app mostra a última cópia guardada e avisa a data dela.</p>
    </Card>
  )
}

/* ------------------------------------------------------------------ ética */
const ETHICS: { icon: typeof Lock; title: string; text: ReactNode }[] = [
  { icon: ShieldCheck, title: 'Citamos fonte e data', text: 'Toda recomendação mostra o órgão que publicou o dado e quando ele foi atualizado. Você pode conferir.' },
  { icon: Gauge, title: 'Mostramos a incerteza', text: 'Previsão não é promessa. Separamos o que é dado oficial, previsão, estimativa e o que você mesmo informou.' },
  { icon: EyeOff, title: 'Dados pessoais só agregados', text: 'Algumas bases têm nome e CPF. Usamos só totais por município e escondemos grupos com menos de 3 registros.' },
  { icon: Lock, title: 'Seus dados não são vendidos', text: 'O que você conta na entrevista fica no seu contexto.md. Não vendemos nem repassamos para terceiros.' },
]

function Ethics() {
  return (
    <section>
      <h2 className="mb-1 text-lg font-bold text-ink">Ética e privacidade</h2>
      <p className="mb-3 text-sm text-muted">Dado aberto não é dado sem cuidado. Estas regras valem para todas as telas.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ETHICS.map((e) => (
          <div key={e.title} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary-dark"><e.icon size={20} /></span>
            <h3 className="mt-3 text-sm font-semibold text-ink">{e.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{e.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3 text-xs text-muted shadow-sm">
        <span className="font-medium text-ink">Como você reconhece cada tipo de informação:</span>
        {(['oficial', 'previsao', 'declarado', 'estimativa', 'simulado'] as const).map((k) => <InfoKind key={k} kind={k} />)}
      </div>
    </section>
  )
}

export default function OpenData() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Hero />
      <Funnel />
      <Sources />
      <Pipeline />
      <Ethics />
      <p className="pb-4 text-center text-xs text-muted">{INSIGHTS.length} recomendações geradas hoje · números “dado oficial” vêm das bases oficiais baixadas em 02/10/2026.</p>
    </div>
  )
}
