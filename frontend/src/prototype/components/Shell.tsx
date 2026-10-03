// Casca do PROTÓTIPO VISUAL (D-009). Navegação centrada em dados abertos.
import clsx from 'clsx'
import { Bot, Database, FileText, Globe2, Home, Inbox, LogOut, Sprout } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { fmtWhen, useSources } from '../api/opendata'
import { logout, useMe } from '../api/session'
import { Logo } from './Brand'

const NAV = [
  { to: '/', label: 'Para você', icon: Home, end: true },
  { to: '/casos', label: 'Meus casos', icon: Inbox },
  { to: '/mapa', label: 'Mapa vivo', icon: Globe2 },
  { to: '/dados', label: 'Dados abertos', icon: Database },
  { to: '/propriedade', label: 'Minha propriedade', icon: Sprout },
  { to: '/assistente', label: 'Pergunte à IA', icon: Bot },
  { to: '/contexto', label: 'Meu contexto', icon: FileText },
]

/** Selo das contas de demonstração (D-022): dados de conta fictícios. */
export function DemoSeal({ className }: { className?: string }) {
  return <span className={clsx('inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white', className)}>conta de demonstração</span>
}

export function Shell({ children, full }: { children: ReactNode; full?: boolean }) {
  const nav = useNavigate()
  const { me } = useMe()
  const exit = () => { logout().finally(() => nav('/entrar')) }
  const firstName = me?.producer.name.split(/\s+/)[0]
  const sources = useSources().data
  const checked = (sources ?? []).map((x) => x.checked_at).filter(Boolean).sort().pop()
  return (
    <div className="flex h-full flex-col">
      {me && (
        // celular: conta + Sair (a barra lateral some em telas pequenas)
        <div className="flex items-center justify-between gap-2 bg-sidebar px-4 py-1.5 text-xs text-white/80 md:hidden">
          <span className="flex min-w-0 items-center gap-2"><span className="truncate">{me.producer.name}</span>{me.producer.is_demo && <DemoSeal />}</span>
          <button onClick={exit} className="flex shrink-0 items-center gap-1 rounded px-2 py-1 hover:bg-white/10"><LogOut size={14} /> Sair</button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <aside className="iso-grid hidden w-64 shrink-0 flex-col bg-sidebar p-4 md:flex">
          <div className="mb-6 px-1">
            <Logo size={44} tagline="dados abertos que trabalham para você" />
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-3">
            <div className="rounded-lg bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-wide text-white/50">Radar ativo</div>
              <div className="mt-1 text-sm font-semibold text-white">{sources ? `${sources.length} fontes oficiais` : 'Fontes oficiais'}</div>
              <div className="text-[11px] text-white/60">{checked ? `bases do MAPA conferidas em ${fmtWhen(checked)}` : 'conferência ainda não registrada'}</div>
            </div>
            {me?.producer.is_demo && <DemoSeal className="ml-3" />}
            <button onClick={exit} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
              <LogOut size={16} /> {me ? `Sair (${firstName})` : 'Entrar'}
            </button>
          </div>
        </aside>
        <main className={clsx('min-h-0 flex-1 overflow-y-auto', !full && 'p-4 md:p-6')}>{children}</main>
      </div>
      {/* Celular: menu inferior (a barra lateral some em telas pequenas) */}
      <nav aria-label="Menu principal" className="grid shrink-0 grid-cols-5 border-t border-white/10 bg-sidebar md:hidden">
        {/* celular: as 5 mais usadas (IA e Contexto ficam acessíveis pelas telas) */}
        {NAV.filter((n) => !['/contexto', '/assistente'].includes(n.to)).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx('flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium',
            isActive ? 'text-[#7fd6a0]' : 'text-white/70')}>
            <Icon size={20} /> <span className="truncate">{label.replace('Minha propriedade', 'Propriedade').replace('Dados abertos', 'Dados').replace('Para você', 'Início').replace('Meus casos', 'Casos')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Selo de fonte do protótipo. */
export function SourceChip({ k }: { k: string }) {
  const map: Record<string, string> = { zarc: 'Zarc · MAPA', clima: 'Previsão · Open-Meteo', satelite: 'Satélite · NASA/INPE', agrofit: 'Agrofit · MAPA', seguro: 'Seguro Rural · MAPA', drones: 'SIPEAGRO · MAPA', pivos: 'Pivôs · ANA/Embrapa', voce: 'Seu contexto' }
  return <span className="inline-flex items-center gap-1 rounded-md border border-info/20 bg-info-soft px-1.5 py-0.5 text-[11px] font-medium text-info"><Database size={11} />{map[k] ?? k}</span>
}

export function OriginTag({ origin }: { origin: 'real' | 'ilustrativo' }) {
  return origin === 'real'
    ? <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-dark">dado oficial</span>
    : <span className="rounded bg-bg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-border">ilustrativo</span>
}
