// Metadados visuais das fontes de dados abertos (ícone e rótulos), usados nas telas do protótipo.
import { CalendarRange, CloudSun, Drone, FileSpreadsheet, FlaskConical, Map as MapIcon, Plug, Satellite, ShieldCheck, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const SOURCE_ICON: Record<string, LucideIcon> = {
  zarc: CalendarRange, clima: CloudSun, satelite: Satellite, agrofit: FlaskConical, seguro: ShieldCheck, drones: Drone, pivos: Waves,
}

export const KIND_META: Record<'arquivo' | 'api' | 'mapa', { label: string; icon: LucideIcon; hint: string }> = {
  arquivo: { label: 'Arquivo', icon: FileSpreadsheet, hint: 'planilha (CSV) publicada pelo órgão' },
  api: { label: 'API', icon: Plug, hint: 'consulta automática, em tempo real' },
  mapa: { label: 'Mapa', icon: MapIcon, hint: 'camada geográfica / imagem' },
}

/** "2.338.052" -> 2338052 */
export const parseBR = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'))
