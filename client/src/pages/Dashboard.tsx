import { BaseMap } from '../components/map/BaseMap'
import { GeofenceLayer } from '../components/map/GeofenceLayer'
import { VehicleMarkerLayer } from '../components/map/VehicleMarkerLayer'
import { AlertFeed } from '../components/alerts/AlertFeed'
import { useGeofences } from '../hooks/useGeofences'
import { useVehicles } from '../hooks/useVehicles'
import { useWebSocket } from '../hooks/useWebSocket'
import { PageSpinner } from '../components/ui/Spinner'

export function Dashboard() {
  const { data: geofences = [], isLoading: gLoading } = useGeofences()
  const { data: vehicles = [], isLoading: vLoading } = useVehicles()
  const { alerts, status } = useWebSocket()

  return (
    <div className="flex h-screen">
      {/* Map area */}
      <div className="flex-1 relative">
        {(gLoading || vLoading) && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <PageSpinner />
          </div>
        )}
        <BaseMap className="h-full w-full" zoom={5}>
          <GeofenceLayer geofences={geofences} />
          <VehicleMarkerLayer vehicles={vehicles as Parameters<typeof VehicleMarkerLayer>[0]['vehicles']} />
        </BaseMap>
        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow p-3 text-xs space-y-1">
          <p className="font-semibold text-gray-700 mb-1">Categories</p>
          {[
            { label: 'Delivery Zone', color: '#3b82f6' },
            { label: 'Restricted Zone', color: '#ef4444' },
            { label: 'Toll Zone', color: '#f59e0b' },
            { label: 'Customer Area', color: '#10b981' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Alert feed */}
      <div className="w-72 border-l bg-white flex flex-col">
        <AlertFeed alerts={alerts} status={status} />
      </div>
    </div>
  )
}
