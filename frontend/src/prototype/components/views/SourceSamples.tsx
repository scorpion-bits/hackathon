// Amostras ("ver exemplo") de cada fonte de dados abertos, mostradas no modal da vitrine.
import clsx from 'clsx'
import { EyeOff, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { RiskStrip } from '../../../components/data'
import { Badge } from '../../../components/ui'
import { FORECAST, ZARC_MILHO } from '../../mock'
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

function ZarcSample() {
  return (
    <div>
      <Head k="zarc" origin="real" kind="oficial">Milho 1ª safra · Araraquara/SP · solo argiloso (AD6) · sequeiro</Head>
      <p className="mb-3 text-sm text-muted">Cada quadradinho é um período de 10 dias (decêndio). A cor diz qual o risco de perder a lavoura pelo clima se você plantar naquele período.</p>
      <RiskStrip zarc={{ available: true, risk: ZARC_MILHO, labels: DECENDIO_LABELS, today_decendio: 28 }} />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3"><div className="text-[11px] uppercase text-muted">Hoje (1–10/out)</div><div className="text-lg font-bold text-danger">40% de risco</div></div>
        <div className="rounded-lg border border-border p-3"><div className="text-[11px] uppercase text-muted">A partir de 11/out</div><div className="text-lg font-bold text-accent">30% de risco</div></div>
        <div className="rounded-lg border border-border p-3"><div className="text-[11px] uppercase text-muted">A partir de 21/out</div><div className="text-lg font-bold text-primary">20% de risco</div></div>
      </div>
      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-muted">Como isso aparece no arquivo original do MAPA (trecho)</div>
        <pre className="overflow-x-auto rounded-lg bg-sidebar p-3 font-mono text-[11.5px] leading-5 text-white/85">{`Nome_cultura;SafraIni;SafraFin;Cod_Solo;geocodigo;UF;municipio;…;dec27;dec28;dec29;dec30;dec31
Milho;2026;2027;AD6;3503208;SP;Araraquara;…;0;40;30;20;20`}</pre>
      </div>
      <Note>Esta tabela tem 1 linha por <b>cultura × ciclo × solo × município</b>. O AgroBits lê só as linhas de Araraquara, das suas culturas e dos seus tipos de solo. Se você plantar fora da janela, pode perder acesso ao Proagro e à subvenção do seguro.</Note>
      <Footer>Fonte: MAPA · Zoneamento Agrícola de Risco Climático · safra 2026/27 (957.490 linhas) · extraído em 02/10/2026.</Footer>
    </div>
  )
}

function AgrofitSample() {
  const rows: [string, string][] = [
    ['Produto (nome comercial)', 'Magic'], ['Ingrediente ativo', 'iprodiona'], ['Classe de uso', 'Fungicida'],
    ['Cultura', 'Feijão'], ['Praga-alvo', 'Mofo-branco, podridão-de-sclerotinia'], ['Nº do registro', '00218'],
    ['Classe toxicológica', 'Categoria 4 — pouco tóxico'], ['Situação', 'Registro vigente'],
  ]
  return (
    <div>
      <Head k="agrofit" origin="ilustrativo" kind="oficial">Uma linha do Agrofit: produto × cultura × praga</Head>
      <p className="mb-3 text-sm text-muted">Você tem o “Magic” no estoque. O Agrofit confirma se ele é <b>registrado</b> para a cultura em que você quer usar.</p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm"><tbody className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <tr key={k}><td className="w-2/5 bg-bg px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">{k}</td>
              <td className="px-3 py-2 text-ink">{k === 'Classe toxicológica' ? <span className="inline-flex items-center gap-2"><Badge tone="green">4</Badge>pouco tóxico</span> : v}</td></tr>
          ))}
        </tbody></table>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Big value="280.159" label="linhas no arquivo" />
        <Big value="4.409" label="produtos" />
        <Big value="243" label="culturas" />
        <Big value="1.472" label="pragas" />
      </div>
      <Note>O AgroBits filtra por <b>soja, milho e feijão</b> (Soja: 2.286 e Milho: 1.707 registros) e dá prioridade a produtos de classe toxicológica 4–5. O nome “Magic” e o número do registro são de exemplo; o formato das colunas é o real.</Note>
      <Footer>Fonte: MAPA · Agrofit (produtos formulados) · extraído em 02/10/2026. Os titulares do registro são empresas — não há dado pessoal.</Footer>
    </div>
  )
}

