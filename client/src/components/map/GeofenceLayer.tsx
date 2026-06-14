import { Polygon, Tooltip } from 'react-leaflet'
import type { Geofence } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  delivery_zone: '#3b82f6',
  restricted_zone: '#ef4444',
  toll_zone: '#f59e0b',
  customer_area: '#10b981',
}

interface Props {
  geofences: Geofence[]
  onSelect?: (g: Geofence) => void
}

export function GeofenceLayer({ geofences, onSelect }: Props) {
  return (
    <>
      {geofences.map((g) => {
        const color = CATEGORY_COLORS[g.category] ?? '#6b7280'
        return (
          <Polygon
            key={g.id}
            positions={g.coordinates.map(([lat, lng]) => [lat, lng] as [number, number])}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 2 }}
            eventHandlers={{ click: () => onSelect?.(g) }}
          >
            <Tooltip sticky>{g.name}</Tooltip>
          </Polygon>
        )
      })}
    </>
  )
}
