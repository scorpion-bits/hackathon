// "Minha propriedade" — gestão leve (secundária). Cada item aponta o dado aberto que se relaciona com ele.
import clsx from 'clsx'
import {
  AlertTriangle, Bot, CheckCircle2, Pencil, ClipboardList, Coins, Fuel, Layers, Map as MapIcon, Package, Plus, Receipt, Ruler, ShieldCheck, ShoppingCart, SprayCan, Sprout, Tractor, Wheat, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Input, Label, Modal, PageHeader, Select, Stat, Table } from '../../components/ui'
import { RISK_COLOR } from '../../lib/format'
import { FIELDS, PRODUCER, type MapField } from '../mock'
import { decendio } from '../components/livemap/layers'
import { fmtDate } from '../api/cases'
import { nfmt } from '../api/opendata'
import { useApi } from '../api/resource'
import { useMe } from '../api/session'
import { useTopics, type Topic } from '../api/topics'
import { Skeleton } from '../components/SourceStatus'
import { IsoFarm } from '../components/IsoFarm'
import { SourceChip } from '../components/Shell'

type Tab = 'talhoes' | 'atividades' | 'estoque' | 'custos'

/* ------------------------------------------------------------------ talhões */
const riskTone = (r: number) => (r >= 40 ? 'red' : r >= 30 ? 'amber' : 'green')
const riskWord = (r: number) => (r >= 40 ? 'alto' : r >= 30 ? 'médio' : 'baixo')
const nowDecendio = () => decendio(new Date())
const CHIP_OF: Record<string, string> = { zarc: 'zarc', open_meteo: 'clima', nasa_power: 'satelite', agrofit: 'agrofit', sipeagro_aviacao: 'drones', psr: 'seguro', conta: 'voce' }

/** Faixa do Zarc do ano (36 decêndios) do talhão, com o decêndio de hoje marcado. */
function MiniStrip({ series }: { series: number[] }) {
  const today = nowDecendio()
  return (
    <div>
      <div className="flex gap-[1.5px]">{series.map((r, i) => <div key={i} className={clsx('h-2 flex-1 rounded-[1px]', i === today && 'ring-1 ring-ink ring-offset-1')} style={{ background: RISK_COLOR[r] }} />)}</div>
      <div className="mt-0.5 flex justify-between text-[9px] text-muted"><span>jan</span><span>jul</span><span>dez</span></div>
    </div>
  )
}

