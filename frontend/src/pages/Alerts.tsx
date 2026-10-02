import clsx from 'clsx'
import { AlertTriangle, ArrowRight, Bell, CheckCheck, CloudRain, Info, Package, ShieldAlert, Sprout } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AskAI, SourceBadge } from '../components/data'
import { Badge, Button, Card, Empty, ErrorBox, Loading, PageHeader } from '../components/ui'
import { api, notifyDataChanged, type AlertT } from '../lib/api'
import { useApi } from '../lib/hooks'

const KIND_ICON = { estoque: Package, validade: ShieldAlert, zarc: Sprout, clima: CloudRain }
const KIND_LABEL: Record<string, string> = { estoque: 'Estoque', validade: 'Validade', zarc: 'Plantio (Zarc)', clima: 'Clima' }
const SEVERITY: { key: AlertT['severity']; label: string; tone: 'red' | 'amber' | 'blue' }[] = [
  { key: 'critico', label: 'Crítico', tone: 'red' },
  { key: 'atencao', label: 'Atenção', tone: 'amber' },
  { key: 'info', label: 'Informação', tone: 'blue' },
]
type ReadFilter = 'todos' | 'nao-lidos' | 'lidos'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={clsx('rounded-full border px-3 py-1 text-xs font-medium transition',
      active ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-muted hover:text-ink')}>
      {children}
    </button>
  )
}

