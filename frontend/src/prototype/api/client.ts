// Cliente da API do AgroBits (M1). O Vite repassa /api para o backend (:8000).
// Token da conta em localStorage['agrobits.token']; todo acesso ao storage fica em try/catch.

const TOKEN_KEY = 'agrobits.token'
const TIMEOUT_MS = 8000
export const OFFLINE_MSG = 'Servidor fora do ar — rode ./iniciar.sh'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* storage bloqueado: a sessão vale só até recarregar */ }
}

function detail(body: unknown, status: number): string {
  const d = (body as { detail?: unknown } | null)?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg)
  return `Erro ${status} no servidor`
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const token = getToken()
  let res: Response
  try {
    res = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
      method,
      signal: ctrl.signal,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, OFFLINE_MSG)
  } finally {
    window.clearTimeout(timer)
  }
  if (res.status === 204) return null as T
  const isJson = res.headers.get('content-type')?.includes('json')
  // backend desligado: o proxy do Vite responde 5xx sem JSON
  if (!res.ok && res.status >= 500 && !isJson) throw new ApiError(0, OFFLINE_MSG)
  let data: unknown = null
  try { data = isJson ? await res.json() : null } catch { /* corpo vazio */ }
  if (!res.ok) {
    if (res.status === 401 && token) setToken(null) // sessão expirada (ex.: banco recriado)
    throw new ApiError(res.status, detail(data, res.status))
  }
  return data as T
}

export const apiGet = <T>(path: string) => request<T>('GET', path)
export const apiPost = <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {})
export const apiPut = <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {})
export const apiDelete = <T = null>(path: string) => request<T>('DELETE', path)
