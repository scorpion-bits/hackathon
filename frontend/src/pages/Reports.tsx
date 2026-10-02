import { Coins, Download, Leaf, Ruler, Wheat } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AskAI } from '../components/data'
import { Button, Card, Empty, ErrorBox, Loading, PageHeader, Select, Stat, Table } from '../components/ui'
import { api } from '../lib/api'
import { brl, CATEGORY_LABEL, dateBR, num } from '../lib/format'
import { useApi } from '../lib/hooks'

const tick = { fontSize: 11, fill: 'var(--color-muted)' }

function BarsByCategory({ data, color }: { data: Record<string, number>; color: string }) {
  const rows = Object.entries(data).map(([k, v]) => ({ name: CATEGORY_LABEL[k] ?? k, value: v })).sort((a, b) => b.value - a.value)
  if (!rows.length) return <Empty>Sem valores nesta safra.</Empty>
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" tick={tick} />
          <YAxis tick={tick} tickFormatter={(v) => `${num(Number(v) / 1000, 1)}k`} />
          <Tooltip formatter={(v) => brl(Number(v))} />
          <Bar dataKey="value" name="Valor" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function downloadCsv(rows: { item: string; quantity: number; unit: string; value: number }[], season: string) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
  const lines = ['item;quantidade;unidade;valor_brl', ...rows.map((r) => [esc(r.item), String(r.quantity).replace('.', ','), esc(r.unit), r.value.toFixed(2).replace('.', ',')].join(';'))]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `consumo-insumos-${season.replace('/', '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const { data: farm, error: farmErr } = useApi(api.farm)
  const { data: fields } = useApi(api.fields)
  const [picked, setPicked] = useState<number | null>(null)
  const seasonId = picked ?? farm?.current_season?.id
  const { data: costs, error } = useApi(() => (farm ? api.costs(seasonId) : Promise.resolve(null)), [farm?.id, seasonId])

  const totalArea = useMemo(() => (fields ?? []).reduce((s, f) => s + f.area_ha, 0), [fields])
  if (farmErr || error) return <ErrorBox error={(farmErr ?? error)!} />
  if (!farm || !costs) return <Loading />

  const perHa = totalArea > 0 ? costs.applied_total / totalArea : null
  const byField = Object.entries(costs.applied_by_field).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const harvestTotals = costs.harvest.reduce<Record<string, number>>((acc, h) => ({ ...acc, [h.unit]: (acc[h.unit] ?? 0) + h.quantity }), {})
  const harvestLabel = Object.keys(harvestTotals).length ? Object.entries(harvestTotals).map(([u, q]) => `${num(q, 0)} ${u}`).join(' + ') : 'Nada colhido'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatórios de custos"
        subtitle={`Safra ${costs.season} · calculado a partir dos seus registros de compras, aplicações e colheitas`}
        actions={
          <Select aria-label="Safra" value={seasonId ?? ''} onChange={(e) => setPicked(Number(e.target.value))}>
            {farm.seasons.map((s) => <option key={s.id} value={s.id}>Safra {s.name}</option>)}
          </Select>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total comprado" value={brl(costs.purchased_total)} hint="entradas no período" icon={<Coins size={16} />} tone="amber" />
        <Stat label="Aplicado nas lavouras" value={brl(costs.applied_total)} hint="insumos usados nos talhões" icon={<Leaf size={16} />} />
        <Stat label="Custo aplicado por hectare" value={brl(perHa)} hint={`${num(totalArea, 2)} ha cadastrados`} icon={<Ruler size={16} />} tone="blue" />
        <Stat label="Produção colhida" value={harvestLabel} hint={`${costs.harvest.length} colheita(s)`} icon={<Wheat size={16} />} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Comprado por categoria"><BarsByCategory data={costs.purchased_by_category} color="var(--color-accent)" /></Card>
        <Card title="Aplicado por categoria"><BarsByCategory data={costs.applied_by_category} color="var(--color-primary)" /></Card>
      </div>

      <Card title="Aplicado por talhão">
        {byField.length === 0 ? <Empty>Nenhuma aplicação registrada por talhão nesta safra.</Empty> : (
          <div style={{ height: Math.max(120, byField.length * 48 + 30) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byField} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={tick} tickFormatter={(v) => `${num(Number(v) / 1000, 1)}k`} />
                <YAxis type="category" dataKey="name" tick={tick} width={90} />
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Bar dataKey="value" name="Aplicado" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Consumo de insumos"
          padded={false}
          action={costs.consumption.length > 0 ? <Button size="sm" variant="secondary" onClick={() => downloadCsv(costs.consumption, costs.season)}><Download size={13} /> Exportar CSV</Button> : undefined}
        >
          {costs.consumption.length === 0 ? <div className="p-4"><Empty>Nenhum consumo nesta safra.</Empty></div> : (
            <Table head={['Item', 'Quantidade', 'Unidade', 'Valor']}>
              {costs.consumption.map((c) => (
                <tr key={c.item}>
                  <td className="px-3 py-2 font-medium">{c.item}</td>
                  <td className="px-3 py-2">{num(c.quantity, 2)}</td>
                  <td className="px-3 py-2 text-muted">{c.unit}</td>
                  <td className="px-3 py-2">{brl(c.value)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Colheitas" padded={false}>
          {costs.harvest.length === 0 ? <div className="p-4"><Empty>Nenhuma colheita registrada nesta safra.</Empty></div> : (
            <Table head={['Talhão', 'Data', 'Cultura', 'Quantidade']}>
              {costs.harvest.map((h, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-medium">{h.field}</td>
                  <td className="px-3 py-2">{dateBR(h.date)}</td>
                  <td className="px-3 py-2">{h.crop}</td>
                  <td className="px-3 py-2">{num(h.quantity, 1)} {h.unit}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <Card title="Como calculamos">
        <p className="text-xs text-muted">{costs.method} O custo por hectare divide o total aplicado pela soma das áreas dos talhões cadastrados.</p>
        <div className="mt-3"><AskAI size="md" question="Analise meus custos desta safra e me diga onde estou gastando mais." /></div>
      </Card>
    </div>
  )
}
