// "Minha propriedade" — gestão leve (secundária). Cada item aponta o dado aberto que se relaciona com ele.
import clsx from 'clsx'
import {
  AlertTriangle, Bot, CheckCircle2, Pencil, ClipboardList, Coins, Fuel, Layers, Map as MapIcon, Package, Plus, Receipt, Ruler, ShieldCheck, ShoppingCart, SprayCan, Sprout, Tractor, Wheat, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Input, Label, Modal, PageHeader, Select, Stat, Table } from '../../components/ui'
import { RISK_COLOR } from '../../lib/format'
import { FIELDS, PRODUCER, ZARC_MILHO } from '../mock'
import { MiniFieldMap } from '../components/views/MiniFieldMap'
import { COST_BY_CATEGORY, COST_BY_FIELD, COST_TOTAL, FERTILIZER_TOTAL, brl0 } from '../components/views/demo'
import { OriginTag, SourceChip } from '../components/Shell'

type Tab = 'talhoes' | 'atividades' | 'estoque' | 'custos'

/* ------------------------------------------------------------------ talhões */
const FIELD_NOTE: Record<number, { text: string; chips: string[] }> = {
  1: { text: 'Já está na janela de menor risco (20%) desde 11/10 até o fim de dezembro.', chips: ['zarc'] },
  2: { text: 'Espere até 21/10: hoje o risco de perda pelo clima é de 40%.', chips: ['zarc', 'clima'] },
  3: { text: 'Feijão irrigado em desenvolvimento. O fungicida que você tem é registrado para feijão.', chips: ['agrofit'] },
}
const riskTone = (r: number) => (r >= 40 ? 'red' : r >= 30 ? 'amber' : 'green')
const riskWord = (r: number) => (r >= 40 ? 'alto' : r >= 30 ? 'médio' : 'baixo')

function MiniStrip() {
  return (
    <div>
      <div className="flex gap-[1.5px]">{ZARC_MILHO.map((r, i) => <div key={i} className={clsx('h-2 flex-1 rounded-[1px]', i === 27 && 'ring-1 ring-ink ring-offset-1')} style={{ background: RISK_COLOR[r] }} />)}</div>
      <div className="mt-0.5 flex justify-between text-[9px] text-muted"><span>jan</span><span>jul</span><span>dez</span></div>
    </div>
  )
}

