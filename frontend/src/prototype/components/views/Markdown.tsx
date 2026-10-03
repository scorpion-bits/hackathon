// Renderizador de markdown mínimo (títulos, listas, tabelas, citações) para exibir o contexto.md de forma amigável.
import clsx from 'clsx'
import { Fragment } from 'react'
import type { ReactNode } from 'react'

type Block =
  | { t: 'h1' | 'h2' | 'h3' | 'p'; text: string }
  | { t: 'quote'; lines: string[] }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

export function parseMarkdown(src: string): Block[] {
  const lines = src.split('\n')
  const out: Block[] = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i]
    if (!l.trim()) { i++; continue }
    if (l.startsWith('### ')) { out.push({ t: 'h3', text: l.slice(4) }); i++; continue }
    if (l.startsWith('## ')) { out.push({ t: 'h2', text: l.slice(3) }); i++; continue }
    if (l.startsWith('# ')) { out.push({ t: 'h1', text: l.slice(2) }); i++; continue }
    if (l.startsWith('>')) {
      const q: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i++ }
      out.push({ t: 'quote', lines: q }); continue
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++ }
      out.push({ t: 'ul', items }); continue
    }
    if (/^\s*\d+\.\s+/.test(l)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++ }
      out.push({ t: 'ol', items }); continue
    }
    if (l.trim().startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(cells(lines[i])); i++ }
      const body = rows.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)))
      out.push({ t: 'table', head: body[0] ?? [], rows: body.slice(1) }); continue
    }
    const p: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#|>|\||\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { p.push(lines[i]); i++ }
    out.push({ t: 'p', text: p.join(' ') })
  }
  return out
}

/** **negrito**, `código`, _itálico_ */
export function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|_[^_]+_)/g).filter(Boolean)
  return parts.map((p, i) => {
    if (p.startsWith('**')) return <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>
    if (p.startsWith('`')) return <code key={i} className="rounded bg-bg px-1 py-0.5 font-mono text-[0.85em] text-primary-dark ring-1 ring-border">{p.slice(1, -1)}</code>
    if (p.startsWith('_') && p.endsWith('_') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>
    return <Fragment key={i}>{p}</Fragment>
  })
}

export function renderBlock(b: Block, key: number): ReactNode {
  switch (b.t) {
    case 'h1':
      return <h1 key={key} className="text-2xl font-bold tracking-tight text-ink">{inline(b.text)}</h1>
    case 'h2':
      return key < 0 ? null : <h2 key={key} className="mt-2 text-base font-semibold text-ink">{inline(b.text)}</h2>
    case 'h3':
      return <h3 key={key} className="mt-3 text-sm font-semibold text-ink">{inline(b.text)}</h3>
    case 'quote':
      return (
        <blockquote key={key} className="space-y-1 rounded-r-lg border-l-4 border-primary bg-primary-soft/60 px-4 py-2.5 text-sm text-primary-dark">
          {b.lines.map((l, i) => <p key={i}>{inline(l)}</p>)}
        </blockquote>
      )
    case 'ul':
      return (
        <ul key={key} className="space-y-1.5 text-sm text-ink">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{inline(it)}</span></li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={key} className="space-y-1.5 text-sm text-ink">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-dark">{i + 1}</span><span>{inline(it)}</span></li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div key={key} className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead><tr className="bg-bg text-left text-xs uppercase tracking-wide text-muted">{b.head.map((h, i) => <th key={i} className="px-3 py-2 font-medium">{inline(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {b.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className={clsx('px-3 py-2', ci === 0 && 'font-medium text-ink')}>{inline(c)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )
    default:
      return <p key={key} className="text-sm leading-relaxed text-ink">{inline(b.text)}</p>
  }
}

/** Documento agrupado por seções (## título). `active` realça a seção cujo título começa com o texto dado. */
export function MarkdownDoc({ source, active }: { source: string; active?: string | null }) {
  const blocks = parseMarkdown(source)
  const groups: { title: string | null; blocks: Block[] }[] = [{ title: null, blocks: [] }]
  for (const b of blocks) {
    if (b.t === 'h2') groups.push({ title: b.text, blocks: [] })
    else groups[groups.length - 1].blocks.push(b)
  }
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => {
        const on = !!active && !!g.title && g.title.startsWith(active)
        return (
          <section
            key={gi}
            data-sec={g.title ?? 'cabecalho'}
            className={clsx('space-y-3 rounded-xl transition', g.title && 'border border-transparent p-4', on && 'border-primary bg-primary-soft/40 ring-2 ring-primary/30')}
          >
            {g.title && (
              <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                <span className="h-5 w-1 rounded-full bg-primary" />{inline(g.title)}
              </h2>
            )}
            {g.blocks.map((b, bi) => renderBlock(b, bi))}
          </section>
        )
      })}
    </div>
  )
}

/** Texto cru (.md) com numeração de linhas e cores leves por tipo de linha. */
export function RawMarkdown({ source }: { source: string }) {
  const lines = source.split('\n')
  return (
    <pre className="overflow-x-auto rounded-xl bg-sidebar p-4 font-mono text-[12.5px] leading-6 text-white/85">
      {lines.map((l, i) => {
        const cls = l.startsWith('#') ? 'font-bold text-emerald-300' : l.startsWith('>') ? 'italic text-white/55' : l.trim().startsWith('|') ? 'text-sky-200' : /^\s*([-*]|\d+\.)\s/.test(l) ? 'text-amber-100' : ''
        return (
          <div key={i} className="flex">
            <span className="mr-4 w-6 shrink-0 select-none text-right text-white/30">{i + 1}</span>
            <span className={clsx('whitespace-pre-wrap', cls)}>{l || ' '}</span>
          </div>
        )
      })}
    </pre>
  )
}
