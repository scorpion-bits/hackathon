// Amostras ("ver exemplo") de cada fonte de dados abertos, mostradas no modal da vitrine.
import clsx from 'clsx'
import { EyeOff, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { RiskStrip } from '../../../components/data'
import { Badge } from '../../../components/ui'
import { Link } from 'react-router-dom'
import { nfmt, useRainNormal, useSources } from '../../api/opendata'
import { useApi } from '../../api/resource'
import { useTopics } from '../../api/topics'
import { FIELDS } from '../../mock'
import { decendio, useForecast } from '../livemap/layers'
import { SourceStatus, Skeleton } from '../SourceStatus'
import { InfoKind } from '../../../components/data'
import { OriginTag, SourceChip } from '../Shell'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const RANGES = ['1–10', '11–20', '21–fim']
export const DECENDIO_LABELS = Array.from({ length: 36 }, (_, i) => `${RANGES[i % 3]}/${MONTHS[Math.floor(i / 3)]}`)

function Head({ k, origin, kind, children }: { k: string; origin: 'real' | 'ilustrativo'; kind?: Parameters<typeof InfoKind>[0]['kind']; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-2 flex flex-wrap items-center gap-2"><SourceChip k={k} /><OriginTag origin={origin} />{kind && <InfoKind kind={kind} />}</div>
      <h4 className="text-base font-semibold text-ink">{children}</h4>
    </div>
  )
}

function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'privacy' }) {
  return (
    <div className={clsx('mt-4 flex gap-2 rounded-lg p-3 text-xs leading-relaxed', tone === 'privacy' ? 'bg-primary-soft text-primary-dark' : 'bg-info-soft text-info')}>
      {tone === 'privacy' ? <EyeOff size={15} className="mt-0.5 shrink-0" /> : <Info size={15} className="mt-0.5 shrink-0" />}
      <div>{children}</div>
    </div>
  )
}

function Footer({ children }: { children: ReactNode }) {
  return <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted">{children}</p>
}

function Big({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-xs font-medium text-ink">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted">{hint}</div>}
    </div>
  )
}

/** Rodapé "Fonte … · extraído em …" com a data real da base local (vinda da API). */
function SourceFooter({ apiKey, extra }: { apiKey: string; extra?: string }) {
  const src = useSources().data?.find((x) => x.key === apiKey)
  return <Footer>{src ? `Fonte: ${src.agency} · ${src.name} · extraído em ${src.extracted_at}${src.checked_at ? ` · conferido no portal em ${src.checked_at.slice(0, 10).split('-').reverse().join('/')}` : ''}.` : 'Fonte oficial.'}{extra ? ` ${extra}` : ''}</Footer>
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">{children}</p>
}

type Region = { available: boolean; municipality?: string; uf?: string; drones: number | null; planes: number | null; uf_drones?: number; br_drones?: number; br_municipalities_with_drones?: number; br_municipalities?: number
  insurance_policies: number | null; insured_area_ha: number | null; federal_subsidy_brl: number | null; authorizations_last_year: number | null; authorizations_total: number | null }

function ZarcSample() {
  const field = FIELDS.find((f) => f.zarc)
  return (
    <div>
      <Head k="zarc" origin="real" kind="oficial">{field ? `${field.crop} · solo ${field.soil.toLowerCase()} · seu ${field.name}` : 'Risco climático por período de plantio'}</Head>
      <p className="mb-3 text-sm text-muted">Cada quadradinho é um período de 10 dias (decêndio). A cor diz qual o risco de perder a lavoura pelo clima se você plantar naquele período.</p>
      {field?.zarc
        ? <RiskStrip zarc={{ available: true, risk: field.zarc, labels: DECENDIO_LABELS, today_decendio: decendio(new Date()) + 1 }} />
        : <Empty>Nenhum talhão seu tem cultura com zoneamento neste município ainda. Desenhe um talhão e escolha a cultura para ver o risco real.</Empty>}
      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-muted">Como isso aparece no arquivo original do MAPA (colunas)</div>
        <pre className="overflow-x-auto rounded-lg bg-sidebar p-3 font-mono text-[11.5px] leading-5 text-white/85">{`Nome_cultura;SafraIni;SafraFin;Cod_Solo;geocodigo;UF;municipio;…;dec1;dec2;…;dec36`}</pre>
      </div>
      <Note>Esta tabela tem 1 linha por <b>cultura × ciclo × solo × município</b>. O AgroBits lê só as linhas do seu município, das suas culturas e dos seus tipos de solo. Se você plantar fora da janela, pode perder acesso ao Proagro e à subvenção do seguro.</Note>
      <SourceFooter apiKey="zarc" />
    </div>
  )
}

