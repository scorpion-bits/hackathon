// Sessão da conta (M1): quem está logado, vindo de GET /api/me.
import { useEffect, useSyncExternalStore } from 'react'
import { ApiError, apiGet, apiPost, getToken, setToken } from './client'

export type Me = {
  producer: { id: number; name: string; is_demo: boolean }
  farm: { id: number; name: string; municipality: string; uf: string; geocode: string; lat: number; lon: number; total_area_ha: number | null } | null
  has_interview: boolean
  counts: { fields: number; stock_items: number; events: number; cases: number }
}

/** anon = sem token · offline = API não respondeu */
export type SessionState = { status: 'loading' | 'ready' | 'anon' | 'offline'; me: Me | null; error?: string }

let state: SessionState = { status: getToken() ? 'loading' : 'anon', me: null }
let started = false
const subs = new Set<() => void>()
const set = (s: SessionState) => { state = s; subs.forEach((f) => f()) }

export async function refreshMe(): Promise<Me | null> {
  started = true
  if (!getToken()) { set({ status: 'anon', me: null }); return null }
  try {
    const me = await apiGet<Me>('/me')
    set({ status: 'ready', me })
    return me
  } catch (e) {
    const err = e as ApiError
    set(err.status === 0 ? { status: 'offline', me: null, error: err.message } : { status: 'anon', me: null, error: err.message })
    if (err.status === 0) throw err
    return null
  }
}

/** Guarda o token recebido do login/cadastro/demo e carrega a conta. */
export async function signIn(token: string): Promise<Me> {
  setToken(token)
  const me = await refreshMe()
  if (!me) throw new ApiError(401, 'Não foi possível abrir a conta')
  return me
}

export async function logout() {
  try { await apiPost('/auth/logout') } catch { /* sai mesmo sem servidor */ }
  setToken(null)
  set({ status: 'anon', me: null })
}

export function useMe(): SessionState {
  const s = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state)
  useEffect(() => { if (!started) refreshMe().catch(() => {}) }, [])
  return s
}
