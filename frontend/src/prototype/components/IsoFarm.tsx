// Propriedade em VISTA ISOMÉTRICA (estilo da logo AgroBits): cada talhão é um bloco com laterais e contorno grosso,
// sobre uma "placa" de terreno. Desenhado em SVG a partir dos polígonos reais (lon, lat) — sem rede, sem 3D.
import { useId } from 'react'

export type IsoField = { id: number; name: string; crop: string; color: string; poly: number[][]; risk?: number }

const OUT = '#0E3B22'
const RISK_TOP = (r: number) => (r >= 40 ? '#E5484D' : r >= 30 ? '#F2C94C' : r > 0 ? '#4FD08A' : '#B8C4BC')

/** Escurece uma cor #rrggbb (laterais do bloco). */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`
}

export function IsoFarm({ fields, colorBy = 'risk', focusId, height = 180, labels = true, className }: {
  fields: IsoField[]; colorBy?: 'risk' | 'crop'; focusId?: number; height?: number; labels?: boolean; className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const pts = fields.flatMap((f) => f.poly)
  if (!pts.length) return <div className={className} style={{ height }} />

  // chão em metros (x = leste, y = norte)
  const lat0 = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const kx = Math.cos((lat0 * Math.PI) / 180) * 111320, ky = 111320
  const minLon = Math.min(...pts.map((p) => p[0])), minLat = Math.min(...pts.map((p) => p[1]))
  const ground = (p: number[]) => [(p[0] - minLon) * kx, (p[1] - minLat) * ky]
  // projeção isométrica: gira 45° e achata o eixo vertical pela metade
  const iso = ([x, y]: number[]) => [(x - y) / Math.SQRT2, -(x + y) / Math.SQRT2 / 2]

  const W = 320, H = height, pad = 12
  const gpts = pts.map(ground)
  const gx = gpts.map((p) => p[0]), gy = gpts.map((p) => p[1])
  const m = Math.max(Math.max(...gx) - Math.min(...gx), Math.max(...gy) - Math.min(...gy)) * 0.07 + 8
  const plate = [[Math.min(...gx) - m, Math.min(...gy) - m], [Math.max(...gx) + m, Math.min(...gy) - m], [Math.max(...gx) + m, Math.max(...gy) + m], [Math.min(...gx) - m, Math.max(...gy) + m]]
  const all = [...plate, ...gpts].map(iso)
  const ix = all.map((p) => p[0]), iy = all.map((p) => p[1])
  const PLATE_H = 10, BLOCK_H = 9 // px na tela
  const s = Math.min((W - 2 * pad) / (Math.max(...ix) - Math.min(...ix)), (H - 2 * pad - PLATE_H - BLOCK_H) / (Math.max(...iy) - Math.min(...iy)))
  const ox = (W - (Math.max(...ix) - Math.min(...ix)) * s) / 2 - Math.min(...ix) * s
  const oy = pad + BLOCK_H - Math.min(...iy) * s
  const scr = (g: number[], lift = 0): [number, number] => { const [a, b] = iso(g); return [ox + a * s, oy + b * s - lift] }
  const path = (ps: [number, number][]) => ps.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

  /** bloco extrudado: todas as laterais (o topo, pintado por último, cobre as de trás) + topo */
  const block = (poly: number[][], h: number, base = 0) => {
    const b = poly.map((p) => scr(p, base)), t = poly.map((p) => scr(p, base + h))
    const sides = b.map((_, i) => {
      const j = (i + 1) % b.length
      return { d: path([b[i], b[j], t[j], t[i]]), light: b[j][0] > b[i][0] }
    })
    return { sides, top: path(t) }
  }

  const plateB = block(plate, PLATE_H, -PLATE_H)
  // ordem de pintura: de trás (mais alto na tela) para frente
  const order = [...fields].sort((a, b) => {
    const cy = (f: IsoField) => f.poly.map(ground).reduce((acc, p) => acc + iso(p)[1], 0) / f.poly.length
    return cy(a) - cy(b)
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} style={{ height }} role="img" aria-label="Propriedade em vista isométrica">
      <defs>
        <pattern id={`rows${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#000" strokeOpacity="0.12" strokeWidth="1.5" />
        </pattern>
      </defs>
      {/* placa de terreno */}
      {plateB.sides.map((sd, i) => <path key={i} d={sd.d} fill={sd.light ? '#7A5230' : '#5B3B22'} stroke={OUT} strokeWidth={2} strokeLinejoin="round" />)}
      <path d={plateB.top} fill="#2C5A3C" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
      {order.map((f) => {
        const topColor = colorBy === 'risk' ? RISK_TOP(f.risk ?? 0) : f.color
        const dim = focusId != null && focusId !== f.id
        const raise = focusId === f.id ? 6 : 0
        const bl = block(f.poly.map(ground), BLOCK_H + raise)
        return (
          <g key={f.id} opacity={dim ? 0.55 : 1}>
            {bl.sides.map((sd, i) => <path key={i} d={sd.d} fill={shade(topColor, sd.light ? 0.72 : 0.5)} stroke={OUT} strokeWidth={2} strokeLinejoin="round" />)}
            <path d={bl.top} fill={topColor} stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
            <path d={bl.top} fill={`url(#rows${uid})`} />
          </g>
        )
      })}
      {labels && order.map((f) => {
        const t = f.poly.map((p) => scr(ground(p), BLOCK_H + (focusId === f.id ? 6 : 0)))
        const cx = t.reduce((a, p) => a + p[0], 0) / t.length, cy = t.reduce((a, p) => a + p[1], 0) / t.length
        const txt = colorBy === 'risk' && f.risk != null ? `${f.crop.split(' ')[0]} · ${f.risk ? `${f.risk}%` : 'fora'}` : f.crop.split(' ')[0]
        const w = Math.max(44, txt.length * 6.2 + 12)
        return (
          <g key={`l${f.id}`} transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)})`}>
            <rect x={-w / 2} y={-9} width={w} height={18} rx={9} fill="#fff" stroke={OUT} strokeWidth={1.5} />
            <text y={4} textAnchor="middle" fontSize="10.5" fontWeight={800} fill={OUT} fontFamily="Montserrat, Inter, sans-serif">{txt}</text>
          </g>
        )
      })}
    </svg>
  )
}
