// Mapa somente-leitura dos talhões (usado no Painel). O editor completo fica em pages/MapPage.tsx.
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { FieldT } from '../lib/api'

export const SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const SATELLITE_ATTR = 'Imagens © Esri, Maxar, Earthstar Geographics'

export function FieldsMap({ fields, onSelect }: { fields: FieldT[]; onSelect?: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const map = L.map(ref.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
    L.tileLayer(SATELLITE, { attribution: SATELLITE_ATTR, maxZoom: 19 }).addTo(map)
    const group = L.featureGroup().addTo(map)
    fields.forEach((f) => {
      const layer = L.geoJSON(f.geometry as GeoJSON.Polygon, {
        style: { color: '#fff', weight: 2, fillColor: f.color ?? '#2E7D4F', fillOpacity: 0.55 },
      })
      layer.bindTooltip(`<b>${f.name}</b><br/>${f.status.label}`, { sticky: true })
      layer.on('click', () => onSelect?.(f.id))
      layer.addTo(group)
      const c = layer.getBounds().getCenter()
      L.marker(c, { interactive: false, icon: L.divIcon({ className: '', html: `<div style="color:#fff;font-weight:700;font-size:12px;text-shadow:0 1px 3px #000;white-space:nowrap;transform:translate(-50%,-50%)">${f.name}</div>` }) }).addTo(group)
    })
    if (fields.length) map.fitBounds(group.getBounds(), { padding: [20, 20] })
    else map.setView([-21.83, -48.23], 14)
    return () => { map.remove() }
  }, [fields, onSelect])
  return <div ref={ref} className="h-full w-full" />
}
