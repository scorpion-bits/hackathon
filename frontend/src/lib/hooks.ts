import { useCallback, useEffect, useState } from 'react'
import { DATA_CHANGED } from './api'

/** Carrega dados da API e recarrega automaticamente quando qualquer registro muda (DATA_CHANGED). */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    setLoading(true)
    return loader()
      .then((d) => { setData(d); setError(null) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, deps)
  useEffect(() => {
    load()
    window.addEventListener(DATA_CHANGED, load)
    return () => window.removeEventListener(DATA_CHANGED, load)
  }, [load])
  return { data, error, loading, reload: load, setData }
}