function AgrofitSample() {
  const topics = useTopics().data?.topics ?? []
  const ev = topics.map((t) => t.evidence).find((e) => e.type === 'agrofit')
  const rows: [string, string][] = ev && ev.type === 'agrofit' ? [
    ['Produto (nome comercial)', ev.brand ?? ev.item], ['Ingrediente ativo', ev.ingredient ?? '—'],
    ['Cultura registrada', ev.matches[0]?.crop ?? ev.registered_crops.slice(0, 3).join(', ') ?? '—'], ['Praga-alvo', ev.matches[0]?.pests ?? '—'],
    ['Nº do registro', ev.registration ?? '—'], ['Classe toxicológica', ev.tox_class ?? '—'],
  ] : []
  return (
    <div>
      <Head k="agrofit" origin="real" kind="oficial">Registro de um produto do seu estoque no Agrofit</Head>
      <p className="mb-3 text-sm text-muted">O Agrofit confirma se um produto é <b>registrado</b> para a cultura em que você quer usar.</p>
      {rows.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm"><tbody className="divide-y divide-border">
            {rows.map(([k, v]) => <tr key={k}><td className="w-2/5 bg-bg px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">{k}</td><td className="px-3 py-2 text-ink">{v}</td></tr>)}
          </tbody></table>
        </div>
      ) : <Empty>Nenhum defensivo do seu estoque vence nos próximos 30 dias, então não há registro para mostrar agora. Quando houver, a consulta ao Agrofit aparece aqui e no assunto correspondente.</Empty>}
      <Note>O AgroBits dá prioridade a produtos de classe toxicológica 4–5 e só consulta as culturas dos seus talhões. Titulares do registro são empresas — não há dado pessoal.</Note>
      <SourceFooter apiKey="agrofit" />
    </div>
  )
}

function SeguroSample() {
  const r = useApi<Region>('/opendata/region')
  if (r.loading) return <Skeleton className="h-40" />
  const d = r.data
  return (
    <div>
      <Head k="seguro" origin="real" kind="oficial">Seguro rural com subvenção (PSR) no seu município</Head>
      {d?.available && d.insurance_policies != null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Big value={nfmt(d.insurance_policies)} label={`apólices em ${d.municipality}`} />
          {d.federal_subsidy_brl != null && <Big value={d.federal_subsidy_brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} label="subvenção federal" />}
          {d.insured_area_ha != null && <Big value={`${nfmt(Math.round(d.insured_area_ha))} ha`} label="área segurada" />}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/50 bg-primary-soft/50 p-3">
          <div><div className="text-xs font-medium text-primary-dark">{d?.municipality ?? 'Seu município'}</div><div className="text-lg font-bold text-ink">menos de 3 apólices</div></div>
          <Badge tone="green"><EyeOff size={12} /> número escondido de propósito</Badge>
        </div>
      )}
      <Note tone="privacy">O arquivo original traz <b>nome do segurado, CPF parcial e localização da propriedade</b>. Por isso o AgroBits só usa totais, e <b>grupos com menos de 3 registros são suprimidos</b> para ninguém ser identificado.</Note>
      <SourceFooter apiKey="psr" />
    </div>
  )
}

function DronesSample() {
  const r = useApi<Region>('/opendata/region')
  if (r.loading) return <Skeleton className="h-40" />
  const d = r.data
  return (
    <div>
      <Head k="drones" origin="real" kind="oficial">Drones e aviões agrícolas registrados</Head>
      {d?.available ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Big value={nfmt(d.drones ?? 0)} label={`drones em ${d.municipality}`} hint={d.planes ? `e ${nfmt(d.planes)} aviões` : undefined} />
          <Big value={nfmt(d.uf_drones ?? 0)} label={`drones no estado (${d.uf})`} />
          <Big value={nfmt(d.br_municipalities_with_drones ?? 0)} label="municípios do Brasil com drones" hint={`de ${nfmt(d.br_municipalities ?? 0)}`} />
          <Big value={nfmt(d.br_drones ?? 0)} label="drones no país" />
        </div>
      ) : <Empty>Sem dados de aviação agrícola para o seu município.</Empty>}
      <Note tone="privacy">O cadastro original tem nome, e-mail e telefone de pessoas físicas. O AgroBits <b>guarda só a contagem por município</b> — você vê que existe serviço perto, mas não quem é.</Note>
      <SourceFooter apiKey="sipeagro_aviacao" extra="Sede do operador registrado no MAPA (ele pode atuar em outros municípios)." />
    </div>
  )
}

