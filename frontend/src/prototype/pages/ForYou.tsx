// "Para você" — tela inicial do protótipo. Princípio de UX: uma decisão por vez.
// 1º nível (bater o olho): o que fazer hoje + de quais dados oficiais isso veio.
// 2º nível (um clique): por que, com fontes e números. Detalhe completo fica nas telas Dados abertos / Mapa vivo.
import clsx from 'clsx'
import { AlertTriangle, ArrowRight, ChevronDown, CloudRain, Database, Globe2, Lightbulb, PartyPopper, RotateCcw, Sparkles, SlidersHorizontal, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FIELDS, FORECAST, FUNNEL, INSIGHTS, PRODUCER, type Insight } from '../mock'
import { PROBLEMS, nextOpen, resetCases, useResolved } from '../resolve'
import { IsoFarm } from '../components/IsoFarm'
import { IsoCube } from '../components/Brand'

const PRIORITY = {
  agir: { label: 'Agir agora', icon: Zap, bar: 'bg-danger', icoBg: 'bg-danger-soft text-danger' },
  atencao: { label: 'Atenção', icon: AlertTriangle, bar: 'bg-risk-30', icoBg: 'bg-accent-soft text-accent' },
  oportunidade: { label: 'Oportunidade', icon: Lightbulb, bar: 'bg-primary', icoBg: 'bg-primary-soft text-primary-dark' },
  info: { label: 'Para saber', icon: Sparkles, bar: 'bg-info', icoBg: 'bg-info-soft text-info' },
} as const

const SOURCE_NAME: Record<string, string> = {
  zarc: 'Zarc · MAPA', clima: 'Previsão · Open-Meteo', agrofit: 'Agrofit · MAPA', seguro: 'Seguro Rural · MAPA',
  drones: 'SIPEAGRO · MAPA', satelite: 'Satélite · NASA', pivos: 'Pivôs · ANA',
}

// Fontes oficiais que alimentam a tela (mostradas como "de onde vem").
const HERO_SOURCES = ['Zarc · MAPA', 'Agrofit · MAPA', 'Seguro Rural · MAPA', 'SIPEAGRO · MAPA', 'NASA', 'Open-Meteo']

function Origin({ it }: { it: Insight }) {
  const main = it.sources[0]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Database size={13} className={it.origin === 'real' ? 'text-primary' : 'text-muted'} />
      {main ? SOURCE_NAME[main] : 'Seus registros'}
      {it.origin === 'real' ? <b className="font-semibold text-primary-dark">· dado oficial</b> : <span>· exemplo</span>}
    </span>
  )
}

