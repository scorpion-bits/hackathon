// Primeiro acesso (M2): conta sem propriedade ou sem talhões vê um convite para a entrevista no lugar da tela.
import { ArrowRight, Loader2, MapPin, PenTool, Sprout } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMe } from '../api/session'
import { useFarmFields, useFarmSync } from '../farmStore'
import { CUBE_DONE, CUBE_TODO, IsoCube } from './Brand'

const STEPS = [
  { icon: MapPin, title: 'Seu município', text: 'Para buscar o clima, o Zarc e os dados oficiais da sua região.' },
  { icon: PenTool, title: 'Desenhe seus talhões', text: 'Marque no mapa os cantos de cada plantação.' },
  { icon: Sprout, title: 'O que você planta', text: 'Cultura, tipo de terra e irrigação de cada talhão.' },
]

export function FirstAccessCard({ where }: { where?: string }) {
  const { me } = useMe()
  const first = me?.producer.name.trim().split(/\s+/)[0]
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <article className="iso-card overflow-hidden bg-surface">
        <div className="flex items-start gap-4 p-5 md:p-8">
          <IsoCube size={56} {...CUBE_TODO} className="hidden sm:inline-grid" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Primeiro acesso{where ? ` · ${where}` : ''}</p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {first ? `${first}, vamos` : 'Vamos'} configurar sua propriedade
            </h1>
            <p className="mt-2 text-base leading-relaxed text-muted">
              São 3 passos, uns 3 minutos. Com isso, o AgroBits filtra os dados abertos oficiais e mostra só o que importa para a sua roça.
            </p>
          </div>
        </div>
        <ol className="grid gap-3 border-t border-border p-5 sm:grid-cols-3 md:px-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 sm:flex-col">
              <IsoCube size={34} {...(i === 0 ? CUBE_DONE : CUBE_TODO)}>{i + 1}</IsoCube>
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-ink"><s.icon size={15} /> {s.title}</p>
                <p className="mt-0.5 text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-border p-5 md:px-8">
          <Link to="/prototipo/entrevista" state={{ name: me?.producer.name }}
            className="iso-btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-base font-bold text-white hover:bg-primary-dark sm:w-auto">
            Começar <ArrowRight size={18} />
          </Link>
        </div>
      </article>
    </div>
  )
}

/** Mostra `children` só quando a conta já tem talhões; senão, o convite de primeiro acesso. */
export function NeedsFields({ children, where }: { children: ReactNode; where?: string }) {
  const fields = useFarmFields()
  const sync = useFarmSync()
  if (sync.status === 'loading') {
    return <p className="flex items-center gap-2 p-6 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Carregando sua propriedade…</p>
  }
  if (sync.status === 'error' && fields.length === 0) {
    return <p role="alert" className="p-6 text-sm font-medium text-red-700">Não foi possível carregar sua propriedade: {sync.error}</p>
  }
  return fields.length ? <>{children}</> : <FirstAccessCard where={where} />
}
