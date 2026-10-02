// Última etapa: animação "Montando seu radar…" e a tela "Seu contexto está pronto" com o contexto.md gerado.
import clsx from 'clsx'
import { ArrowRight, Check, CircleCheckBig, Download, Info, LoaderCircle, Pencil, Radar } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SOURCES } from '../../mock'
import { SOURCE_SHORT, buildContextMd, cropLabels, sourceReasons, totalHa, withDefaults } from './context'
import type { Answers } from './types'
import { fmtHa } from './format'
import { ContextSummary } from './ContextSummary'

const STEP_MS = 1000

function useProcessingLines(a: Answers) {
  return useMemo(() => {
    const crops = cropLabels(a).map((c) => c.toLowerCase())
    const mun = a.municipality ? `${a.municipality.name}/${a.municipality.uf}` : 'a sua região'
    return [
      `Cruzando 1.984.463 linhas do Zarc com ${a.fields.length ? `seus ${a.fields.length} ${a.fields.length > 1 ? 'talhões' : 'talhão'}` : 'o seu município'}…`,
      `Filtrando 280.159 registros do Agrofit ${crops.length ? `pelas suas culturas (${crops.join(', ')})` : 'pelo seu perfil'}…`,
      `Buscando a previsão do tempo e imagens de satélite sobre ${mun}…`,
      `Conferindo 46.137 apólices de seguro rural e 27.293 registros de drones perto de você…`,
    ]
  }, [a])
}

export function ResultScreen({ answers, onEdit, onFinish }: { answers: Answers; onEdit: () => void; onFinish: () => void }) {
  const a = useMemo(() => withDefaults(answers), [answers])
  const lines = useProcessingLines(a)
  const [done, setDone] = useState(0) // linhas concluídas; lines.length + 1 = animação terminou
  const ready = done > lines.length

  useEffect(() => {
    if (ready) return
    const t = window.setTimeout(() => setDone((d) => d + 1), STEP_MS)
    return () => window.clearTimeout(t)
  }, [done, ready])

  const md = useMemo(() => buildContextMd(a), [a])

  if (!ready) {
    const pct = Math.round((done / (lines.length + 1)) * 100)
    return (
      <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-5 py-10 text-center">
        <div className="relative mb-6 grid h-24 w-24 place-items-center rounded-full bg-primary-soft">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
          <Radar size={42} className="relative text-primary" style={{ animation: 'spin 3s linear infinite' }} />
        </div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Montando seu radar…</h1>
        <p className="mt-2 text-muted">Estamos filtrando os dados abertos com o que você contou.</p>
        <ul className="mt-7 w-full space-y-2.5 text-left">
          {lines.map((l, i) => {
            if (i > done) return <li key={i} className="h-11" aria-hidden />
            const finished = i < done
            return (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-sm animate-[proto-up_.3s_ease-out]">
                {finished
                  ? <CircleCheckBig size={18} className="mt-0.5 shrink-0 text-primary" />
                  : <LoaderCircle size={18} className="mt-0.5 shrink-0 animate-spin text-primary" />}
                <span className={clsx(finished ? 'text-muted' : 'font-medium text-ink')}>{l}</span>
              </li>
            )
          })}
        </ul>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  const reasons = sourceReasons(a)
  const active = SOURCES.filter((s) => reasons[s.key])
  const download = () => {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'contexto.md'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-[proto-up_.4s_ease-out]">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25"><Check size={30} strokeWidth={3} /></span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Pronto! Já conhecemos a sua roça</h1>
          <p className="mt-1.5 max-w-2xl leading-relaxed text-muted">
            Confira se está tudo certo. É isso que usamos para <b className="text-ink">filtrar os dados oficiais e mostrar só o que importa para você</b>.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button type="button" onClick={onFinish} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark active:scale-[.98]">
          Ver o que fazer hoje <ArrowRight size={18} />
        </button>
        <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-surface px-5 py-3.5 text-[15px] font-semibold text-ink transition hover:border-primary/40 hover:bg-primary-soft/40 active:scale-[.98]">
          <Download size={17} /> Baixar resumo
        </button>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-muted transition hover:bg-surface hover:text-ink">
          <Pencil size={16} /> Editar respostas
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ContextSummary a={a} md={md} />

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink">Seu radar começa com</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <Stat value={String(active.length)} label={active.length === 1 ? 'fonte ativa' : 'fontes ativas'} />
              <Stat value={a.fields.length ? `${fmtHa(totalHa(a))} ha` : '—'} label={a.fields.length ? `em ${a.fields.length} ${a.fields.length > 1 ? 'talhões' : 'talhão'}` : 'sem talhões'} />
            </div>
            <ul className="mt-3 space-y-1.5">
              {active.map((s) => (
                <li key={s.key} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="leading-snug"><b className="text-ink">{SOURCE_SHORT[s.key].name}</b><span className="block text-muted">{reasons[s.key]}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-start gap-2.5 rounded-2xl border border-info/20 bg-info-soft p-3.5 text-xs leading-relaxed text-info">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>Nada disso é vendido ou compartilhado. Só usamos para escolher quais dados oficiais buscar e como explicar para você.</span>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-primary-soft/60 px-2 py-2.5">
      <div className="text-xl font-extrabold text-primary-dark tabular-nums">{value}</div>
      <div className="text-[11px] text-primary-dark/80">{label}</div>
    </div>
  )
}
