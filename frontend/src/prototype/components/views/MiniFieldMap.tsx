// Mini mapa estático (SVG) desenhado a partir dos polígonos [lon, lat] dos talhões. Sem Leaflet, sem rede.
import { useId } from 'react'

export type MapField = { id: number; name: string; color: string; poly: number[][] }

type Props = {
  fields: MapField[]
  /** pino da sede (lon, lat) */
  pin?: [number, number]
  labels?: boolean
  scaleBar?: boolean
  className?: string
  /** talhão em destaque (os demais ficam mais claros) */
  focusId?: number
  height?: number
}

export function MiniFieldMap({ fields, pin, labels = false, scaleBar = false, className, focusId, height = 140 }: Props) {
  const uid = useId().replace(/:/g, '')
  const W = 320
  const H = height
  const pad = 18
  const all = fields.flatMap((f) => f.poly)
  if (pin) all.push([pin[0], pin[1]])
  const lat0 = all.reduce((s, p) => s + p[1], 0) / all.length
  const k = Math.cos((lat0 * Math.PI) / 180)
  const minLon = Math.min(...all.map((p) => p[0])), maxLat = Math.max(...all.map((p) => p[1]))
  const maxLon = Math.max(...all.map((p) => p[0])), minLat = Math.min(...all.map((p) => p[1]))
  const w = Math.max((maxLon - minLon) * k, 1e-9), h = Math.max(maxLat - minLat, 1e-9)
  const s = Math.min((W - 2 * pad) / w, (H - 2 * pad) / h)
  const ox = (W - w * s) / 2, oy = (H - h * s) / 2
  const px = (lon: number) => ox + (lon - minLon) * k * s
  const py = (lat: number) => oy + (maxLat - lat) * s
  const centroid = (poly: number[][]) => [poly.reduce((a, p) => a + px(p[0]), 0) / poly.length, poly.reduce((a, p) => a + py(p[1]), 0) / poly.length]
  // 100 m em graus de latitude ≈ 100 / 111_320
  const bar100 = (100 / 111320) * s

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ backgroundColor: '#EEF3E8', backgroundImage: 'linear-gradient(#DCE6D5 1px, transparent 1px), linear-gradient(90deg, #DCE6D5 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Mapa esquemático dos talhões" preserveAspectRatio="xMidYMid meet">
      <defs>
        {fields.map((f) => (
          <pattern key={f.id} id={`row${uid}${f.id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
            <rect width="7" height="7" fill={f.color} fillOpacity="0.16" />
            <line x1="0" y1="0" x2="0" y2="7" stroke={f.color} strokeOpacity="0.55" strokeWidth="1.6" />
          </pattern>
        ))}
      </defs>
      {fields.map((f) => {
        const dim = focusId != null && focusId !== f.id
        const pts = f.poly.map((p) => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ')
        const [cx, cy] = centroid(f.poly)
        return (
          <g key={f.id} opacity={dim ? 0.45 : 1}>
            <polygon points={pts} fill={`url(#row${uid}${f.id})`} stroke={f.color} strokeWidth="2.2" strokeLinejoin="round" />
            {f.poly.map((p, i) => <circle key={i} cx={px(p[0])} cy={py(p[1])} r="2.6" fill="#fff" stroke={f.color} strokeWidth="1.4" />)}
            {labels && (
              <g>
                <rect x={cx - 26} y={cy - 8} width="52" height="16" rx="8" fill="#fff" fillOpacity="0.92" stroke={f.color} strokeWidth="0.8" />
                <text x={cx} y={cy + 3.6} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1C2B21">{f.name}</text>
              </g>
            )}
          </g>
        )
      })}
      {pin && (
        <g>
          <circle cx={px(pin[0])} cy={py(pin[1])} r="7" fill="#fff" stroke="#1C2B21" strokeWidth="1.5" />
          <path d={`M${px(pin[0]) - 3.5} ${py(pin[1]) + 1.5}L${px(pin[0])} ${py(pin[1]) - 3.2}L${px(pin[0]) + 3.5} ${py(pin[1]) + 1.5}V${py(pin[1]) + 3.6}H${px(pin[0]) - 3.5}Z`} fill="#1C2B21" />
        </g>
      )}
      {scaleBar && (
        <g transform={`translate(10 ${H - 12})`}>
          <rect x="-3" y="-9" width={bar100 + 40} height="16" rx="4" fill="#fff" fillOpacity="0.85" />
          <line x1="0" y1="0" x2={bar100} y2="0" stroke="#1C2B21" strokeWidth="2" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#1C2B21" strokeWidth="2" />
          <line x1={bar100} y1="-3" x2={bar100} y2="3" stroke="#1C2B21" strokeWidth="2" />
          <text x={bar100 + 5} y="3" fontSize="8" fill="#1C2B21">100 m</text>
        </g>
      )}
    </svg>
    <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-[9px] font-bold text-muted shadow-sm ring-1 ring-border" aria-hidden>N↑</div>
    </div>
  )
}
