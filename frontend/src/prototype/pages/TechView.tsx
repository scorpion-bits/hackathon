// "Caso recebido — visão do técnico": o que a assistência técnica pública recebe quando o produtor envia um caso.
// Só leitura. Na demonstração quem abre é a própria conta (D-019); o órgão é exemplo de integração, sem convênio.
import { ArrowLeft, CalendarClock, CloudRain, FileText, Landmark, MapPin, MessageSquareText, ShieldCheck, Sprout } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RiskStrip } from '../../components/data'
import { useApi } from '../api/resource'
import type { CaseRecord, Expert } from '../api/cases'
import { DemoSeal } from '../components/Shell'
import { Skeleton } from '../components/SourceStatus'
import { MiniFieldMap } from '../components/views/MiniFieldMap'

type Evidence = { type?: string; series?: number[]; today_decendio?: number; crop?: string; safra?: string; window?: { start: string; end: string; risk: number } }
type Brief = {
  case: CaseRecord & { snapshot: CaseRecord['snapshot'] & { summary?: string; why?: string[]; evidence?: Evidence | null; generated_at?: string } }
  expert: Expert | null
  producer: { name: string; is_demo: boolean }
  farm: { name: string; municipality: string; uf: string; lat: number; lon: number } | null
  field: { name: string; crop: string | null; area_ha: number; soil: string | null; irrigation: string; poly: number[][]; color: string | null } | null
  weather: { available: boolean; fetched_at?: string; rain_7d_mm: number | null; peak: { date: string; mm: number } | null } | null
  rain_normal: { available: boolean; fetched_at?: string; observed_mm?: number; normal_mm?: number; label?: string; period?: { start: string; end: string } } | null
}

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '')
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const nf = (n: number, d = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: d })

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface p-4 ring-1 ring-border md:p-5">
      <h2 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">{icon} {title}</h2>
      {children}
    </section>
  )
}

