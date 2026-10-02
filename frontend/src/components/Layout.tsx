import clsx from 'clsx'
import { BarChart3, Bell, Bot, CloudSun, Home, Map, Package, Plus, Settings, Sprout, Calculator } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApi } from '../lib/hooks'
import { AlertRow } from './data'
import { RegisterModal } from './RegisterModal'

const NAV = [
  { to: '/', label: 'Painel', icon: Home },
  { to: '/mapa', label: 'Mapa da propriedade', icon: Map },
  { to: '/producao', label: 'Produção', icon: Sprout },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/clima', label: 'Clima', icon: CloudSun },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/simulacao', label: 'Simulação', icon: Calculator },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function Layout({ children }: { children: ReactNode }) {
  const farm = useApi(api.farm)
  const alerts = useApi(api.alerts)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const nav = useNavigate()
  const unread = alerts.data?.filter((a) => !a.read) ?? []

  const link = ({ isActive }: { isActive: boolean }) =>
    clsx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
      isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')

  return (
    <div className="flex h-full">
      <aside className="iso-grid hidden w-60 shrink-0 flex-col bg-sidebar p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img src="/brand/agrobits-simbolo.png" alt="" width={38} height={38} />
          <div>
            <div className="font-display text-lg font-extrabold leading-none text-white">AgroBits</div>
            <div className="text-[11px] text-white/60">dado público para cada talhão</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={link}>
              <Icon size={18} /> {label}
              {to === '/alertas' && unread.length > 0 && <span className="ml-auto rounded-full bg-danger px-1.5 text-[11px] text-white">{unread.length}</span>}
            </NavLink>
          ))}
          <div className="my-3 border-t border-white/10" />
          <NavLink to="/assistente" className={link}><Bot size={18} /> Assistente IA</NavLink>
          <NavLink to="/perfil" className={link}><Settings size={18} /> Perfil</NavLink>
        </nav>
        <div className="rounded-lg bg-white/5 p-3 text-[11px] leading-snug text-white/60">
          Dados abertos: MAPA (Zarc, Agrofit, SIPEAGRO, Seguro Rural) · Open-Meteo
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{farm.data?.name ?? '…'} <span className="font-normal text-muted">· {farm.data?.municipality}/{farm.data?.uf}</span></div>
            <div className="text-xs text-muted">
              {farm.data?.producer.name} · Safra {farm.data?.current_season?.name}
              {farm.data?.producer.is_demo && <span className="ml-2 rounded bg-danger-soft px-1.5 py-0.5 font-semibold text-danger">DADOS FICTÍCIOS DE DEMONSTRAÇÃO</span>}
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setBellOpen((v) => !v)} className="relative rounded-lg p-2 text-muted hover:bg-bg" aria-label="Alertas">
              <Bell size={20} />
              {unread.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">{unread.length}</span>}
            </button>
            {bellOpen && (
              <div className="absolute right-0 z-[900] mt-2 w-96 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <div className="px-2 py-1 text-xs font-semibold uppercase text-muted">Alertas</div>
                {unread.length === 0 && <div className="p-3 text-sm text-muted">Nenhum alerta novo.</div>}
                {unread.slice(0, 5).map((a) => <AlertRow key={a.key} alert={a} onOpen={() => { setBellOpen(false); nav('/alertas', { state: { open: a.key } }) }} />)}
                <button onClick={() => { setBellOpen(false); nav('/alertas') }} className="w-full rounded-lg p-2 text-sm font-medium text-primary hover:bg-bg">Ver todos</button>
              </div>
            )}
          </div>
          <button onClick={() => setRegisterOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark">
            <Plus size={18} /> Registrar
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </div>
  )
}
