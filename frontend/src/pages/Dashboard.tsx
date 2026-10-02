import { Bell, CloudRain, Coins, Layers, Package, Plane, Sprout } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertRow, AskAI, InfoKind, SourceBadge } from '../components/data'
import { FieldsMap } from '../components/FieldsMap'
import { Badge, Card, ErrorBox, Loading, PageHeader, Stat } from '../components/ui'
import { api } from '../lib/api'
import { brl, dateBR, dayMonth, EVENT_LABEL, num, weekday } from '../lib/format'
import { useApi } from '../lib/hooks'

const STAGE_TONE = { plantado: 'green', colhido: 'amber', vazio: 'gray' } as const

export default function Dashboard() {
  const { data, error } = useApi(api.dashboard)
  const nav = useNavigate()
  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading />
  const { kpis, weather, region } = data

  return (
    <div className="space-y-5">
      <PageHeader
        title="Painel da propriedade"
        subtitle={`Safra ${data.season} · visão geral do que está acontecendo hoje`}
        actions={<AskAI size="md" label="Resumo da semana com IA" question="Me dê um resumo da semana da minha propriedade: talhões, alertas, clima e estoque." />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Área em talhões" value={`${num(kpis.area_ha)} ha`} hint={`${kpis.fields} talhões · ${kpis.planted} plantado(s)`} icon={<Layers size={16} />} />
        <Stat label="Gasto da safra" value={brl(kpis.season_purchased)} hint={`aplicado nas lavouras: ${brl(kpis.season_applied)}`} icon={<Coins size={16} />} tone="amber" />
        <Stat label="Estoque" value={brl(kpis.stock_value)} hint={`${kpis.items_attention} item(ns) pedem atenção`} icon={<Package size={16} />} tone="blue" />
        <Stat label="Alertas" value={kpis.alerts_open} hint="abertos" icon={<Bell size={16} />} tone={kpis.alerts_open ? 'red' : 'green'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Talhões" className="lg:col-span-2" action={<Link to="/mapa" className="text-xs font-medium text-primary hover:underline">Abrir mapa</Link>} padded={false}>
          <div className="grid md:grid-cols-5">
            <div className="h-72 md:col-span-3"><FieldsMap fields={data.fields} onSelect={(id) => nav('/mapa', { state: { field: id } })} /></div>
            <ul className="divide-y divide-border md:col-span-2">
              {data.fields.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="h-8 w-1.5 rounded-full" style={{ background: f.color ?? 'var(--color-primary)' }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{f.name} <span className="font-normal text-muted">· {num(f.area_ha, 2)} ha</span></div>
                    <div className="truncate text-xs text-muted">{f.status.label}</div>
                  </div>
                  <Badge tone={STAGE_TONE[f.status.stage]}>{f.status.stage}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Alertas" action={<Link to="/alertas" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>} padded={false}>
          <div className="p-2">
            {data.alerts.length === 0 && <p className="p-3 text-sm text-muted">Nenhum alerta.</p>}
            {data.alerts.map((a) => <AlertRow key={a.key} alert={a} onOpen={() => nav('/alertas', { state: { open: a.key } })} />)}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title={<span className="flex items-center gap-2"><CloudRain size={16} /> Clima na propriedade</span>} action={<Link to="/clima" className="text-xs font-medium text-primary hover:underline">Detalhes</Link>}>
          {!weather.available ? (
            <p className="text-sm text-muted">{weather.error ?? 'Previsão indisponível.'}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{num(weather.current?.temp, 0)}°C</div>
                  <div className="text-sm text-muted">{weather.current?.summary} · umidade {weather.current?.humidity}%</div>
                </div>
                <InfoKind kind={weather.status === 'simulated' ? 'simulado' : 'previsao'} />
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {weather.daily?.slice(0, 7).map((d) => (
                  <div key={d.date} className="rounded-lg bg-bg p-1.5">
                    <div className="text-[10px] uppercase text-muted">{weekday(d.date)}</div>
                    <div className="text-xs font-semibold">{num(d.tmax, 0)}°</div>
                    <div className={`text-[11px] ${d.rain_mm >= 50 ? 'font-bold text-danger' : 'text-info'}`}>{num(d.rain_mm, 0)}mm</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Chuva em 7 dias: <b>{num(weather.rain_next_7d_mm, 0)} mm</b></span>
                <SourceBadge source={weather.source} compact />
              </div>
            </div>
          )}
        </Card>

        <Card title="Atividades recentes" action={<Link to="/producao" className="text-xs font-medium text-primary hover:underline">Caderno de campo</Link>}>
          <ul className="space-y-3">
            {data.recent_events.slice(0, 6).map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 text-xs text-muted">{dayMonth(e.date)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{e.title}</span>
                  <span className="text-xs text-muted">{EVENT_LABEL[e.type]}{e.origin === 'ia' && ' · registrado via IA'}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={<span className="flex items-center gap-2"><Sprout size={16} /> Minha região · {region.municipality}</span>}>
          {region.available ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-info-soft p-2 text-info"><Plane size={16} /></span>
                <div>
                  <div><b>{num(region.drones, 0)} drones agrícolas</b> com operador registrado no município</div>
                  <div className="text-xs text-muted">{num(region.uf_drones, 0)} no estado · só {num(region.br_municipalities_with_drones, 0)} de {num(region.br_municipalities, 0)} municípios do Brasil têm algum</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-primary-soft p-2 text-primary"><Sprout size={16} /></span>
                <div>
                  <div><b>{region.zarc_crops?.length} culturas</b> com zoneamento de risco (Zarc)</div>
                  <div className="text-xs text-muted">{region.zarc_crops?.slice(0, 5).join(', ')}…</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">{region.sources?.slice(0, 2).map((s) => <SourceBadge key={s.key} source={s} compact />)}</div>
              <p className="text-[11px] text-muted">{region.notes?.[0]}</p>
            </div>
          ) : <p className="text-sm text-muted">Sem dados regionais.</p>}
        </Card>
      </div>
      <p className="text-center text-[11px] text-muted">Atualizado em {dateBR(new Date().toISOString())} · números calculados a partir dos seus registros e de dados abertos oficiais</p>
    </div>
  )
}
