// Estoque: indicadores, tabela de itens, entradas/saídas, histórico, consulta Agrofit.
import clsx from 'clsx'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CalendarClock, Coins, History, Pencil, Plus, Search, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AgrofitModal } from '../components/stock/AgrofitModal'
import { HistoryModal } from '../components/stock/HistoryModal'
import { ItemFormModal } from '../components/stock/ItemFormModal'
import { MovementModal } from '../components/stock/MovementModal'
import { Badge, Button, Card, Empty, ErrorBox, Input, Loading, PageHeader, Select, Stat, Table } from '../components/ui'
import { api, type StockItemT } from '../lib/api'
import { brl, CATEGORY_LABEL, dateBR, num } from '../lib/format'
import { useApi } from '../lib/hooks'

function ExpiryBadge({ item }: { item: StockItemT }) {
  if (!item.expiry_date) return <span className="text-muted">—</span>
  const d = item.days_to_expiry
  const tone = d != null && d < 0 ? 'red' : d != null && d <= 7 ? 'red' : d != null && d <= 30 ? 'amber' : 'gray'
  return (
    <span className="inline-flex flex-col">
      <span>{dateBR(item.expiry_date)}</span>
      {d != null && d <= 30 && item.quantity > 0 && <Badge tone={tone}>{d < 0 ? `vencido há ${-d} d` : d === 0 ? 'vence hoje' : `vence em ${d} d`}</Badge>}
    </span>
  )
}

export default function Stock() {
  const items = useApi(api.items)
  const fields = useApi(api.fields)
  const moves = useApi(() => api.movements())
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState<{ item: StockItemT | null } | null>(null)
  const [move, setMove] = useState<{ kind: 'entrada' | 'saida'; item: StockItemT } | null>(null)
  const [history, setHistory] = useState<StockItemT | null>(null)
  const [agro, setAgro] = useState<StockItemT | null>(null)

  const crops = useMemo(() => [...new Set((fields.data ?? []).flatMap((f) => [f.crop, f.status.crop]).filter((c): c is string => !!c))].sort(), [fields.data])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (items.data ?? []).filter((i) => (!cat || i.category === cat) && (!t || i.name.toLowerCase().includes(t) || (i.supplier ?? '').toLowerCase().includes(t)))
  }, [items.data, cat, q])

  if (items.error) return <ErrorBox error={items.error} />
  if (!items.data) return <Loading />
  const all = items.data
  const totalValue = all.reduce((s, i) => s + (i.stock_value ?? 0), 0)
  const low = all.filter((i) => i.low_stock)
  const expiring = all.filter((i) => i.days_to_expiry != null && i.days_to_expiry <= 30 && i.quantity > 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estoque"
        subtitle="Insumos, saldos e validade · o saldo baixa sozinho quando você registra uma aplicação"
        actions={<Button onClick={() => setForm({ item: null })}><Plus size={15} /> Novo produto</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Valor em estoque" value={brl(totalValue)} hint={`${all.length} produtos · pelo preço médio de compra`} icon={<Coins size={16} />} tone="blue" />
        <Stat label="Estoque baixo" value={low.length} hint={low.length ? low.map((i) => i.name.split(' (')[0]).slice(0, 3).join(', ') : 'tudo acima do mínimo'} icon={<AlertTriangle size={16} />} tone={low.length ? 'amber' : 'green'} />
        <Stat label="Vencendo em até 30 dias" value={expiring.length} hint={expiring.length ? expiring.map((i) => i.name.split(' (')[0]).slice(0, 3).join(', ') : 'nada perto de vencer'} icon={<CalendarClock size={16} />} tone={expiring.length ? 'red' : 'green'} />
      </div>

      <Card
        title="Produtos"
        padded={false}
        action={
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input className="!w-48 !py-1 !pl-8 text-xs" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select className="!w-auto !py-1 text-xs" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
              <option value="">Todas as categorias</option>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        }
      >
        {list.length === 0 ? (
          <div className="p-4"><Empty>Nenhum produto encontrado.</Empty></div>
        ) : (
          <Table head={['Produto', 'Categoria', 'Saldo', 'Mínimo', 'Validade', 'Preço médio', 'Valor', 'Fornecedor', 'Ações']}>
            {list.map((i) => (
              <tr key={i.id} className={clsx(i.low_stock && 'bg-accent-soft/50')}>
                <td className="px-3 py-2 font-medium">
                  {i.name}
                  {i.low_stock && <Badge tone="amber" className="ml-2"><AlertTriangle size={10} /> baixo</Badge>}
                </td>
                <td className="px-3 py-2 text-muted">{CATEGORY_LABEL[i.category]}</td>
                <td className="whitespace-nowrap px-3 py-2 font-semibold">{num(i.quantity, 2)} {i.unit}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted">{num(i.min_quantity, 2)} {i.unit}</td>
                <td className="px-3 py-2"><ExpiryBadge item={i} /></td>
                <td className="whitespace-nowrap px-3 py-2">{i.avg_price != null ? `${brl(i.avg_price)}/${i.unit}` : '—'}</td>
                <td className="whitespace-nowrap px-3 py-2">{brl(i.stock_value)}</td>
                <td className="px-3 py-2 text-xs text-muted">{i.supplier ?? '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setMove({ kind: 'entrada', item: i })} title="Registrar compra"><ArrowDownToLine size={13} /> Entrada</Button>
                    <Button size="sm" variant="secondary" onClick={() => setMove({ kind: 'saida', item: i })} title="Registrar uso ou saída"><ArrowUpFromLine size={13} /> Saída</Button>
                    <Button size="sm" variant="ghost" onClick={() => setForm({ item: i })} title="Editar produto"><Pencil size={13} /> Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setHistory(i)} title="Ver histórico"><History size={13} /> Histórico</Button>
                    {i.category === 'defensivo' && (
                      <Button size="sm" variant="ghost" className="text-info" onClick={() => setAgro(i)} title="Consultar registro (Agrofit)"><ShieldCheck size={13} /> Registro</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Movimentações recentes" padded={false}>
        {moves.error && <div className="p-4"><ErrorBox error={moves.error} /></div>}
        {moves.data && moves.data.length === 0 && <div className="p-4"><Empty>Sem movimentações.</Empty></div>}
        {moves.data && moves.data.length > 0 && (
          <Table head={['Data', 'Produto', 'Tipo', 'Quantidade', 'Valor', 'Origem']}>
            {moves.data.slice(0, 10).map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap px-3 py-2">{dateBR(m.date)}</td>
                <td className="px-3 py-2 font-medium">{m.item_name}</td>
                <td className="px-3 py-2">
                  {m.kind === 'entrada' ? <Badge tone="green"><ArrowDownToLine size={11} /> Entrada</Badge> : m.kind === 'saida' ? <Badge tone="amber"><ArrowUpFromLine size={11} /> Saída</Badge> : <Badge>Ajuste</Badge>}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{num(m.quantity, 2)} {m.unit}</td>
                <td className="whitespace-nowrap px-3 py-2">{brl(m.value)}</td>
                <td className="px-3 py-2 text-xs text-muted">{m.supplier ?? m.note ?? '—'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <ItemFormModal open={!!form} item={form?.item} crops={crops} onClose={() => setForm(null)} />
      <MovementModal open={!!move} kind={move?.kind ?? 'entrada'} item={move?.item ?? null} fields={fields.data ?? []} onClose={() => setMove(null)} />
      <HistoryModal item={history} onClose={() => setHistory(null)} />
      <AgrofitModal item={agro} crops={crops} onClose={() => setAgro(null)} />
    </div>
  )
}
