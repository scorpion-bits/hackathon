import clsx from 'clsx'
import { AlertTriangle, Target, TrendingUp, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { SourceBadge, InfoKind } from '../../components/data'
import { Badge, Button, Card, Empty, Input, Label, PageHeader, Select, Stat, Table, Modal } from '../../components/ui'
import { brl, num, dateBR } from '../../lib/format'
import { useFarmFields } from '../farmStore'
import { cropOf } from '../components/interview/context'
import { type ScenarioT } from '../../lib/api'

function ScenarioCard({ scenario, isMain }: { scenario: ScenarioT; isMain?: boolean }) {
  return (
    <Card className={clsx(
      'flex-1 min-w-[250px]',
      isMain && 'ring-2 ring-primary',
      scenario.margin_negative && 'ring-2 ring-danger border-danger'
    )}>
      <div className="text-xs font-semibold uppercase text-muted mb-2">
        {scenario.label === 'pessimista' ? '⚠ Pessimista' :
         scenario.label === 'medio' ? '★ Cenário Médio' : '✦ Otimista'}
      </div>
      <div className="text-sm">Produtividade: {num(scenario.productivity, 1)} sacas/ha</div>
      <div className="text-sm mb-3">Preço: {brl(scenario.price_saca)}/saca</div>
      <hr className="mb-3 border-border" />
      <div className="space-y-3">
        <Stat label="Receita" value={brl(scenario.revenue)} tone="blue" />
        <Stat label="Custo total" value={brl(scenario.cost_total)} tone="gray" />
        <Stat label="Lucro"  value={brl(scenario.profit)}
              tone={scenario.margin_negative ? 'red' : 'green'}
              icon={scenario.margin_negative ? <AlertTriangle size={18} /> : <TrendingUp size={18} />} />
        <Badge tone={scenario.margin_negative ? 'red' : scenario.margin_pct < 15 ? 'amber' : 'green'} className="w-full justify-center text-sm py-1">
          {scenario.margin_negative && '⚠ '} Margem: {scenario.margin_pct}%
        </Badge>
      </div>
    </Card>
  )
}

function BreakevenDisplay({ breakeven, text }: { breakeven: number; text: string }) {
  return (
    <Card className="border-l-4 border-l-accent">
      <div className="flex items-center gap-4 p-2">
        <Target size={32} className="text-accent shrink-0" />
        <div>
          <div className="text-sm font-semibold text-muted uppercase tracking-wider mb-1">Ponto de equilíbrio</div>
          <div className="text-2xl font-bold text-ink leading-none mb-1">{num(breakeven, 1)} sacas/ha</div>
          <p className="text-sm text-muted">{text}</p>
        </div>
      </div>
    </Card>
  )
}

export default function ProtoSimulationPage() {
  const fields = useFarmFields()
  const [params, setParams] = useState({
    field_id: 0, crop: '', area_ha: 0,
    productivity: 0, price_saca: 0, cost_ha: 0,
    price_var_pct: 12, prod_var_pct: 15,
  })
  
  const DEFAULTS: Record<string, any> = {
    'Soja': { productivity_sacas_ha: 60, price_saca: 131, cost_ha: 4800, price_source: 'CONAB ago/2026', prod_source: 'IBGE LSPA', cost_source: 'CONAB' },
    'Milho': { productivity_sacas_ha: 90, price_saca: 72, cost_ha: 4200, price_source: 'CONAB ago/2026', prod_source: 'IBGE LSPA', cost_source: 'CONAB' },
    'Feijão': { productivity_sacas_ha: 25, price_saca: 310, cost_ha: 5500, price_source: 'CONAB ago/2026', prod_source: 'IBGE LSPA', cost_source: 'CONAB' },
    'Café': { productivity_sacas_ha: 30, price_saca: 1200, cost_ha: 20000, price_source: 'CONAB', prod_source: 'IBGE', cost_source: 'CONAB' },
    'Cana-de-açúcar': { productivity_sacas_ha: 80, price_saca: 150, cost_ha: 8000, price_source: 'UDOP', prod_source: 'IBGE', cost_source: 'Estimativa' },
    'Laranja': { productivity_sacas_ha: 800, price_saca: 40, cost_ha: 15000, price_source: 'CEPEA', prod_source: 'IBGE', cost_source: 'Estimativa' },
    'Amendoim': { productivity_sacas_ha: 150, price_saca: 90, cost_ha: 8000, price_source: 'CONAB', prod_source: 'IBGE', cost_source: 'CONAB' },
    'Mandioca': { productivity_sacas_ha: 20, price_saca: 800, cost_ha: 6000, price_source: 'CEPEA', prod_source: 'IBGE', cost_source: 'Estimativa' },
    'Hortaliças': { productivity_sacas_ha: 1, price_saca: 1000, cost_ha: 1000, price_source: 'Genérico', prod_source: 'Genérico', cost_source: 'Genérico' },
    'Pastagem': { productivity_sacas_ha: 1, price_saca: 500, cost_ha: 1500, price_source: 'Genérico', prod_source: 'Genérico', cost_source: 'Genérico' },
    'Trigo': { productivity_sacas_ha: 50, price_saca: 80, cost_ha: 2500, price_source: 'CONAB', prod_source: 'IBGE', cost_source: 'CONAB' },
  }
  
  const [sources, setSources] = useState<Record<string, string>>({})
  const [confidence, setConfidence] = useState<string>('high')
  const [sourceWarning, setSourceWarning] = useState<string | null>(null)
  
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sims, setSims] = useState<any[]>([])
  const [compareSims, setCompareSims] = useState<any[]>([])

  useEffect(() => {
    if (params.field_id) {
      const f = fields.find(x => x.id === params.field_id)
      if (f) {
        const c = cropOf(f)
        const cropName = c ? c.label : ''
        setParams(p => ({ ...p, area_ha: f.areaHa || p.area_ha, crop: cropName || p.crop }))
      }
    }
  }, [params.field_id, fields])

  useEffect(() => {
    if (!params.crop) return
    const d = DEFAULTS[params.crop]
    if (d) {
      setSourceWarning(null)
      setParams(prev => ({
        ...prev,
        productivity: d.productivity_sacas_ha,
        price_saca: d.price_saca,
        cost_ha: d.cost_ha,
      }))
      setSources({
        price: d.price_source,
        productivity: d.prod_source,
        cost: d.cost_source,
      })
      setConfidence('high')
    } else {
      setSourceWarning('Não foi possível carregar dados de referência. Usando modo manual.')
      setConfidence('low')
      setSources({})
    }
  }, [params.crop])

  const result = useMemo(() => {
    if (!params.area_ha || !params.productivity || !params.price_saca || !params.cost_ha)
      return null
      
    const calc = (prod: number, price: number) => {
      const production = params.area_ha * prod
      const revenue = production * price
      const cost = params.area_ha * params.cost_ha
      const profit = revenue - cost
      const margin = revenue > 0 ? (profit / revenue) * 100 : -100
      return { productivity: prod, price_saca: price, production_total: production,
               revenue, cost_total: cost, profit, margin_pct: +margin.toFixed(1),
               margin_negative: profit < 0 }
    }
    
    const pv = params.price_var_pct / 100
    const dv = params.prod_var_pct / 100
    
    return {
      pessimistic: { label: 'pessimista', ...calc(params.productivity * (1 - dv), params.price_saca * (1 - pv)) },
      medium: { label: 'medio', ...calc(params.productivity, params.price_saca) },
      optimistic: { label: 'otimista', ...calc(params.productivity * (1 + dv * 0.67), params.price_saca * (1 + pv * 0.9)) },
      breakeven_sacas_ha: +(params.cost_ha / params.price_saca).toFixed(2),
      breakeven_text: `Você precisa colher pelo menos ${(params.cost_ha / params.price_saca).toFixed(1)} sacas por hectare para cobrir os custos de R$ ${params.cost_ha.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/ha.`,
      baseline_text: `Se não plantar, o custo fixo da terra continua. A área de ${params.area_ha} ha ficará ociosa, sem gerar receita para cobrir despesas fixas.`,
    }
  }, [params])

  const handleSave = () => {
    if (!result || !params.crop) return
    const name = prompt('Nome da simulação:', `${params.crop} - ${new Date().toLocaleDateString('pt-BR')}`)
    if (!name) return
    
    setSims(prev => [{
      id: Date.now(),
      name,
      crop: params.crop,
      area_ha: params.area_ha,
      results: result,
      created_at: new Date().toISOString()
    }, ...prev])
    alert('Simulação salva com sucesso no protótipo!')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <PageHeader 
        title="Simulação Financeira" 
        subtitle="Modele cenários antes de decidir. (Protótipo visual)"
        actions={
          <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
            Histórico / Comparar ({sims.length})
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <Card title="Contexto">
            <div className="space-y-4">
              <Label label="Talhão (opcional)">
                <Select value={params.field_id} onChange={e => setParams({...params, field_id: +e.target.value})}>
                  <option value={0}>Simulação genérica</option>
                  {fields?.map(f => <option key={f.id} value={f.id}>{f.name} ({f.areaHa} ha)</option>)}
                </Select>
              </Label>
              
              <Label label="Cultura">
                <Select value={params.crop} onChange={e => setParams({...params, crop: e.target.value})}>
                  <option value="">Selecione...</option>
                  {Object.keys(DEFAULTS).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Label>

              <Label label="Área (ha)">
                <Input type="number" min={0.1} step={0.1} value={params.area_ha || ''} onChange={e => setParams({...params, area_ha: +e.target.value})} />
              </Label>
            </div>
          </Card>

          <Card title="Parâmetros">
            <div className="space-y-4">
              <Label label="Produtividade média (sacas/ha)" hint={sources.productivity && <span className="text-[10px] text-info">Fonte: {sources.productivity}</span>}>
                <Input type="number" min={1} value={params.productivity || ''} onChange={e => setParams({...params, productivity: +e.target.value})} />
              </Label>
              
              <Label label="Preço da saca (R$)" hint={sources.price && <span className="text-[10px] text-info">Fonte: {sources.price}</span>}>
                <Input type="number" min={1} value={params.price_saca || ''} onChange={e => setParams({...params, price_saca: +e.target.value})} />
              </Label>
              
              <Label label="Custo por hectare (R$/ha)" hint={sources.cost && <span className="text-[10px] text-info">Fonte: {sources.cost}</span>}>
                <Input type="number" min={100} value={params.cost_ha || ''} onChange={e => setParams({...params, cost_ha: +e.target.value})} />
              </Label>
            </div>
          </Card>

          <Card title="Sensibilidade (Variação %)">
            <div className="grid grid-cols-2 gap-4">
              <Label label="Variação Preço (%)">
                <Input type="number" min={0} max={50} value={params.price_var_pct} onChange={e => setParams({...params, price_var_pct: +e.target.value})} />
              </Label>
              <Label label="Variação Produt. (%)">
                <Input type="number" min={0} max={50} value={params.prod_var_pct} onChange={e => setParams({...params, prod_var_pct: +e.target.value})} />
              </Label>
            </div>
          </Card>
          
          <Button className="w-full" disabled={!result} onClick={handleSave}>
            Salvar Simulação
          </Button>
          
          {confidence === 'low' && (
            <div className="rounded border border-warning/30 bg-warning/10 p-3 text-sm text-warning-dark">
              <InfoKind kind="estimativa" /> {sourceWarning || 'Usando valores declarados manualmente.'}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-8">
          {result ? (
            <>
              <div className="flex flex-wrap gap-4">
                <ScenarioCard scenario={result.pessimistic as any} />
                <ScenarioCard scenario={result.medium as any} isMain />
                <ScenarioCard scenario={result.optimistic as any} />
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <BreakevenDisplay breakeven={result.breakeven_sacas_ha} text={result.breakeven_text} />
                
                <Card title="Linha de base: Fazer nada">
                  <p className="text-sm text-muted">{result.baseline_text}</p>
                </Card>
              </div>
              
              {Object.keys(sources).length > 0 && (
                <Card title="Premissas e Fontes" padded={false}>
                  <div className="p-4 flex flex-col gap-2">
                    {sources.price && <div><span className="text-xs text-muted font-medium w-24 inline-block uppercase">Preço:</span> <SourceBadge source={{key: 'price', name: sources.price}} /></div>}
                    {sources.productivity && <div><span className="text-xs text-muted font-medium w-24 inline-block uppercase">Produtividade:</span> <SourceBadge source={{key: 'prod', name: sources.productivity}} /></div>}
                    {sources.cost && <div><span className="text-xs text-muted font-medium w-24 inline-block uppercase">Custo:</span> <SourceBadge source={{key: 'cost', name: sources.cost}} /></div>}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Empty>Preencha os parâmetros à esquerda para visualizar os cenários da safra.</Empty>
          )}
        </div>
      </div>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Histórico de Simulações" wide>
        {sims.length === 0 ? <Empty>Nenhuma simulação salva no protótipo ainda.</Empty> :
        <Table head={['Nome', 'Cultura', 'Área', 'Lucro (médio)', 'Margem', 'Data', '']}>
          {sims.map(s => (
            <tr key={s.id} className="cursor-pointer hover:bg-bg transition-colors" onClick={() => {
              setCompareSims(prev => {
                if (prev.find(x => x.id === s.id)) return prev.filter(x => x.id !== s.id)
                if (prev.length >= 2) return [prev[1], s]
                return [...prev, s]
              })
            }}>
              <td className="px-3 py-3 font-medium text-ink">{s.name}</td>
              <td className="px-3 py-3">{s.crop}</td>
              <td className="px-3 py-3">{num(s.area_ha, 1)} ha</td>
              <td className="px-3 py-3 font-medium">{brl(s.results?.medium?.profit)}</td>
              <td className="px-3 py-3">
                <Badge tone={s.results?.medium?.margin_negative ? 'red' : 'green'}>
                  {s.results?.medium?.margin_pct}%
                </Badge>
              </td>
              <td className="px-3 py-3 text-muted">{dateBR(s.created_at)}</td>
              <td className="px-3 py-3 text-right">
                <Button size="sm" variant="ghost" onClick={(e) => { 
                  e.stopPropagation()
                  setSims(prev => prev.filter(x => x.id !== s.id))
                  setCompareSims(prev => prev.filter(x => x.id !== s.id))
                }}>
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </Table>
        }
        
        {compareSims.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold border-b border-border pb-2">Comparação: {compareSims.map(s => s.name).join(' vs ')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Pessimista', ...Object.fromEntries(compareSims.map(s => [s.name, s.results.pessimistic.profit])) },
                  { name: 'Médio', ...Object.fromEntries(compareSims.map(s => [s.name, s.results.medium.profit])) },
                  { name: 'Otimista', ...Object.fromEntries(compareSims.map(s => [s.name, s.results.optimistic.profit])) },
                ]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => `${num(Number(v) / 1000, 1)}k`} />
                  <RechartsTooltip formatter={(v) => brl(Number(v))} />
                  {compareSims.map((s, i) => (
                    <Bar key={s.id} dataKey={s.name} fill={i === 0 ? 'var(--color-primary)' : 'var(--color-accent)'} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-right">
              <Button variant="secondary" onClick={() => setCompareSims([])}>Limpar Comparação</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
