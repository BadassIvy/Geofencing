import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ReactNode } from 'react'
import type { LatLngExpression } from 'leaflet'

// Fix default marker icon path issue with Vite bundling
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER: LatLngExpression = [20.5937, 78.9629] // India center

interface Props {
  center?: LatLngExpression
  zoom?: number
  children?: ReactNode
  className?: string
}

export function BaseMap({ center = DEFAULT_CENTER, zoom = 10, children, className = 'h-full w-full' }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className={className} style={{ minHeight: '300px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