export default function TechView() {
  const { id } = useParams()
  const r = useApi<Brief>(`/cases/${id}/brief`)
  if (r.loading && !r.data) return <div className="mx-auto max-w-3xl space-y-3 p-4"><Skeleton className="h-24" /><Skeleton className="h-48" /></div>
  if (!r.data) return <p className="p-6 text-sm text-red-700">Não foi possível abrir o caso: {r.error}</p>
  const { case: c, expert, producer, farm, field, weather, rain_normal: rn } = r.data
  const s = c.snapshot
  const ev = s.evidence
  return (
    <div className="mx-auto max-w-3xl space-y-3 p-4 pb-10 md:p-6">
      <Link to="/casos" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Meus casos</Link>

      {/* cabeçalho do painel do órgão */}
      <header className="iso-card overflow-hidden bg-sidebar text-white">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 text-[11px] font-semibold uppercase tracking-wide text-white/70 md:px-5">
          <Landmark size={14} /> {expert?.name ?? c.expert_id} · caixa de entrada
          {producer.is_demo && <DemoSeal className="ml-auto" />}
        </div>
        <div className="px-4 pb-4 pt-2 md:px-5">
          <p className="text-xs text-white/70">Caso {c.protocol} · recebido {when(c.created_at)} · responder por {c.channel}</p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight md:text-3xl">{c.question}</h1>
          {s.summary && <p className="mt-2 text-[15px] leading-relaxed text-white/85">{s.summary}</p>}
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Block icon={<MapPin size={14} />} title="Quem e onde">
          <p className="font-semibold text-ink">{producer.name}</p>
          {farm && <p className="text-sm text-muted">{farm.name} · {farm.municipality}/{farm.uf} · {nf(farm.lat, 4)}, {nf(farm.lon, 4)}</p>}
          {field && (
            <>
              <MiniFieldMap className="mt-3 h-[150px] rounded-xl" height={150} fields={[{ id: 1, name: field.name, color: field.color ?? '#2E7D4F', poly: field.poly }]} scaleBar />
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted">Talhão</dt><dd className="font-medium text-ink">{field.name} · {nf(field.area_ha, 2)} ha</dd>
                <dt className="text-muted">Cultura</dt><dd className="font-medium text-ink">{field.crop ?? '—'}</dd>
                <dt className="text-muted">Solo</dt><dd className="font-medium text-ink">{field.soil ?? '—'} <span className="text-xs text-muted">(declarado)</span></dd>
                <dt className="text-muted">Manejo</dt><dd className="font-medium text-ink">{field.irrigation}</dd>
              </dl>
            </>
          )}
        </Block>

        <Block icon={<CloudRain size={14} />} title="Clima agora (dado real)">
          {weather?.available && weather.rain_7d_mm != null ? (
            <p className="text-sm text-ink"><b className="font-display text-2xl">{nf(weather.rain_7d_mm)} mm</b> previstos em 7 dias
              {weather.peak && weather.peak.mm >= 1 && <> · pico de {nf(weather.peak.mm)} mm em {ddmm(weather.peak.date)}</>}
              <span className="block text-xs text-muted">Open-Meteo · consultado {when(weather.fetched_at)}</span></p>
          ) : <p className="text-sm text-muted">Previsão indisponível agora.</p>}
          {rn?.available && rn.observed_mm != null && rn.normal_mm != null ? (
            <p className="mt-3 text-sm text-ink">Últimos 30 dias: <b>{nf(rn.observed_mm)} mm</b> × normal {nf(rn.normal_mm)} mm — {rn.label}
              <span className="block text-xs text-muted">NASA POWER · {rn.period?.start} a {rn.period?.end}</span></p>
          ) : <p className="mt-3 text-sm text-muted">Chuva dos últimos 30 dias indisponível agora.</p>}
        </Block>
      </div>

      <Block icon={<Sprout size={14} />} title="O que os dados oficiais mostram (no envio)">
        {ev?.series && ev.series.length === 36 && (
          <div className="mb-3">
            <p className="mb-1.5 text-sm font-medium text-ink">Risco Zarc de perda pelo clima por data de plantio{ev.crop ? ` · ${ev.crop}` : ''}{ev.safra ? ` · safra ${ev.safra}` : ''}</p>
            <RiskStrip zarc={{ available: true, risk: ev.series, today_decendio: ev.today_decendio } as Parameters<typeof RiskStrip>[0]['zarc']} />
            {ev.window && <p className="mt-1.5 text-xs text-muted">Janela de menor risco ({ev.window.risk}%): {ddmm(ev.window.start)} a {ddmm(ev.window.end)}</p>}
          </div>
        )}
        {!!s.why?.length && <ul className="list-disc space-y-1 pl-5 text-sm text-ink">{s.why.map((w) => <li key={w}>{w}</li>)}</ul>}
        {!ev && !s.why?.length && <p className="text-sm text-muted">Caso aberto pelo produtor com observação própria (sem regra de dados).</p>}
      </Block>

      <Block icon={<MessageSquareText size={14} />} title="O que o produtor disse">
        <dl className="space-y-1.5 text-sm">
          <div><dt className="inline text-muted">Caminho em que pensava: </dt><dd className="inline font-medium text-ink">{s.path_title ?? 'não escolheu'}</dd></div>
          <div><dt className="inline text-muted">Observação: </dt><dd className="inline font-medium text-ink">{c.note ? `“${c.note}”` : '—'}</dd></div>
          <div><dt className="inline text-muted">Prefere resposta por: </dt><dd className="inline font-medium text-ink">{c.channel}</dd></div>
        </dl>
      </Block>

      <Block icon={<FileText size={14} />} title="Fontes anexadas">
        <ul className="space-y-1 text-sm">
          {(s.sources ?? []).map((x) => <li key={x.name} className="text-ink">{x.name}{x.date && <span className="text-muted"> · {x.date}</span>}</li>)}
          {!s.sources?.length && <li className="text-muted">—</li>}
        </ul>
        {s.generated_at && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><CalendarClock size={13} /> Dados calculados em {when(s.generated_at)}</p>}
      </Block>

      <p className="flex items-start gap-2 rounded-xl bg-primary-soft px-4 py-3 text-xs leading-relaxed text-primary-dark">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <span>Enviado com autorização do produtor (LGPD) em {when(c.consent_at)}, só para este órgão. O AgroBits organiza os dados; a orientação é do técnico.</span>
      </p>
    </div>
  )
}
