// Histórico de movimentações de um item.
import { ArrowDownToLine, ArrowUpFromLine, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type StockItemT } from '../../lib/api'
import { brl, dateBR, num } from '../../lib/format'
import { useApi } from '../../lib/hooks'
import { Badge, Empty, ErrorBox, Loading, Modal, Table } from '../ui'

export function HistoryModal({ item, onClose }: { item: StockItemT | null; onClose: () => void }) {
  const { data, error } = useApi(() => (item ? api.movements(item.id) : Promise.resolve([])), [item?.id])
  return (
    <Modal open={!!item} onClose={onClose} title={`Histórico · ${item?.name ?? ''}`} wide>
      {error && <ErrorBox error={error} />}
      {!data && !error && <Loading />}
      {data && data.length === 0 && <Empty>Nenhuma movimentação ainda.</Empty>}
      {data && data.length > 0 && (
        <Table head={['Data', 'Tipo', 'Quantidade', 'Valor', 'Fornecedor / nota', 'Caderno']}>
          {data.map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap px-3 py-2">{dateBR(m.date)}</td>
              <td className="px-3 py-2">
                {m.kind === 'entrada' ? <Badge tone="green"><ArrowDownToLine size={11} /> Entrada</Badge>
                  : m.kind === 'saida' ? <Badge tone="amber"><ArrowUpFromLine size={11} /> Saída</Badge> : <Badge>Ajuste</Badge>}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{num(m.quantity, 2)} {m.unit}</td>
              <td className="whitespace-nowrap px-3 py-2">{brl(m.value)}</td>
              <td className="px-3 py-2 text-xs text-muted">{m.supplier ?? m.note ?? '—'}{m.supplier && m.note ? ` · ${m.note}` : ''}</td>
              <td className="px-3 py-2 text-xs">
                {m.event_id ? <Link to="/producao" className="inline-flex items-center gap-1 text-primary hover:underline"><Link2 size={11} /> evento #{m.event_id}</Link> : '—'}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  )
}
