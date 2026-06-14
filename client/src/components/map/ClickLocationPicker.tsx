import { useMapEvents, Marker } from 'react-leaflet'
import { useState } from 'react'
import type { LatLng } from 'leaflet'

interface Props {
  onPick: (lat: number, lng: number) => void
}

export function ClickLocationPicker({ onPick }: Props) {
  const [pos, setPos] = useState<LatLng | null>(null)

  useMapEvents({
    click(e) {
      setPos(e.latlng)
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })

  return pos ? <Marker position={pos} /> : null
}