function FieldCard({ f, topic }: { f: MapField; topic?: Topic }) {
  const risk = f.zarc ? f.zarc[nowDecendio()] : null
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:shadow-md">
      <div className="relative">
        <div className="bg-gradient-to-b from-mint-soft to-surface"><IsoFarm fields={[f]} colorBy="crop" labels={false} height={144} className="w-full" /></div>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink shadow-sm ring-1 ring-border">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />{f.name}
        </span>
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div><div className="text-lg font-bold leading-tight text-ink">{f.crop}</div><div className="text-xs text-muted">{f.status}</div></div>
          {risk == null
            ? <Badge tone="gray" className="shrink-0">Zarc: sem zoneamento</Badge>
            : <Badge tone={risk ? riskTone(risk) : 'gray'} className="shrink-0">{risk ? `Zarc hoje: ${risk}% · ${riskWord(risk)}` : 'Zarc hoje: fora da janela'}</Badge>}
        </div>
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-bg p-2.5 text-xs">
          <div><dt className="text-muted">Área</dt><dd className="font-semibold text-ink">{f.area.toLocaleString('pt-BR')} ha</dd></div>
          <div className="col-span-2"><dt className="text-muted">Solo</dt><dd className="font-semibold text-ink">{f.soil}</dd></div>
        </dl>
        {f.zarc && <MiniStrip series={f.zarc} />}
        {topic ? (
          <>
            <p className="text-sm leading-relaxed text-ink">{topic.summary}</p>
            <div className="flex flex-wrap gap-1.5">{topic.sources.map((s) => <SourceChip key={s.key} k={CHIP_OF[s.key] ?? s.key} />)}</div>
          </>
        ) : <p className="text-sm leading-relaxed text-muted">Nenhum assunto novo para este talhão hoje: cruzamos os dados oficiais com o seu cadastro.</p>}
      </div>
      <footer className="flex gap-2 border-t border-border bg-bg/60 px-4 py-2.5">
        <Link to={`/prototipo/mapa?talhao=${f.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-ink"><MapIcon size={14} /> Ver no mapa</Link>
        <Link to={`/prototipo/talhoes?de=propriedade&talhao=${f.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-ink"><Pencil size={14} /> Editar</Link>
        <Link to="/prototipo/assistente" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-dark hover:bg-primary-soft"><Bot size={14} /> Perguntar à IA</Link>
      </footer>
    </article>
  )
}

function Overview({ topics }: { topics: Topic[] }) {
  const total = FIELDS.reduce((s, f) => s + f.area, 0)
  const urgent = topics.filter((t) => t.priority === 'agir' || t.priority === 'atencao')
  const toPlant = FIELDS.filter((f) => !f.status.includes('após plantio') && f.crop !== 'Sem cultura').length
  return (
    <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><MapIcon size={15} className="text-primary" /> {PRODUCER.farm} · {PRODUCER.municipality}/{PRODUCER.uf}</h2>
          <Link to="/prototipo/talhoes?de=propriedade" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"><Pencil size={13} /> Editar talhões</Link>
        </header>
        <div className="flex-1 bg-gradient-to-b from-mint-soft to-surface"><IsoFarm fields={FIELDS} colorBy="crop" height={240} className="w-full" /></div>
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <Stat label="Área total" value={`${total.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`} hint={`${FIELDS.length} ${FIELDS.length === 1 ? 'talhão desenhado' : 'talhões desenhados'} no mapa`} icon={<Ruler size={16} />} />
        <Stat label="Sem lavoura em pé" value={`${toPlant} ${toPlant === 1 ? 'talhão' : 'talhões'}`} hint="aguardando plantio" icon={<Sprout size={16} />} tone="amber" />
        <div className="col-span-2 lg:col-span-1">
          <Link to="/prototipo"><Stat label="Pede atenção" value={`${urgent.length} ${urgent.length === 1 ? 'assunto' : 'assuntos'}`} hint={urgent[0]?.question ?? 'nada urgente hoje'} icon={<AlertTriangle size={16} />} tone="red" /></Link>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ atividades */
type ApiEvent = { id: number; field_id: number | null; type: string; date: string; title: string; origin: string; inputs: { item_name: string; quantity: number; unit: string }[] }
const EVENT_ICON: Record<string, [LucideIcon, string]> = {
  plantio: [Sprout, 'Plantio'], colheita: [Wheat, 'Colheita'], aplicacao: [SprayCan, 'Aplicação'], preparo: [Tractor, 'Preparo do solo'],
  compra: [ShoppingCart, 'Compra'], observacao: [ClipboardList, 'Observação'], outro: [ClipboardList, 'Registro'],
}

function Activities() {
  const ev = useApi<ApiEvent[]>('/events')
  if (ev.loading) return <Skeleton className="h-64" />
  const list = (ev.data ?? []).slice(0, 12)
  const fname = (id: number | null) => FIELDS.find((f) => f.id === id)?.name
  return (
    <Card title="Últimas atividades" action={<span className="text-xs text-muted">{ev.data?.length ?? 0} registros</span>}>
      {list.length === 0 ? <p className="text-sm text-muted">Nenhuma atividade registrada ainda.</p> : (
        <ol className="relative space-y-5 border-l-2 border-border pl-6">
          {list.map((e) => {
            const [Icon, kind] = EVENT_ICON[e.type] ?? EVENT_ICON.outro
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[37px] top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-surface bg-primary-soft text-primary-dark ring-1 ring-border"><Icon size={15} /></span>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-ink">{kind}: {e.title}</span>
                  <span className="text-xs text-muted">{new Date(`${e.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <p className="text-sm text-muted">{[fname(e.field_id), ...e.inputs.map((i) => `${i.item_name} ${nfmt(i.quantity)} ${i.unit}`)].filter(Boolean).join(' · ') || 'Propriedade toda'}</p>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ estoque */
type ApiItem = { id: number; name: string; category: string; unit: string; quantity: number; low_stock: boolean; expiry_date: string | null; days_to_expiry: number | null; agrofit_registration: string | null }
const CAT_ICON: Record<string, LucideIcon> = { semente: Wheat, fertilizante: Package, defensivo: SprayCan, combustivel: Fuel }

function Stock() {
  const items = useApi<ApiItem[]>('/stock/items')
  if (items.loading) return <Skeleton className="h-64" />
  const rows = items.data ?? []
  const badge = (r: ApiItem): { tone: 'amber' | 'red' | 'green'; text: string } => {
    if (r.days_to_expiry != null && r.days_to_expiry < 0) return { tone: 'red', text: `Vencido há ${-r.days_to_expiry} dias` }
    if (r.days_to_expiry != null && r.days_to_expiry <= 30) return { tone: 'amber', text: `Vence em ${fmtDate(r.expiry_date as string)} (${r.days_to_expiry} dias)` }
    if (r.low_stock) return { tone: 'red', text: 'Estoque baixo' }
    return { tone: 'green', text: 'Ok' }
  }
  return (
    <Card title="Estoque" padded={false} action={<span className="text-xs text-muted">{rows.length} itens</span>}>
      <div className="p-2">
        {rows.length === 0 ? <p className="p-4 text-sm text-muted">Nenhum item no estoque ainda.</p> : (
          <Table head={['Item', 'Quantidade', 'Situação', 'Dado aberto relacionado']}>
            {rows.map((r) => {
              const Icon = CAT_ICON[r.category] ?? Package
              const b = badge(r)
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-3 py-3"><span className="flex items-center gap-2 font-medium text-ink"><span className="grid h-8 w-8 place-items-center rounded-lg bg-bg text-muted"><Icon size={15} /></span>{r.name}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{nfmt(r.quantity)} {r.unit}</td>
                  <td className="px-3 py-3"><Badge tone={b.tone}>{b.tone === 'green' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}{b.text}</Badge></td>
                  <td className="px-3 py-3">
                    {r.agrofit_registration
                      ? <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink"><SourceChip k="agrofit" /><span className="inline-flex items-center gap-1 font-semibold text-primary-dark"><ShieldCheck size={13} /> registro {r.agrofit_registration}</span></div>
                      : <span className="text-xs text-muted">—</span>}
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ custos */
type Costs = { season: string; purchased_total: number; applied_total: number; purchased_by_category: Record<string, number>; applied_by_category: Record<string, number>; applied_by_field: Record<string, number> }
const CAT_LABEL: Record<string, string> = { semente: 'Sementes', fertilizante: 'Adubo', defensivo: 'Defensivos', combustivel: 'Combustível', ferramenta: 'Ferramentas', irrigacao: 'Irrigação', outro: 'Outros' }
const brl0 = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function Bars({ data, label }: { data: [string, number][]; label: (k: string) => string }) {
  const max = Math.max(...data.map(([, v]) => v), 1)
  return (
    <div className="space-y-3">
      {data.map(([k, v]) => (
        <div key={k}>
          <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-ink">{label(k)}</span><span className="text-muted">{brl0(v)}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

function Costs() {
  const res = useApi<Costs>('/reports/costs')
  const area = FIELDS.reduce((s, f) => s + f.area, 0)
  if (res.loading) return <Skeleton className="h-64" />
  const c = res.data
  if (!c || (c.purchased_total === 0 && c.applied_total === 0)) return <Card title="Custos"><p className="text-sm text-muted">Sem compras nem aplicações registradas na safra atual.</p></Card>
  const top = Object.entries(c.purchased_by_category)[0]
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={`Comprado na safra ${c.season}`} value={brl0(c.purchased_total)} hint="entradas no estoque" icon={<Wallet size={16} />} />
        <Stat label="Custo por hectare" value={area ? `${brl0(Math.round(c.purchased_total / area))}/ha` : '—'} hint={`${area.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha no total`} icon={<Coins size={16} />} tone="blue" />
        <Stat label={top ? `Maior gasto: ${(CAT_LABEL[top[0]] ?? top[0]).toLowerCase()}` : 'Maior gasto'} value={top ? brl0(top[1]) : '—'} hint={top ? `${Math.round((top[1] / c.purchased_total) * 100)}% do total` : ''} icon={<Receipt size={16} />} tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Para onde foi o dinheiro (compras)"><Bars data={Object.entries(c.purchased_by_category)} label={(k) => CAT_LABEL[k] ?? k} /></Card>
        <Card title="Insumos aplicados em cada talhão"><Bars data={Object.entries(c.applied_by_field)} label={(k) => k} /></Card>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-info/30 bg-info-soft/60 p-3 text-sm text-ink">
        <SourceChip k="seguro" /><SourceChip k="zarc" />
        <span>Plantar dentro da janela do Zarc mantém o acesso ao <b>Proagro</b> e à <b>subvenção do seguro rural</b> — o que protege esse investimento.</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ registrar */
const CHIPS: { id: string; label: string; icon: LucideIcon; placeholder: string; help: string; chips: string[] }[] = [
  { id: 'plantio', label: 'Plantio', icon: Sprout, placeholder: 'Ex.: milho, 40 kg de semente', help: 'O AgroBits confere a janela do Zarc para este talhão e avisa se o risco estiver alto.', chips: ['zarc'] },
  { id: 'aplicacao', label: 'Aplicação', icon: SprayCan, placeholder: 'Ex.: Magic, 1,5 L', help: 'Confere no Agrofit se o produto é registrado para a cultura e olha a previsão de chuva.', chips: ['agrofit', 'clima'] },
  { id: 'colheita', label: 'Colheita', icon: Wheat, placeholder: 'Ex.: 38 sacas', help: 'Guarda a produtividade para comparar com as próximas safras.', chips: [] },
  { id: 'compra', label: 'Compra', icon: ShoppingCart, placeholder: 'Ex.: ureia, 800 kg, R$ 3.440', help: 'Soma ao estoque e aos custos do talhão.', chips: [] },
]

function RegisterModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [sel, setSel] = useState('plantio')
  const cur = CHIPS.find((c) => c.id === sel) ?? CHIPS[0]
  return (
    <Modal open={open} title="Registrar atividade" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button key={c.id} onClick={() => setSel(c.id)} className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
              sel === c.id ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-ink hover:bg-bg')}><c.icon size={15} /> {c.label}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label label="Talhão"><Select defaultValue="2">{FIELDS.map((f) => <option key={f.id} value={f.id}>{f.name} · {f.crop}</option>)}<option value="">Propriedade toda</option></Select></Label>
          <Label label="Data"><Input type="date" defaultValue="2026-10-02" /></Label>
        </div>
        <Label label="O que foi feito"><Input placeholder={cur.placeholder} /></Label>
        <div className="rounded-lg bg-primary-soft/60 p-3 text-xs text-primary-dark">
          <div className="mb-1 font-semibold">O que o AgroBits faz com este registro</div>
          <p>{cur.help}</p>
          {cur.chips.length > 0 && <div className="mt-2 flex gap-1.5">{cur.chips.map((c) => <SourceChip key={c} k={c} />)}</div>}
        </div>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={onSave}>Salvar (exemplo)</Button></div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ página */
export default function Property() {
  const [tab, setTab] = useState<Tab>('talhoes')
  const [reg, setReg] = useState(false)
  const [toast, setToast] = useState(false)
  const counts = useMe().me?.counts
  const topics = useTopics().data?.topics ?? []
  const save = () => { setReg(false); setToast(true); window.setTimeout(() => setToast(false), 3500) }
  const tabs: { id: Tab; label: string; icon: LucideIcon; n?: number }[] = [
    { id: 'talhoes', label: 'Talhões', icon: Layers, n: FIELDS.length },
    { id: 'atividades', label: 'Atividades', icon: ClipboardList, n: counts?.events },
    { id: 'estoque', label: 'Estoque', icon: Package, n: counts?.stock_items },
    { id: 'custos', label: 'Custos', icon: Wallet },
  ]
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Minha propriedade"
        subtitle={`${PRODUCER.farm} · ${PRODUCER.municipality}/${PRODUCER.uf} · gestão simples, ligada aos dados abertos`}
        actions={<Button onClick={() => setReg(true)}><Plus size={16} /> Registrar</Button>}
      />
      <Overview topics={topics} />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 ring-1 ring-border" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={clsx('inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition', tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-bg hover:text-ink')}>
            <t.icon size={15} /> {t.label}{t.n != null && <span className={clsx('rounded-full px-1.5 text-[11px]', tab === t.id ? 'bg-white/20' : 'bg-bg')}>{t.n}</span>}
          </button>
        ))}
      </div>
      {tab === 'talhoes' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FIELDS.map((f) => <FieldCard key={f.id} f={f} topic={topics.find((t) => t.field_id === f.id)} />)}
          <Link to="/prototipo/talhoes?de=propriedade" className="grid min-h-48 place-items-center rounded-xl border-2 border-dashed border-border text-center text-sm font-semibold text-muted transition hover:border-primary hover:bg-primary-soft/40 hover:text-primary">
            <span><Plus size={28} className="mx-auto mb-1" />Adicionar ou editar talhões<span className="block text-xs font-normal">abre o mapa para desenhar</span></span>
          </Link>
        </div>
      )}
      {tab === 'atividades' && <Activities />}
      {tab === 'estoque' && <Stock />}
      {tab === 'custos' && <Costs />}
      <RegisterModal open={reg} onClose={() => setReg(false)} onSave={save} />
      {toast && (
        <div className="fixed bottom-5 right-5 z-[1100] flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
          <CheckCircle2 size={16} className="text-emerald-300" /> Registro de exemplo — no protótipo nada é salvo.
        </div>
      )}
    </div>
  )
}
