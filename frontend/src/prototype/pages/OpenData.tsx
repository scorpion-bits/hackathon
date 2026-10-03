// "Dados abertos" — vitrine das fontes oficiais, funil de relevância, caminho dos dados e ética (D-008/D-009).
import clsx from 'clsx'
import {
  ArrowDown, ArrowRight, Bot, Clock, Database, Eye, EyeOff, Filter, Gauge, Landmark, ListChecks, Lock, MapPin, RefreshCw, ShieldCheck, Sparkles, 
} from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { InfoKind } from '../../components/data'
import { Badge, Button, Card, Modal } from '../../components/ui'
import { SOURCES } from '../mock'
import type { Source } from '../mock'
import { fmtWhen, nfmt, useFunnel, useSources, type SourceInfo } from '../api/opendata'
import { useTopics } from '../api/topics'
import { Skeleton } from '../components/SourceStatus'
import { KIND_META, SOURCE_ICON } from '../components/views/sourceMeta'
import { SAMPLE_TITLE, SourceSample } from '../components/views/SourceSamples'

const fmtInt = nfmt

/* ------------------------------------------------------------------ cabeçalho */
function Hero() {
  const steps = useFunnel().data?.steps ?? []
  const sources = useSources().data
  const total = steps[0]?.value
  const recs = steps[steps.length - 1]?.value
  const checked = (sources ?? []).map((x) => x.checked_at).filter(Boolean).sort().pop()
  const nums = [
    { big: String(SOURCES.length), unit: '', label: 'fontes oficiais', sub: 'MAPA, ANA, Embrapa, NASA, INPE, Open-Meteo', icon: Landmark },
    { big: total != null ? (total / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '…', unit: 'milhões', label: 'registros analisados', sub: total != null ? `${fmtInt(total)} linhas lidas por máquina` : 'carregando…', icon: Database },
    { big: recs != null ? fmtInt(recs) : '…', unit: '', label: 'assuntos hoje', sub: 'só o que serve para a sua propriedade', icon: Sparkles },
  ]
  return (
    <section className="relative overflow-hidden rounded-2xl bg-sidebar p-6 text-white shadow-sm md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-info/20 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
          <RefreshCw size={12} /> {checked ? `bases do MAPA conferidas no portal em ${fmtWhen(checked)}` : 'conferência no portal do MAPA ainda não registrada'}
        </div>
        <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-tight tracking-tight md:text-4xl">As fontes oficiais que trabalham para você</h1>
        <p className="mt-2 hidden max-w-2xl text-sm text-white/70 sm:block md:text-base">
          O governo publica milhões de linhas de dados abertos, espalhadas em sites e formatos diferentes. O AgroBits lê tudo isso todo dia,
          separa o que importa para <b className="text-white">a sua propriedade</b> e entrega em linguagem simples.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
          {nums.map((n) => (
            <div key={n.label} className="rounded-xl bg-white/10 p-2.5 ring-1 ring-white/10 backdrop-blur sm:p-4">
              <div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-white/60 sm:text-xs">{n.label}</span><n.icon size={16} className="hidden text-emerald-300 sm:block" /></div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-2xl font-extrabold tracking-tight sm:text-4xl">{n.big}{n.unit && <span className="text-xs font-bold text-white/80 sm:text-lg">{n.unit}</span>}</div>
              <div className="mt-1 hidden text-xs text-white/60 sm:block">{n.sub}</div>
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
  { bg: '#4F9A6C', fg: '#FFFFFF', icon: MapPin, tag: 'Filtro · onde você está e o que planta' },
  { bg: '#1F5C39', fg: '#FFFFFF', icon: Sparkles, tag: 'Cruzamento · previsão do tempo + seu contexto' },
]

function Funnel() {
  const res = useFunnel()
  const steps = res.data?.steps ?? []
  if (res.loading) return <Skeleton className="h-72" />
  if (!steps.length) return <Card title="Do volume bruto ao que importa para você"><p className="text-sm text-muted">{res.error ?? 'Termine a entrevista para ver o funil da sua propriedade.'}</p></Card>
  const vals = steps.map((f) => f.value)
  const widths = [100, 46, 24, 14]
  return (
    <Card
      title={<span className="inline-flex items-center gap-2"><Filter size={16} className="text-primary" /> Do volume bruto ao que importa para você</span>}
      action={<Link to="/contexto" className="text-xs font-medium text-primary hover:underline">filtros vêm do seu contexto.md →</Link>}
    >
      <p className="mb-4 text-sm text-muted">
        Você não precisa ler {fmtInt(vals[0])} linhas. O AgroBits usa o que você contou na entrevista para filtrar,
        e entrega <b className="text-ink">{fmtInt(vals[vals.length - 1])} {vals[vals.length - 1] === 1 ? 'assunto' : 'assuntos'}</b>.
      </p>
      <div>
        {steps.map((f, i) => {
          const t = widths[i], b = widths[i + 1]
          const clip = `polygon(${(100 - t) / 2}% 0, ${(100 + t) / 2}% 0, ${(100 + b) / 2}% 100%, ${(100 - b) / 2}% 100%)`
          const S = STAGE[i]
          const ratio = i > 0 && vals[i] > 0 ? Math.round(vals[i - 1] / vals[i]) : null
          return (
            <div key={f.label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative mb-[3px] h-[92px] sm:w-[46%] sm:shrink-0" aria-label={`${f.label}: ${fmtInt(f.value)}`}>
                <div className="absolute inset-0" style={{ background: S.bg, clipPath: clip }} />
                <div className="absolute inset-0 grid place-items-center text-center" style={{ color: S.fg }}>
                  <div className="text-[26px] font-extrabold leading-none tracking-tight">{fmtInt(f.value)}</div>
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
function SourceCard({ s, info, relevant, onSample }: { s: Source; info?: SourceInfo; relevant: number; onSample: () => void }) {
  const volume = !s.apiKey ? 'ainda não integrada' : info?.records != null ? `${fmtInt(info.records)} ${s.key === 'seguro' ? 'apólices' : s.key === 'drones' ? 'registros' : 'linhas'}` : 'consulta ao vivo'
  const updated = !s.apiKey ? '—' : info?.checked_at ? `conferido ${fmtWhen(info.checked_at)}` : info?.records != null ? `extraído em ${info.extracted_at}` : 'a cada consulta'
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
          <div><dt className="text-muted">Volume</dt><dd className="font-semibold text-ink">{volume}</dd></div>
          <div><dt className="text-muted">Atualização</dt><dd className="font-semibold text-ink">{updated}</dd></div>
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-ink"><span className="font-semibold">O que te conta: </span>{s.whatItTells}</p>
      </div>
      <footer className="flex items-center justify-between gap-2 border-t border-border bg-bg/60 px-4 py-3">
        {relevant > 0
          ? <div className="flex items-baseline gap-1.5"><span className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{relevant}</span><span className="text-xs text-muted">{relevant === 1 ? 'item relevante' : 'itens relevantes'}<br />para você</span></div>
          : <div className="text-xs text-muted">Nada relevante<br />para você agora</div>}
        <Button size="sm" variant="secondary" onClick={onSample}><Eye size={14} /> Ver dados</Button>
      </footer>
    </article>
  )
}

const FILTERS = [['todas', 'Todas'], ['arquivo', 'Arquivos'], ['api', 'APIs'], ['mapa', 'Mapas']] as const

function Sources() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>('todas')
  const [open, setOpen] = useState<string | null>(null)
  const info = useSources().data ?? []
  const topics = useTopics().data?.topics ?? []
  const relevantOf = (s: Source) => s.apiKey ? topics.filter((t) => t.sources.some((x) => x.key === s.apiKey)).length : 0
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
        {list.map((s) => <SourceCard key={s.key} s={s} info={info.find((x) => x.key === s.apiKey)} relevant={relevantOf(s)} onSample={() => setOpen(s.key)} />)}
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
  { icon: RefreshCw, title: 'Atualização automática', text: 'O AgroBits confere o portal do MAPA e atualiza as bases sozinho (ou com ./iniciar.sh sincronizar); clima e satélite são consultados na hora.', tone: '#7C5CBF' },
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
      <p className="mt-3 text-xs text-muted">Sem internet? O app mostra a última resposta real guardada e avisa a data dela; sem nenhuma guardada, diz que a fonte está indisponível.</p>
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
      <p className="pb-4 text-center text-xs text-muted">Todos os números desta tela vêm das bases oficiais locais e das consultas ao vivo; nada é preenchido com exemplo.</p>
    </div>
  )
}
