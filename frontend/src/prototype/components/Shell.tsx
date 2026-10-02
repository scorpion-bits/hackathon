// Casca do PROTÓTIPO VISUAL (D-009). Navegação centrada em dados abertos.
import clsx from 'clsx'
import { Bot, Database, FileText, Globe2, Home, LogOut, Sprout } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { PRODUCER } from '../mock'

const NAV = [
  { to: '/prototipo', label: 'Para você', icon: Home, end: true },
  { to: '/prototipo/mapa', label: 'Mapa vivo', icon: Globe2 },
  { to: '/prototipo/dados', label: 'Dados abertos', icon: Database },
  { to: '/prototipo/propriedade', label: 'Minha propriedade', icon: Sprout },
  { to: '/prototipo/assistente', label: 'Pergunte à IA', icon: Bot },
  { to: '/prototipo/contexto', label: 'Meu contexto', icon: FileText },
]

export function ProtoBanner() {
  return (
    <div className="bg-accent px-4 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
      Protótipo visual · dados de exemplo (números marcados “dado real” vêm das bases oficiais analisadas)
    </div>
  )
}

export function Shell({ children, full }: { children: ReactNode; full?: boolean }) {
  const nav = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <ProtoBanner />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-4 md:flex">
          <div className="mb-6 flex items-center gap-2 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-lg">🌱</span>
            <div>
              <div className="text-lg font-bold leading-none text-white">AgroIA</div>
              <div className="text-[11px] text-white/60">dados abertos que trabalham para você</div>
            </div>
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
              <div className="mt-1 text-sm font-semibold text-white">7 fontes oficiais</div>
              <div className="text-[11px] text-white/60">última varredura: hoje, 06:00</div>
            </div>
            <button onClick={() => nav('/prototipo/entrar')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
              <LogOut size={16} /> Sair ({PRODUCER.name})
            </button>
          </div>
        </aside>
        <main className={clsx('min-h-0 flex-1 overflow-y-auto', !full && 'p-4 md:p-6')}>{children}</main>
      </div>
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
    ? <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-dark">dado real</span>
    : <span className="rounded bg-bg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-border">ilustrativo</span>
}
