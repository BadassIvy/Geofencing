import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Vehicle } from '../../types'

const vehicleIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#2563eb;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
    font-size:11px;color:white;font-weight:bold;
  ">V</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

interface VehicleWithLocation extends Vehicle {
  last_lat?: number | null
  last_lng?: number | null
}

interface Props {
  vehicles: VehicleWithLocation[]
}

export function VehicleMarkerLayer({ vehicles }: Props) {
  return (
    <>
      {vehicles
        .filter((v) => v.last_lat != null && v.last_lng != null)
        .map((v) => (
          <Marker
            key={v.id}
            position={[v.last_lat!, v.last_lng!]}
            icon={vehicleIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{v.vehicle_number}</p>
                <p className="text-gray-600">{v.driver_name}</p>
                <p className="text-gray-500 capitalize">{v.vehicle_type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  )
}