function FieldCard({ f }: { f: (typeof FIELDS)[number] }) {
  const note = FIELD_NOTE[f.id] ?? { text: 'Talhão novo: os avisos de risco, chuva e defensivos para esta cultura aparecem na próxima varredura dos dados oficiais.', chips: ['zarc', 'clima'] }
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:shadow-md">
      <div className="relative">
        <MiniFieldMap fields={[f]} className="h-36 w-full" height={144} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink shadow-sm ring-1 ring-border">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />{f.name}
        </span>
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div><div className="text-lg font-bold leading-tight text-ink">{f.crop}</div><div className="text-xs text-muted">{f.status}</div></div>
          <Badge tone={riskTone(f.risk)} className="shrink-0">Zarc hoje: {f.risk}% · {riskWord(f.risk)}</Badge>
        </div>
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-bg p-2.5 text-xs">
          <div><dt className="text-muted">Área</dt><dd className="font-semibold text-ink">{f.area.toLocaleString('pt-BR')} ha</dd></div>
          <div className="col-span-2"><dt className="text-muted">Solo</dt><dd className="font-semibold text-ink">{f.soil}</dd></div>
        </dl>
        {f.id === 2 && <MiniStrip />}
        <p className="text-sm leading-relaxed text-ink">{note.text}</p>
        <div className="flex flex-wrap gap-1.5">{note.chips.map((c) => <SourceChip key={c} k={c} />)}</div>
      </div>
      <footer className="flex gap-2 border-t border-border bg-bg/60 px-4 py-2.5">
        <Link to={`/prototipo/mapa?talhao=${f.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-ink"><MapIcon size={14} /> Ver no mapa</Link>
        <Link to={`/prototipo/talhoes?de=propriedade&talhao=${f.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-ink"><Pencil size={14} /> Editar</Link>
        <Link to="/prototipo/assistente" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-dark hover:bg-primary-soft"><Bot size={14} /> Perguntar à IA</Link>
      </footer>
    </article>
  )
}

function Overview() {
  const total = FIELDS.reduce((s, f) => s + f.area, 0)
  return (
    <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><MapIcon size={15} className="text-primary" /> {PRODUCER.farm} · {PRODUCER.municipality}/{PRODUCER.uf}</h2>
          <Link to="/prototipo/talhoes?de=propriedade" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"><Pencil size={13} /> Editar talhões</Link>
        </header>
        <MiniFieldMap fields={FIELDS} pin={[PRODUCER.lon, PRODUCER.lat]} labels scaleBar className="min-h-60 flex-1" height={230} />
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <Stat label="Área total" value={`${total.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`} hint={`${FIELDS.length} talhões desenhados no mapa`} icon={<Ruler size={16} />} />
        <Stat label="Para plantar" value={`${FIELDS.filter((f) => f.status === 'Aguardando plantio').length} talhões`} hint="aguardando a janela de plantio" icon={<Sprout size={16} />} tone="amber" />
        <div className="col-span-2 lg:col-span-1"><Stat label="Pede atenção" value="2 itens" hint="Magic vence em 10 dias · diesel baixo" icon={<AlertTriangle size={16} />} tone="red" /></div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ atividades */
type Act = { date: string; icon: LucideIcon; kind: string; title: string; detail: string; open?: { k: string; text: string; origin: 'real' | 'ilustrativo' } }
const ACTIVITIES: Act[] = [
  { date: '28/09', icon: ShoppingCart, kind: 'Compra', title: 'Ureia · 800 kg', detail: 'Entrada no estoque · R$ 3.440' },
  { date: '25/09', icon: SprayCan, kind: 'Aplicação', title: 'Glufos · 4 L', detail: 'Talhão 1 · dessecação antes do plantio da soja' },
  { date: '22/09', icon: SprayCan, kind: 'Aplicação', title: 'Magic · 1,5 L', detail: 'Talhão 3 · mofo-branco no feijão', open: { k: 'agrofit', text: 'Registrado para feijão contra mofo-branco · classe toxicológica 4', origin: 'real' } },
  { date: '20/09', icon: Tractor, kind: 'Preparo do solo', title: 'Gradagem', detail: 'Talhão 2 · solo ficou exposto', open: { k: 'clima', text: 'Chuva forte prevista na quinta (≈62 mm): solo exposto pode erodir', origin: 'ilustrativo' } },
  { date: '12/08', icon: Sprout, kind: 'Plantio', title: 'Feijão', detail: 'Talhão 3 · irrigado por aspersão · hoje: 51 dias', open: { k: 'zarc', text: 'Zoneamento: janela de risco baixo para o seu solo', origin: 'ilustrativo' } },
]

function Activities() {
  return (
    <Card title="Últimas atividades" action={<span className="text-xs text-muted">exemplo · 5 registros</span>}>
      <ol className="relative space-y-5 border-l-2 border-border pl-6">
        {ACTIVITIES.map((a) => (
          <li key={a.date + a.title} className="relative">
            <span className="absolute -left-[37px] top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-surface bg-primary-soft text-primary-dark ring-1 ring-border"><a.icon size={15} /></span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold text-ink">{a.kind}: {a.title}</span>
              <span className="text-xs text-muted">{a.date}</span>
            </div>
            <p className="text-sm text-muted">{a.detail}</p>
            {a.open && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-lg bg-info-soft/60 px-2.5 py-1.5 text-xs text-ink">
                <SourceChip k={a.open.k} /><span>{a.open.text}</span><OriginTag origin={a.open.origin} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </Card>
  )
}

/* ------------------------------------------------------------------ estoque */
type Row = { item: string; icon: LucideIcon; qty: string; badge?: { tone: 'amber' | 'red' | 'green'; text: string }; open?: { k: string; text: ReactNode; origin: 'real' | 'ilustrativo' } }
const STOCK: Row[] = [
  { item: 'Semente de milho', icon: Wheat, qty: '40 kg', badge: { tone: 'amber', text: 'Não basta para o Talhão 2 (faltam ~22 kg)' }, open: { k: 'zarc', text: 'Melhor época de plantio: a partir de 21/10', origin: 'real' } },
  { item: 'NPK (adubo)', icon: Package, qty: '1.150 kg', badge: { tone: 'green', text: 'Ok' } },
  { item: 'Ureia (adubo)', icon: Package, qty: '800 kg', badge: { tone: 'green', text: 'Ok' } },
  { item: 'Glufos (herbicida)', icon: SprayCan, qty: '12 L', badge: { tone: 'green', text: 'Ok' }, open: { k: 'agrofit', text: 'Confira no Agrofit as culturas em que ele é registrado', origin: 'ilustrativo' } },
  { item: 'Magic (fungicida)', icon: SprayCan, qty: '3,5 L', badge: { tone: 'amber', text: 'Vence em 12/10 (10 dias)' }, open: { k: 'agrofit', text: <span className="inline-flex items-center gap-1 font-semibold text-primary-dark"><ShieldCheck size={13} /> registrado p/ feijão · mofo-branco · classe 4</span>, origin: 'real' } },
  { item: 'Diesel', icon: Fuel, qty: '220 L', badge: { tone: 'red', text: 'Estoque baixo' } },
]

function Stock() {
  return (
    <Card title="Estoque" padded={false} action={<span className="text-xs text-muted">{STOCK.length} itens</span>}>
      <div className="p-2">
        <Table head={['Item', 'Quantidade', 'Situação', 'Dado aberto relacionado']}>
          {STOCK.map((r) => (
            <tr key={r.item} className="align-top">
              <td className="px-3 py-3"><span className="flex items-center gap-2 font-medium text-ink"><span className="grid h-8 w-8 place-items-center rounded-lg bg-bg text-muted"><r.icon size={15} /></span>{r.item}</span></td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{r.qty}</td>
              <td className="px-3 py-3">{r.badge && <Badge tone={r.badge.tone}>{r.badge.tone === 'green' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}{r.badge.text}</Badge>}</td>
              <td className="px-3 py-3">
                {r.open ? <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink"><SourceChip k={r.open.k} /><span>{r.open.text}</span><OriginTag origin={r.open.origin} /></div> : <span className="text-xs text-muted">—</span>}
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ custos */
function Costs() {
  const area = FIELDS.reduce((s, f) => s + f.area, 0)
  const maxCat = Math.max(...COST_BY_CATEGORY.map((c) => c.value))
  const maxPerHa = Math.max(...COST_BY_FIELD.map((c) => c.value / c.area))
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Gasto na safra 2026/27" value={brl0(COST_TOTAL)} hint="sementes, adubo, defensivos, diesel" icon={<Wallet size={16} />} />
        <Stat label="Custo por hectare" value={`${brl0(Math.round(COST_TOTAL / area))}/ha`} hint={`${area.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha no total`} icon={<Coins size={16} />} tone="blue" />
        <Stat label="Maior gasto: adubo" value={brl0(FERTILIZER_TOTAL)} hint={`${Math.round((FERTILIZER_TOTAL / COST_TOTAL) * 100)}% do total · NPK + ureia`} icon={<Receipt size={16} />} tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Para onde foi o dinheiro" action={<OriginTag origin="ilustrativo" />}>
          <div className="space-y-3">
            {COST_BY_CATEGORY.map((c) => (
              <div key={c.label}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-ink">{c.label}</span><span className="text-muted">{brl0(c.value)} · {Math.round((c.value / COST_TOTAL) * 100)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full" style={{ width: `${(c.value / maxCat) * 100}%`, background: c.color }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Custo de cada talhão" action={<OriginTag origin="ilustrativo" />}>
          <div className="space-y-3">
            {COST_BY_FIELD.map((c) => {
              const perHa = c.value / c.area
              return (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-ink">{c.name} <span className="font-normal text-muted">· {c.area.toLocaleString('pt-BR')} ha</span></span><span className="text-muted">{brl0(c.value)}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full" style={{ width: `${(perHa / maxPerHa) * 100}%`, background: c.color }} /></div>
                  <div className="mt-0.5 text-[11px] text-muted">{brl0(Math.round(perHa))} por hectare</div>
                </div>
              )
            })}
          </div>
        </Card>
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
  { id: 'plantio', label: 'Plantio', icon: Sprout, placeholder: 'Ex.: milho, 40 kg de semente', help: 'O AgroIA confere a janela do Zarc para este talhão e avisa se o risco estiver alto.', chips: ['zarc'] },
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
          <div className="mb-1 font-semibold">O que o AgroIA faz com este registro</div>
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
  const save = () => { setReg(false); setToast(true); window.setTimeout(() => setToast(false), 3500) }
  const tabs: { id: Tab; label: string; icon: LucideIcon; n?: number }[] = [
    { id: 'talhoes', label: 'Talhões', icon: Layers, n: FIELDS.length },
    { id: 'atividades', label: 'Atividades', icon: ClipboardList, n: ACTIVITIES.length },
    { id: 'estoque', label: 'Estoque', icon: Package, n: STOCK.length },
    { id: 'custos', label: 'Custos', icon: Wallet },
  ]
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Minha propriedade"
        subtitle={`${PRODUCER.farm} · ${PRODUCER.municipality}/${PRODUCER.uf} · gestão simples, ligada aos dados abertos`}
        actions={<Button onClick={() => setReg(true)}><Plus size={16} /> Registrar</Button>}
      />
      <Overview />
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
          {FIELDS.map((f) => <FieldCard key={f.id} f={f} />)}
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
