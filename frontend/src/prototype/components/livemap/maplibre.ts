// MapLibre v6 procura o worker ao lado do próprio módulo (import.meta.url). Com o Vite (dev otimizado e build
// empacotado) esse arquivo não existe → "Worker failed to load". Aqui o Vite empacota o worker e nos dá a URL.
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(workerUrl)

export * from 'maplibre-gl'