function ClimaSample() {
  const { days, status, fetchedAt, loading } = useForecast()
  const max = Math.max(...days.map((d) => d.rain), 1)
  return (
    <div>
      <Head k="clima" origin="real" kind="previsao">Previsão para a sede da sua propriedade</Head>
      {loading ? <Skeleton className="h-40" /> : days.length ? (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <div key={d.date} className={clsx('flex flex-col items-center rounded-lg border p-2 text-center', d.rain >= 50 ? 'border-danger/40 bg-danger-soft' : 'border-border bg-bg')}>
              <span className="text-[11px] font-medium uppercase text-muted">{d.d}</span>
              <span className="mt-1 text-sm font-bold text-ink">{d.t}°</span>
              <span className="text-[10px] text-muted">mín {d.min}°</span>
              <div className="mt-2 flex h-14 w-full items-end justify-center"><div className="w-4 rounded-t bg-info" style={{ height: `${Math.max(3, (d.rain / max) * 56)}px` }} /></div>
              <span className={clsx('text-[11px] font-semibold', d.rain >= 50 ? 'text-danger' : 'text-info')}>{Math.round(d.rain)} mm</span>
            </div>
          ))}
        </div>
      ) : <Empty>Previsão indisponível agora: a fonte não respondeu e não há dado guardado.</Empty>}
      <SourceStatus status={status} fetchedAt={fetchedAt} what="Previsão" />
      <Note>Previsões mudam: quanto mais distante o dia, maior a margem de erro. O AgroBits avisa quando a chuva prevista passa de <b>40 mm em um dia</b>.</Note>
      <SourceFooter apiKey="open_meteo" extra={fetchedAt ? `Consultada em ${fetchedAt.replace('T', ' ')}.` : undefined} />
    </div>
  )
}

function SateliteSample() {
  const n = useRainNormal()
  const d = n.data
  return (
    <div>
      <Head k="satelite" origin="real" kind="oficial">Chuva por satélite × o normal da região (NASA POWER)</Head>
      {n.loading ? <Skeleton className="h-24" /> : d?.available && d.ratio != null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Big value={`${nfmt(d.observed_mm)} mm`} label={`choveu em ${d.period.days} dias`} hint={`${d.period.start} a ${d.period.end}`} />
          <Big value={`${nfmt(d.normal_mm)} mm`} label="o normal para o período" />
          <Big value={d.label} label="situação" />
        </div>
      ) : <Empty>Chuva por satélite indisponível agora: a fonte não respondeu e não há dado guardado.</Empty>}
      <SourceStatus status={d?.status} fetchedAt={d?.fetched_at} what="Chuva" />
      <Note>As imagens de vegetação, temperatura, umidade do solo e focos de fogo (NASA GIBS) ficam no <Link to="/prototipo/mapa" className="font-semibold underline">Mapa vivo</Link>, camada por camada.</Note>
      <Footer>Fonte: NASA POWER (chuva diária e climatologia) e NASA GIBS (imagens). Consulta ao vivo, com a última resposta guardada quando a fonte está fora.</Footer>
    </div>
  )
}

function PivosSample() {
  return (
    <div>
      <Head k="pivos" origin="real" kind="oficial">Pivôs centrais mapeados por satélite · 1985–2019</Head>
      <Empty>Esta base (ANA / Embrapa) ainda <b>não está integrada</b> ao AgroBits, então não mostramos números dela. A ideia é ligá-la às outras pelo código IBGE do município e sempre exibir o ano e a incerteza (a série vai só até 2019).</Empty>
      <Footer>Fonte: ANA / Embrapa · Pivôs Centrais (dados.gov.br). Integração planejada.</Footer>
    </div>
  )
}

export function SourceSample({ k }: { k: string }) {
  switch (k) {
    case 'zarc': return <ZarcSample />
    case 'agrofit': return <AgrofitSample />
    case 'seguro': return <SeguroSample />
    case 'drones': return <DronesSample />
    case 'clima': return <ClimaSample />
    case 'satelite': return <SateliteSample />
    default: return <PivosSample />
  }
}

export const SAMPLE_TITLE: Record<string, string> = {
  zarc: 'Zarc (quando plantar)', agrofit: 'Agrofit (defensivos)', seguro: 'Seguro rural',
  drones: 'Drones e aviação agrícola', clima: 'Previsão do tempo', satelite: 'Chuva por satélite', pivos: 'Pivôs centrais',
}
