// Estilo do globo construído em código (sem chave de API). Protótipo visual (D-009).
import type { Feature, FeatureCollection } from 'geojson'
import type { StyleSpecification } from 'maplibre-gl'
import { FIELDS } from '../../mock'
import { RISK_COLOR, riskFor } from './layers'

export const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const MAP_BG = '#0b1a12'

/** Ids de camadas do estilo usados pela página. */
export const L = { esri: 'base-esri', osm: 'base-osm', graticule: 'graticule', fill: 'fields-fill', line: 'fields-line', halo: 'fields-halo', thematic: 'thematic' } as const

type Ring = number[][]

export function centroid(poly: number[][]): [number, number] {
  const n = poly.length
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n]
}

/** Talhões do produtor como GeoJSON (cor da cultura + cor do risco Zarc na data). */
export function fieldsGeoJSON(date: Date): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: FIELDS.map((f) => {
      const ring: Ring = [...f.poly, f.poly[0]]
      const risk = riskFor(f, date)
      return {
        type: 'Feature', id: f.id,
        properties: { id: f.id, name: f.name, crop: f.crop, color: f.color, risk, riskColor: RISK_COLOR(risk) },
        geometry: { type: 'Polygon', coordinates: [ring] },
      }
    }),
  }
}

/** Grade de latitude/longitude — dá forma ao globo mesmo sem os tiles (rede bloqueada / offline). */
function graticule(step = 15): FeatureCollection {
  const features: Feature[] = []
  for (let lon = -180; lon <= 180; lon += step) {
    const coords: number[][] = []
    for (let lat = -85; lat <= 85; lat += 5) coords.push([lon, lat])
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } })
  }
  for (let lat = -75; lat <= 75; lat += step) {
    const coords: number[][] = []
    for (let lon = -180; lon <= 180; lon += 5) coords.push([lon, lat])
    features.push({ type: 'Feature', properties: { eq: lat === 0 }, geometry: { type: 'LineString', coordinates: coords } })
  }
  return { type: 'FeatureCollection', features }
}

export function buildStyle(date: Date): StyleSpecification {
  return {
    version: 8,
    projection: { type: 'globe' },
    sky: {
      'sky-color': '#0d2a3f',
      'horizon-color': '#3f8fb8',
      'fog-color': '#0b1a12',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.4,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 1, 9, 0],
    },
    sources: {
      esri: { type: 'raster', tiles: [ESRI_URL], tileSize: 256, maxzoom: 19, attribution: 'Imagens © Esri, Maxar' },
      osm: { type: 'raster', tiles: [OSM_URL], tileSize: 256, maxzoom: 19, attribution: '© OpenStreetMap (colaboradores)' },
      graticule: { type: 'geojson', data: graticule() },
      fields: { type: 'geojson', data: fieldsGeoJSON(date) },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': MAP_BG } },
      { id: L.esri, type: 'raster', source: 'esri', paint: { 'raster-fade-duration': 250 } },
      { id: L.osm, type: 'raster', source: 'osm', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 250 } },
      {
        id: L.graticule, type: 'line', source: 'graticule',
        paint: {
          'line-color': ['case', ['==', ['get', 'eq'], true], '#e8c66a', '#8fe0b8'],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.28, 5, 0.12, 8, 0],
          'line-width': ['case', ['==', ['get', 'eq'], true], 1.2, 0.6],
        },
      },
      // camada temática (GIBS) é inserida aqui, antes dos talhões
      { id: L.fill, type: 'fill', source: 'fields', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.38 } },
      {
        id: L.halo, type: 'line', source: 'fields',
        paint: { 'line-color': '#facc15', 'line-width': 7, 'line-blur': 2, 'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.85, 0] },
      },
      {
        id: L.line, type: 'line', source: 'fields',
        paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 2.5], 'line-opacity': 0.95 },
      },
    ],
  }
}
