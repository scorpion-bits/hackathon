// Confere se a imagem da NASA (GIBS) tem dado sobre a propriedade: lê o pixel do tile no ponto da sede.
// Imagem vazia (transparente) = nuvem, faixa sem passagem do satélite ou data sem produto → avisar, nunca fingir dado.
import { useEffect, useState } from 'react'
import { GIBS_BASE, type GibsSpec } from './layers'

export type Coverage = 'checking' | 'ok' | 'empty' | 'unknown'

/** km por ponto da imagem no nível nativo da camada (tile de 256 px em Web Mercator). */
export const kmPerPixel = (spec: GibsSpec, lat: number) => (40075 * Math.cos((lat * Math.PI) / 180)) / (256 * 2 ** spec.maxzoom)

function tileAt(spec: GibsSpec, lon: number, lat: number) {
  const n = 2 ** spec.maxzoom
  const fx = ((lon + 180) / 360) * n
  const r = (lat * Math.PI) / 180
  const fy = ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * n
  return { x: Math.floor(fx), y: Math.floor(fy), px: Math.floor((fx % 1) * 256), py: Math.floor((fy % 1) * 256) }
}

export function useCoverage(spec: GibsSpec | undefined, time: string | null, lon: number, lat: number): Coverage {
  const [state, setState] = useState<Coverage>('checking')
  useEffect(() => {
    if (!spec || !time) return
    if (spec.ext === 'jpg') { setState('ok'); return } // foto em cor verdadeira nunca é transparente
    setState('checking')
    let alive = true
    const t = tileAt(spec, lon, lat)
    const url = `${GIBS_BASE}/${spec.layer}/default/${time}/${spec.matrix}/${spec.maxzoom}/${t.y}/${t.x}.${spec.ext}`
    fetch(url)
      .then(async (r) => {
        if (r.status === 404) return 'empty' as const // não há imagem para a data
        if (!r.ok) return 'unknown' as const
        const bmp = await createImageBitmap(await r.blob())
        const c = document.createElement('canvas')
        c.width = bmp.width
        c.height = bmp.height
        const ctx = c.getContext('2d')!
        ctx.drawImage(bmp, 0, 0)
        const x0 = Math.max(0, t.px - 1), y0 = Math.max(0, t.py - 1)
        const d = ctx.getImageData(x0, y0, 3, 3).data // 3×3 pontos em volta da propriedade
        for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return 'ok' as const
        return 'empty' as const
      })
      .catch(() => 'unknown' as const) // sem rede: não afirmamos nada
      .then((v) => { if (alive) setState(v) })
    return () => { alive = false }
  }, [spec, time, lon, lat])
  return spec && time ? state : 'unknown'
}