/** O assunto em destaque: uma pergunta, um resumo, UM botão. */
function FocusCard({ it }: { it: Insight }) {
  const p = PRIORITY[it.priority]
  return (
    <article className="iso-card relative overflow-hidden bg-surface">
      <span className={clsx('absolute inset-x-0 top-0 h-2', p.bar)} aria-hidden />
      <div className="p-5 md:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 normal-case tracking-normal', p.icoBg)}><p.icon size={13} />{p.label}</span>
          {it.field && <span>{it.field}</span>}
        </div>
        <h3 className="mt-3 text-xl font-bold leading-tight sm:text-2xl md:text-3xl">{PROBLEMS[it.id].question}</h3>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{it.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link to={`/prototipo/resolver/${it.id}`} className="iso-btn inline-flex w-full items-center justify-center gap-2 sm:w-auto rounded-xl bg-primary px-6 py-3.5 font-display text-base font-bold text-white hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Resolver agora <ArrowRight size={18} />
          </Link>
          <span className="text-sm text-muted">Veja os dados e leve a um técnico público, de graça · ~1 min</span>
        </div>
        <div className="mt-5 border-t border-border pt-3"><Origin it={it} /></div>
      </div>
    </article>
  )
}

/** Linha da fila: próximos assuntos (e os já resolvidos, com a escolha feita). */
function QueueRow({ it, chosen }: { it: Insight; chosen?: string }) {
  const p = PRIORITY[it.priority]
  const sol = chosen ? (PROBLEMS[it.id].solutions.find((s) => s.id === chosen) ?? { title: '' }) : undefined
  return (
    <li>
      <Link to={`/prototipo/resolver/${it.id}`} className="group flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-sm ring-1 ring-border hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {sol ? <IsoCube size={26} /> : <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', p.icoBg)}><p.icon size={16} /></span>}
        <span className="min-w-0 flex-1">
          <span className={clsx('block truncate font-semibold', sol && 'text-muted line-through decoration-1')}>{PROBLEMS[it.id].question}</span>
          <span className="block truncate text-xs text-muted">{sol ? 'Caso enviado ao técnico' : `${p.label}${it.field ? ` · ${it.field}` : ''}`}</span>
        </span>
        <span className="text-sm font-semibold text-primary">{sol ? 'Ver' : 'Resolver'}</span>
        <ArrowRight size={16} className="text-muted transition group-hover:translate-x-0.5" />
      </Link>
    </li>
  )
}

export default function ForYou() {
  const [howOpen, setHowOpen] = useState(false)
  const resolved = useResolved()
  const focusId = nextOpen(resolved)
  const focus = INSIGHTS.find((i) => i.id === focusId)
  const rest = INSIGHTS.filter((i) => i.id !== focusId).sort((x, y) => Number(!!resolved[x.id]) - Number(!!resolved[y.id]))
  const doneCount = INSIGHTS.filter((i) => resolved[i.id]).length
  const left = INSIGHTS.length - doneCount
  const maxRain = Math.max(...FORECAST.map((f) => f.rain), 1)
  const total = FUNNEL[0].value

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Saudação + de onde vem */}
      <section className="iso-grid relative overflow-hidden rounded-3xl bg-sidebar px-5 py-5 text-white shadow-sm md:px-8 md:py-6">
        <img src="/brand/agrobits-simbolo.png" alt="" className="pointer-events-none absolute -bottom-6 -right-4 hidden w-40 opacity-90 drop-shadow-[0_6px_0_rgba(0,0,0,.35)] md:block" />
        <p className="text-sm text-white/60">Sexta, 2 de outubro · {PRODUCER.farm}</p>
        <h1 className="mt-1 text-[1.4rem] font-bold leading-tight md:text-[2rem]">
          Bom dia, {PRODUCER.name}.{' '}
          {left ? <>Vamos resolver <span className="text-[#7fd6a0]">{left} {left === 1 ? 'assunto' : 'assuntos'}</span>, um de cada vez.</> : <span className="text-[#7fd6a0]">Tudo em dia!</span>}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/75 md:text-[15px]">
          Lemos <b className="text-white">{total} registros oficiais</b> do governo e de satélites e separamos só o que vale para a sua roça.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {HERO_SOURCES.map((s) => <span key={s} className="hidden rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 sm:inline">{s}</span>)}
          <button onClick={() => setHowOpen(!howOpen)} aria-expanded={howOpen}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-[#7fd6a0] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fd6a0]">
            Como chegamos aqui? <ChevronDown size={14} className={clsx('transition', howOpen && 'rotate-180')} />
          </button>
        </div>
        {howOpen && (
          <ol className="mt-4 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            {FUNNEL.map((f, i) => (
              <li key={f.label} className="bg-sidebar p-4">
                <div className={clsx('text-2xl font-bold', i === FUNNEL.length - 1 && 'text-[#7fd6a0]')}>{f.value}</div>
                <div className="text-sm text-white/85">{f.label}</div>
                <div className="mt-1 text-xs text-white/50">{f.hint}</div>
              </li>
            ))}
          </ol>
        )}
        {/* progresso do dia */}
        <div className="mt-5 flex items-center gap-3 md:pr-36">
          <div className="flex flex-1 gap-1" aria-hidden>
            {INSIGHTS.map((i) => <span key={i.id} className={clsx('h-1.5 flex-1 rounded-full', resolved[i.id] ? 'bg-[#7fd6a0]' : 'bg-white/15')} />)}
          </div>
          <span className="text-xs text-white/70">{doneCount} de {INSIGHTS.length} encaminhados</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 2. Um assunto em foco + a fila */}
        <section className="min-w-0 space-y-5 lg:col-span-2">
          {focus ? (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{doneCount ? 'Próximo assunto' : 'Comece por aqui'}</h2>
              <FocusCard it={focus} />
            </div>
          ) : (
            <div className="rounded-3xl bg-primary-soft p-8 text-center ring-1 ring-primary/20">
              <PartyPopper size={36} className="mx-auto text-primary" />
              <h2 className="mt-3 text-2xl font-bold">Tudo encaminhado por hoje!</h2>
              <p className="mt-1 text-muted">Os técnicos vão responder em Meus casos. Seguimos de olho nos dados oficiais e avisamos se algo mudar.</p>
              <button onClick={resetCases} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"><RotateCcw size={14} /> Recomeçar a demonstração</button>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{focus ? 'Depois disso' : 'Encaminhados hoje'}</h2>
            <ol className="space-y-2">{rest.map((it) => <QueueRow key={it.id} it={it} chosen={resolved[it.id]} />)}</ol>
          </div>

          <Link to="/prototipo/contexto" className="flex items-center gap-2 rounded-xl px-1 text-sm text-muted hover:text-ink">
            <SlidersHorizontal size={15} className="text-primary" />
            Assuntos escolhidos a partir do seu contexto: 3 talhões · soja, milho, feijão · preocupação: seca.
            <span className="font-semibold text-primary">Ajustar</span>
          </Link>
        </section>

        {/* 3. Lateral: só o que se lê num relance */}
        <aside className="space-y-6">
          <Link to="/prototipo/mapa" className="iso-card group block overflow-hidden bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="bg-gradient-to-b from-mint-soft to-surface"><IsoFarm fields={FIELDS} height={190} className="w-full" /></div>
            <div className="flex items-center justify-between px-4 py-3">
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold"><Globe2 size={16} className="text-primary" /> Abrir mapa vivo</span>
                <span className="text-xs text-muted">Risco climático de hoje · Zarc/MAPA</span>
              </span>
              <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1" />
            </div>
          </Link>

          <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-border" aria-labelledby="rain">
            <h3 id="rain" className="flex items-center gap-2 text-sm font-semibold"><CloudRain size={16} className="text-info" /> Chuva nos próximos 7 dias</h3>
            <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={`Previsão de chuva: ${FORECAST.map((f) => `${f.d} ${f.rain} mm`).join(', ')}`}>
              {FORECAST.map((f) => (
                <div key={f.d} className="flex flex-1 flex-col items-center gap-1">
                  <span className={clsx('text-xs font-semibold', f.rain >= 50 ? 'text-danger' : 'text-info')}>{f.rain}</span>
                  <div className={clsx('w-full rounded-t', f.rain >= 50 ? 'bg-danger' : 'bg-info/70')} style={{ height: `${Math.max(4, (f.rain / maxRain) * 72)}px` }} />
                  <span className="text-xs uppercase text-muted">{f.d}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">mm por dia · Open-Meteo · exemplo</p>
            {/* Dado real consultado na NASA POWER em 02/10 (services/live.py) */}
            <div className="mt-4 rounded-xl bg-info-soft p-3 text-sm">
              <b>Últimos 30 dias: 93 mm</b> — quase o dobro do normal (48 mm).
              <div className="mt-0.5 text-xs text-info">NASA POWER · dado oficial · 31/08 a 29/09</div>
            </div>
          </section>

          <Link to="/prototipo/dados" className="flex items-center gap-3 rounded-2xl bg-primary-soft/60 p-4 text-sm ring-1 ring-primary/20 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Database size={20} className="shrink-0 text-primary" />
            <span className="flex-1"><b>7 fontes oficiais</b> conferidas hoje às 06:00<br /><span className="text-xs text-muted">Ver todos os dados abertos</span></span>
            <ArrowRight size={16} className="text-primary" />
          </Link>
        </aside>
      </div>
    </div>
  )
}