export default function Alerts() {
  const { data, error } = useApi(api.alerts)
  const fields = useApi(api.fields)
  const items = useApi(api.items)
  const location = useLocation()
  const navigate = useNavigate()
  const [kind, setKind] = useState<string>('todos')
  const [readF, setReadF] = useState<ReadFilter>('todos')
  const [selected, setSelected] = useState<string | null>((location.state as { open?: string } | null)?.open ?? null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // alerta pedido pelo sino/painel: abre e limpa o state para não reabrir ao voltar
  useEffect(() => {
    const open = (location.state as { open?: string } | null)?.open
    if (open) {
      setSelected(open)
      setKind('todos'); setReadF('todos')
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  const all = data ?? []
  const visible = useMemo(() => all.filter((a) =>
    (kind === 'todos' || a.kind === kind) &&
    (readF === 'todos' || (readF === 'lidos' ? a.read : !a.read))), [all, kind, readF])
  const sel = all.find((a) => a.key === selected) ?? visible[0] ?? null
  const unread = all.filter((a) => !a.read).length

  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading />

  async function markRead(a: AlertT) {
    setBusy(true); setActionError(null)
    try { await api.readAlert(a.key); notifyDataChanged() } catch (e) { setActionError((e as Error).message) } finally { setBusy(false) }
  }

  const fieldNames = (ids: number[]) => ids.map((id) => fields.data?.find((f) => f.id === id)).filter(Boolean)
  const itemList = (ids: number[]) => ids.map((id) => items.data?.find((i) => i.id === id)).filter(Boolean)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alertas"
        subtitle={unread ? `${unread} alerta(s) não lido(s) · calculados a partir dos seus registros e de dados oficiais` : 'Tudo em dia · nenhum alerta novo'}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted">Tipo</span>
          <Chip active={kind === 'todos'} onClick={() => setKind('todos')}>Todos</Chip>
          {Object.entries(KIND_LABEL).map(([k, l]) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{l}</Chip>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted">Situação</span>
          <Chip active={readF === 'todos'} onClick={() => setReadF('todos')}>Todos</Chip>
          <Chip active={readF === 'nao-lidos'} onClick={() => setReadF('nao-lidos')}>Não lidos</Chip>
          <Chip active={readF === 'lidos'} onClick={() => setReadF('lidos')}>Lidos</Chip>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {visible.length === 0 && <Empty>{all.length === 0 ? 'Nenhum alerta no momento. Bom sinal!' : 'Nenhum alerta com esses filtros.'}</Empty>}
          {SEVERITY.map(({ key, label, tone }) => {
            const group = visible.filter((a) => a.severity === key)
            if (!group.length) return null
            return (
              <Card key={key} title={<span className="flex items-center gap-2">{label} <Badge tone={tone}>{group.length}</Badge></span>} padded={false}>
                <ul className="divide-y divide-border">
                  {group.map((a) => {
                    const Icon = KIND_ICON[a.kind] ?? AlertTriangle
                    const active = sel?.key === a.key
                    return (
                      <li key={a.key}>
                        <button onClick={() => setSelected(a.key)} className={clsx('flex w-full items-start gap-3 p-3 text-left hover:bg-bg', active && 'bg-primary-soft/50', a.read && 'opacity-60')}>
                          <span className={clsx('mt-0.5 rounded-lg p-1.5', a.severity === 'critico' ? 'bg-danger-soft text-danger' : a.severity === 'info' ? 'bg-info-soft text-info' : 'bg-accent-soft text-accent')}><Icon size={16} /></span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-medium text-ink">{a.title}</span>
                              {!a.read && <span className="h-2 w-2 shrink-0 rounded-full bg-danger" title="Não lido" />}
                            </span>
                            <span className="line-clamp-2 block text-xs text-muted">{a.why}</span>
                            <span className="mt-1 block text-[11px] text-muted">{KIND_LABEL[a.kind]}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-3">
          {sel ? (
            <Card padded={false}>
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={sel.severity === 'critico' ? 'red' : sel.severity === 'info' ? 'blue' : 'amber'}>{SEVERITY.find((s) => s.key === sel.severity)?.label}</Badge>
                  <Badge>{KIND_LABEL[sel.kind]}</Badge>
                  {sel.read && <Badge tone="green"><CheckCheck size={12} /> lido</Badge>}
                </div>
                <h2 className="text-xl font-bold text-ink">{sel.title}</h2>

                <div className="rounded-lg bg-bg p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Por que isso importa para você</div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{sel.why}</p>
                </div>

                {sel.field_ids.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Talhões afetados</div>
                    <div className="flex flex-wrap gap-1.5">
                      {fieldNames(sel.field_ids).map((f) => f && (
                        <span key={f.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-sm">
                          <span className="h-3 w-1 rounded-full" style={{ background: f.color ?? 'var(--color-primary)' }} />{f.name}
                          <span className="text-xs text-muted">{f.status.label}</span>
                        </span>
                      ))}
                      {fields.data == null && <span className="text-sm text-muted">Carregando…</span>}
                    </div>
                  </div>
                )}

                {sel.item_ids.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Itens afetados</div>
                    <ul className="space-y-1">
                      {itemList(sel.item_ids).map((i) => i && (
                        <li key={i.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-sm">
                          <span className="font-medium">{i.name}</span>
                          <span className="text-xs text-muted">
                            saldo {i.quantity.toLocaleString('pt-BR')} {i.unit}
                            {i.days_to_expiry != null && ` · vence em ${i.days_to_expiry} dia(s)`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {sel.source && <div><SourceBadge source={sel.source} /></div>}
                {actionError && <ErrorBox error={actionError} />}

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {sel.link && <Button variant="secondary" onClick={() => navigate(sel.link)}>Ir para <ArrowRight size={14} /></Button>}
                  {!sel.read && <Button variant="secondary" onClick={() => markRead(sel)} disabled={busy}><CheckCheck size={14} /> Marcar como lido</Button>}
                  <AskAI
                    size="md"
                    label="Perguntar à IA sobre isto"
                    question={`Quais as implicações deste alerta para a minha propriedade: ${sel.title}?`}
                    context={{ alert: { title: sel.title, why: sel.why, kind: sel.kind }, field_ids: sel.field_ids }}
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Empty><Bell className="mx-auto mb-2" size={24} />Selecione um alerta para ver os detalhes.</Empty>
          )}
        </div>
      </div>

      <Card title={<span className="flex items-center gap-2"><Info size={16} /> Como os alertas são criados</span>}>
        <ul className="grid gap-2 text-sm text-muted md:grid-cols-2">
          <li><b className="text-ink">Estoque:</b> o saldo de um produto ficou abaixo do mínimo que você definiu.</li>
          <li><b className="text-ink">Validade:</b> o produto vence em 30 dias ou menos (ou já venceu).</li>
          <li><b className="text-ink">Plantio (Zarc):</b> plantio em período de risco de 30% ou mais, ou fora da janela do Zoneamento Agrícola de Risco Climático (MAPA).</li>
          <li><b className="text-ink">Clima:</b> previsão de 7 dias com chuva de 50 mm/dia ou mais, ou temperatura mínima de 3 °C ou menos.</li>
        </ul>
        <p className="mt-3 text-[11px] text-muted">Alertas são avisos, não ordens: previsões mudam e o Zarc é uma referência oficial. Em caso de dúvida, fale com um engenheiro agrônomo.</p>
      </Card>
    </div>
  )
}
