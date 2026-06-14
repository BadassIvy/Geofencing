import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, MapPin, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { useVehicles, useCreateVehicle, useUpdateLocation } from '../hooks/useVehicles'
import { BaseMap } from '../components/map/BaseMap'
import { ClickLocationPicker } from '../components/map/ClickLocationPicker'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { PageSpinner, Spinner } from '../components/ui/Spinner'
import type { CreateVehicleRequest, Vehicle, VehicleType } from '../types'

const VEHICLE_TYPES: VehicleType[] = ['car', 'truck', 'motorcycle', 'van']

export function VehiclesPage() {
  const { data: vehicles = [], isLoading } = useVehicles()
  const [showCreate, setShowCreate] = useState(false)
  const [locationTarget, setLocationTarget] = useState<Vehicle | null>(null)

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-sm text-gray-500 mt-0.5">{vehicles.length} registered</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Register Vehicle
          </button>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No vehicles registered yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.vehicle_number}</td>
                    <td className="px-4 py-3 text-gray-700">{v.driver_name}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{v.vehicle_type}</td>
                    <td className="px-4 py-3 text-gray-500">{v.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="green">{v.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setLocationTarget(v)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        <MapPin size={13} /> Update Location
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreateVehicleModal onClose={() => setShowCreate(false)} />}
      {locationTarget && <LocationModal vehicle={locationTarget} onClose={() => setLocationTarget(null)} />}
    </div>
  )
}

function CreateVehicleModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateVehicleRequest>()
  const { mutateAsync, isPending } = useCreateVehicle()

  const onSubmit = handleSubmit(async (data) => {
    try {
      await mutateAsync(data)
      toast.success('Vehicle registered')
      onClose()
    } catch {
      toast.error('Failed to register vehicle')
    }
  })

  return (
    <Modal title="Register Vehicle" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Number *</label>
          <input {...register('vehicle_number', { required: true })} placeholder="ABC-1234" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.vehicle_number && <p className="text-xs text-red-500 mt-0.5">Required</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Driver Name *</label>
          <input {...register('driver_name', { required: true })} placeholder="John Doe" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.driver_name && <p className="text-xs text-red-500 mt-0.5">Required</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type *</label>
          <select {...register('vehicle_type', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select type…</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          {errors.vehicle_type && <p className="text-xs text-red-500 mt-0.5">Required</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
          <input {...register('phone')} placeholder="+91 9876543210" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {isPending && <Spinner size="sm" />} Register
          </button>
        </div>
      </form>
    </Modal>
  )
}

function LocationModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const { mutateAsync, isPending } = useUpdateLocation()

  const submit = async () => {
    if (!coords) { toast.error('Click on the map to pick a location'); return }
    try {
      await mutateAsync({ vehicle_id: vehicle.id, latitude: coords.lat, longitude: coords.lng })
      toast.success(`Location updated for ${vehicle.vehicle_number}`)
      onClose()
    } catch {
      toast.error('Failed to update location')
    }
  }

  return (
    <Modal title={`Update Location — ${vehicle.vehicle_number}`} onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">Click anywhere on the map to set the vehicle's current location.</p>
        {coords && (
          <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded-lg text-gray-700">
            Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
          </p>
        )}
        <BaseMap zoom={5} className="h-72 w-full rounded-lg overflow-hidden border">
          <ClickLocationPicker onPick={(lat, lng) => setCoords({ lat, lng })} />
        </BaseMap>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={isPending || !coords} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {isPending && <Spinner size="sm" />} Confirm Location
          </button>
        </div>
      </div>
    </Modal>
  )
}