function SeguroSample() {
  const top = [['Milho 2ª safra', 51], ['Trigo', 15], ['Uva', 8], ['Café', 7]] as const
  return (
    <div>
      <Head k="seguro" origin="real" kind="oficial">Seguro rural com subvenção (PSR) · 2025</Head>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Big value="46.137" label="apólices em 2025" />
        <Big value="R$ 466 mi" label="subvenção federal" hint="somente municípios com ≥ 3 apólices" />
        <Big value="2,09 mi ha" label="área segurada" />
      </div>
      <div className="mt-4">
        <div className="mb-2 text-xs font-medium text-muted">Culturas mais seguradas (% das apólices)</div>
        <div className="space-y-1.5">
          {top.map(([n, p]) => (
            <div key={n} className="flex items-center gap-2 text-sm"><span className="w-28 shrink-0 text-ink">{n}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-danger" style={{ width: `${p * 1.8}%` }} /></div>
              <span className="w-9 text-right text-xs font-semibold text-muted">{p}%</span></div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/50 bg-primary-soft/50 p-3">
        <div><div className="text-xs font-medium text-primary-dark">Araraquara</div><div className="text-lg font-bold text-ink">menos de 3 apólices</div></div>
        <Badge tone="green"><EyeOff size={12} /> número escondido de propósito</Badge>
      </div>
      <Note tone="privacy">O arquivo original traz <b>nome do segurado, CPF parcial e localização da propriedade</b>. Por isso o AgroBits só usa totais, e <b>grupos com menos de 3 registros são suprimidos</b> para ninguém ser identificado.</Note>
      <Footer>Fonte: MAPA · Subvenção ao Prêmio do Seguro Rural (PSR/SISSER) · 2025 · agregado por município em 02/10/2026.</Footer>
    </div>
  )
}

function DronesSample() {
  const years = [['2021', 1234], ['2022', 76794], ['2023', 188006], ['2024', 194513], ['2025', 155979], ['2026*', 124921]] as const
  const max = 194513
  return (
    <div>
      <Head k="drones" origin="real" kind="oficial">Drones e aviões agrícolas registrados</Head>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Big value="14" label="drones em Araraquara" />
        <Big value="18" label="em Américo Brasiliense" hint="município vizinho" />
        <Big value="14" label="em Matão" hint="município vizinho" />
        <Big value="1.306" label="municípios do Brasil" hint="de 5.573 têm drones" />
      </div>
      <div className="mt-4">
        <div className="mb-2 text-xs font-medium text-muted">Autorizações de operação de drones no Brasil, por ano</div>
        <div className="flex h-28 items-end gap-2">
          {years.map(([y, v]) => (
            <div key={y} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-medium text-muted">{(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil</span>
              <div className="w-full rounded-t-md bg-info" style={{ height: `${Math.max(4, (v / max) * 72)}px` }} />
              <span className="text-[11px] text-ink">{y}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 text-[11px] text-muted">* 2026 parcial. Total no país: 6.257 drones e 2.527 aviões agrícolas ativos.</div>
      </div>
      <Note tone="privacy">O cadastro original tem nome, e-mail e telefone de pessoas físicas. O AgroBits <b>guarda só a contagem por município</b> — você vê que existe serviço perto, mas não quem é.</Note>
      <Footer>Fonte: MAPA · SIPEAGRO — Aviação Agrícola (registro e autorizações) · agregado por município em 02/10/2026.</Footer>
    </div>
  )
}

function ClimaSample() {
  const maxRain = 62
  return (
    <div>
      <Head k="clima" origin="ilustrativo" kind="previsao">Previsão para a sede do Sítio Boa Esperança (-21,832; -48,236)</Head>
      <div className="grid grid-cols-7 gap-1.5">
        {FORECAST.map((d) => (
          <div key={d.d} className={clsx('flex flex-col items-center rounded-lg border p-2 text-center', d.rain >= 50 ? 'border-danger/40 bg-danger-soft' : 'border-border bg-bg')}>
            <span className="text-[11px] font-medium uppercase text-muted">{d.d}</span>
            <span className="mt-1 text-sm font-bold text-ink">{d.t}°</span>
            <span className="text-[10px] text-muted">mín {d.min}°</span>
            <div className="mt-2 flex h-14 w-full items-end justify-center"><div className="w-4 rounded-t bg-info" style={{ height: `${Math.max(3, (d.rain / maxRain) * 56)}px` }} /></div>
            <span className={clsx('text-[11px] font-semibold', d.rain >= 50 ? 'text-danger' : 'text-info')}>{d.rain} mm</span>
          </div>
        ))}
      </div>
      <Note>Previsões mudam: quanto mais distante o dia, maior a margem de erro. O AgroBits avisa quando a chuva prevista passa de <b>50 mm em um dia</b> (limite do seu contexto.md).</Note>
      <Footer>Fonte: Open-Meteo (modelos globais) · 16 dias × 24 h na coordenada da sede · atualizado agora. Valores de exemplo.</Footer>
    </div>
  )
}

function SateliteSample() {
  const cols = 14, rows = 8
  const ndvi = (x: number, y: number) => 0.45 + 0.3 * Math.sin(x * 0.7 + 0.5) * Math.cos(y * 0.9) + 0.12 * Math.sin((x + y) * 1.7)
  const color = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - 0.15) / 0.7))
    const a = [217, 197, 138], b = [31, 92, 57]
    return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(',')})`
  }
  return (
    <div>
      <Head k="satelite" origin="ilustrativo" kind="oficial">Vegetação vista do espaço (índice NDVI) · raio de 10 km</Head>
      <div className="overflow-hidden rounded-lg border border-border">
        <svg viewBox={`0 0 ${cols * 20} ${rows * 20}`} className="block w-full" role="img" aria-label="Mapa de vegetação de exemplo">
          {Array.from({ length: rows }).flatMap((_, y) => Array.from({ length: cols }).map((__, x) => <rect key={`${x}-${y}`} x={x * 20} y={y * 20} width="20" height="20" fill={color(ndvi(x, y))} />))}
          <rect x={5 * 20} y={3 * 20} width={3 * 20} height={2 * 20} fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="5 3" />
          <text x={5 * 20 + 4} y={3 * 20 - 5} fontSize="10" fontWeight="700" fill="#fff" stroke="#13241A" strokeWidth="0.6" paintOrder="stroke">sua propriedade</text>
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted"><span>vegetação fraca</span>
        <div className="h-2 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(217,197,138), rgb(31,92,57))' }} /><span>vegetação densa</span></div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {['Vegetação (NDVI)', 'Temperatura da superfície', 'Umidade do solo', 'Focos de fogo'].map((c, i) => <Badge key={c} tone={i === 0 ? 'green' : 'gray'}>{c}</Badge>)}
      </div>
      <Note>As imagens ajudam a conferir se a lavoura da região está “verde” ou sofrendo com a seca, sem precisar andar até lá.</Note>
      <Footer>Fonte: NASA GIBS / INPE · imagens diárias (última: ontem). Mapa desenhado como exemplo.</Footer>
    </div>
  )
}

function PivosSample() {
  const years = Array.from({ length: 35 }, (_, i) => 1985 + i)
  const h = (y: number) => 6 + ((y - 1985) / 34) ** 1.7 * 70
  return (
    <div>
      <Head k="pivos" origin="ilustrativo" kind="oficial">Pivôs centrais mapeados por satélite · 1985–2019</Head>
      <div className="flex h-28 items-end gap-[2px]">
        {years.map((y) => <div key={y} className="flex-1 rounded-t-sm bg-[#0E7490]" style={{ height: `${h(y)}%`, opacity: 0.45 + (y - 1985) / 70 }} title={String(y)} />)}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted"><span>1985</span><span>2000</span><span>2019</span></div>
      <p className="mt-2 text-xs text-muted">Forma da série (ilustrativa): a irrigação por pivôs cresce ano a ano e se concentra em poucas regiões.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Big value="35 anos" label="de série histórica" />
        <Big value="2019" label="último ano mapeado" hint="7 anos de defasagem — dado antigo" />
      </div>
      <Note>Ligamos esta base às outras pelo <b>código IBGE do município</b>. Por ser antiga e feita por satélite (pode errar), sempre mostramos o ano e a incerteza. Por enquanto, sem itens relevantes para você.</Note>
      <Footer>Fonte: ANA / Embrapa · Pivôs Centrais (dados.gov.br). Base em integração; o gráfico é só ilustrativo.</Footer>
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
  zarc: 'Exemplo · Zarc (quando plantar)', agrofit: 'Exemplo · Agrofit (defensivos)', seguro: 'Exemplo · Seguro rural',
  drones: 'Exemplo · Drones e aviação agrícola', clima: 'Exemplo · Previsão do tempo', satelite: 'Exemplo · Satélite', pivos: 'Exemplo · Pivôs centrais',
}
