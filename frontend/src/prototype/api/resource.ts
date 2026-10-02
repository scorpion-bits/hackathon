// Leitura de GET da API com cache em memória (M4): mostra o último resultado na hora e recarrega ao entrar na tela.
// O cache é descartado quando a conta muda (login, logout, "voltar ao exemplo"), para nunca misturar contas.
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { apiGet } from './client'
import { getSession, onSessionChange } from './session'

type Entry = { data: unknown; error: string | null; loading: boolean; at: number }
const EMPTY: Entry = { data: null, error: null, loading: true, at: 0 }
const STALE_MS = 20_000

const store = new Map<string, Entry>()
const inflight = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

let owner: number | null | undefined
onSessionChange(() => {
  const id = getSession().me?.producer.id ?? null
  if (owner !== undefined && id !== owner) { store.clear(); inflight.clear(); emit() }
  owner = id
})

export function load(path: string): Promise<void> {
  const running = inflight.get(path)
  if (running) return running
  const prev = store.get(path)
  store.set(path, { data: prev?.data ?? null, error: null, loading: true, at: prev?.at ?? 0 })
  emit()
  const p = apiGet<unknown>(path)
    .then((data) => { store.set(path, { data, error: null, loading: false, at: Date.now() }) })
    .catch((e: Error) => { store.set(path, { data: prev?.data ?? null, error: e.message, loading: false, at: prev?.at ?? 0 }) })
    .finally(() => { inflight.delete(path); emit() })
  inflight.set(path, p)
  return p
}

/** Recarrega tudo que já foi lido com este prefixo (ex.: depois de enviar um caso, `/topics`). */
export function reloadPrefix(...prefixes: string[]) {
  for (const path of [...store.keys()]) if (prefixes.some((p) => path.startsWith(p))) void load(path)
}

export type Resource<T> = { data: T | null; error: string | null; loading: boolean; reload: () => Promise<void> }

/** `path` nulo = não busca (ex.: sem conta ainda). Com `data` já em cache e `error`, o dado antigo continua disponível. */
export function useApi<T>(path: string | null): Resource<T> {
  const entry = useSyncExternalStore(subscribe, () => (path ? store.get(path) ?? EMPTY : EMPTY))
  useEffect(() => {
    if (!path) return
    const e = store.get(path)
    if (!e || Date.now() - e.at > STALE_MS) void load(path)
  }, [path, entry === EMPTY])
  const reload = useCallback(() => (path ? load(path) : Promise.resolve()), [path])
  return { data: entry.data as T | null, error: entry.error, loading: !!path && entry.loading && entry.data === null, reload }
}
