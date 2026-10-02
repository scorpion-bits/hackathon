import { AlertTriangle, CloudRain, Droplets, Thermometer, Wind } from 'lucide-react'
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AskAI, InfoKind, SourceBadge } from '../components/data'
import { Badge, Card, Empty, ErrorBox, Loading, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { dateBR, dayMonth, num, weekday } from '../lib/format'
import { useApi } from '../lib/hooks'

const HEAVY_MM = 50

export default function Weather() {
  const { data: weather, error } = useApi(api.weather)
  const { data: fields } = useApi(api.fields)
  if (error) return <ErrorBox error={error} />
  if (!weather) return <Loading />

  const planted = (fields ?? []).filter((f) => f.status.stage === 'plantado')
  const daily = weather.daily ?? []
  const heavy = daily.filter((d) => d.rain_mm >= HEAVY_MM)
  const simulated = weather.status === 'simulated'

  return (
    <div className="space-y-5">
      <PageHeader title="Clima" subtitle="Previsão de 16 dias para a localização da sua propriedade" />

      {!weather.available && (
        <Empty>
          <CloudRain className="mx-auto mb-2 text-muted" size={28} />
          <p className="font-medium text-ink">Previsão do tempo indisponível no momento</p>
          <p className="mt-1">{weather.error ?? 'Não foi possível consultar o serviço de previsão. Tente novamente mais tarde.'}</p>
        </Empty>
      )}

      {weather.available && (
        <>
          {simulated && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border-2 border-danger bg-danger-soft p-4 text-danger">
              <AlertTriangle size={22} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Dados simulados para desenvolvimento — não é previsão real</p>
                <p className="text-sm">Sem acesso ao serviço de previsão neste ambiente. Não use estes números para tomar decisões na lavoura.</p>
              </div>
            </div>
          )}
          {weather.status === 'stale' && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent-soft p-4 text-accent">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Previsão antiga (guardada em cache)</p>
                <p className="text-sm">{weather.error ?? 'Não foi possível atualizar a previsão; mostrando a última consulta bem-sucedida.'}</p>
              </div>
            </div>
          )}
          {heavy.length > 0 && (
            <div className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              <b>Chuva forte prevista:</b> {heavy.map((d) => `${weekday(d.date)} ${dayMonth(d.date)} (${num(d.rain_mm, 0)} mm)`).join(', ')}.
            </div>
          )}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Thermometer size={36} className="text-accent" />
                <div>
                  <div className="text-5xl font-bold tracking-tight">{num(weather.current?.temp, 0)}°C</div>
                  <div className="text-base text-muted">{weather.current?.summary ?? '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div><div className="flex items-center gap-1 text-xs text-muted"><Droplets size={13} /> Umidade</div><div className="text-lg font-semibold">{num(weather.current?.humidity, 0)}%</div></div>
                <div><div className="flex items-center gap-1 text-xs text-muted"><Wind size={13} /> Vento</div><div className="text-lg font-semibold">{num(weather.current?.wind_kmh, 0)} km/h</div></div>
                <div><div className="flex items-center gap-1 text-xs text-muted"><CloudRain size={13} /> Chuva agora</div><div className="text-lg font-semibold">{num(weather.current?.rain_mm, 1)} mm</div></div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <InfoKind kind={simulated ? 'simulado' : 'previsao'} />
                <span className="text-xs text-muted">Chuva nos próximos 7 dias: <b>{num(weather.rain_next_7d_mm, 0)} mm</b></span>
              </div>
            </div>
          </Card>

          <Card title="Chuva e temperatura — próximos dias">
            <div className="h-72" role="img" aria-label="Gráfico de chuva diária em milímetros e temperaturas máxima e mínima">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily.map((d) => ({ ...d, label: `${weekday(d.date)} ${dayMonth(d.date)}` }))} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis yAxisId="mm" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} unit=" mm" />
                  <YAxis yAxisId="t" orientation="right" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} unit="°" />
                  <Tooltip formatter={(v, n) => (n === 'Chuva (mm)' ? [`${num(Number(v), 1)} mm`, n] : [`${num(Number(v), 0)}°C`, n])} />
                  <Legend verticalAlign="top" height={28} />
                  <Bar yAxisId="mm" dataKey="rain_mm" name="Chuva (mm)" fill="var(--color-info)" radius={[3, 3, 0, 0]}>
                    {daily.map((d) => <Cell key={d.date} fill={d.rain_mm >= HEAVY_MM ? 'var(--color-danger)' : 'var(--color-info)'} />)}
                  </Bar>
                  <Line yAxisId="t" type="monotone" dataKey="tmax" name="Máxima" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line yAxisId="t" type="monotone" dataKey="tmin" name="Mínima" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted">Barras em vermelho = dias com chuva de {HEAVY_MM} mm ou mais.</p>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {daily.slice(0, 7).map((d) => (
              <div key={d.date} className={`rounded-xl border bg-surface p-3 shadow-sm ${d.rain_mm >= HEAVY_MM ? 'border-danger' : 'border-border'}`}>
                <div className="text-xs font-semibold uppercase text-muted">{weekday(d.date)} · {dayMonth(d.date)}</div>
                <div className="mt-1 min-h-8 text-xs leading-tight text-ink">{d.summary}</div>
                <div className="mt-2 text-sm"><b>{num(d.tmax, 0)}°</b> <span className="text-muted">/ {num(d.tmin, 0)}°</span></div>
                <div className={`text-sm ${d.rain_mm >= HEAVY_MM ? 'font-bold text-danger' : 'text-info'}`}>{num(d.rain_mm, 1)} mm</div>
                <div className="text-[11px] text-muted">{d.rain_prob != null ? `${num(d.rain_prob, 0)}% de chance` : 'chance n/d'}</div>
              </div>
            ))}
          </div>

          <Card title="O que isso significa para seus talhões" action={<AskAI size="md" question="Como a previsão do tempo dos próximos dias afeta meus talhões?" />}>
            {planted.length === 0 ? (
              <p className="text-sm text-muted">Nenhum talhão plantado no momento. Quando houver plantio registrado, ele aparece aqui.</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">
                  Talhões plantados e a chuva prevista para 7 dias ({num(weather.rain_next_7d_mm, 0)} mm). Pergunte à IA para uma leitura prática.
                </p>
                <ul className="divide-y divide-border">
                  {planted.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 py-2">
                      <span className="h-7 w-1.5 rounded-full" style={{ background: f.color ?? 'var(--color-primary)' }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{f.name} <span className="font-normal text-muted">· {num(f.area_ha, 2)} ha</span></div>
                        <div className="truncate text-xs text-muted">{f.status.label}</div>
                      </div>
                      {f.irrigated && <Badge tone="blue">irrigado</Badge>}
                      <Badge tone="green">{f.crop ?? 'plantado'}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <SourceBadge source={weather.source} />
            <span>Atualizado: {weather.fetched_at ? `${dateBR(weather.fetched_at)} ${weather.fetched_at.slice(11, 16)}` : '—'}</span>
          </div>
        </>
      )}
    </div>
  )
}
