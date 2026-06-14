import { useForm } from 'react-hook-form'
import { Bell, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAlerts, useCreateAlertConfig } from '../hooks/useAlerts'
import { useGeofences } from '../hooks/useGeofences'
import { useVehicles } from '../hooks/useVehicles'
import { Badge, eventVariant } from '../components/ui/Badge'
import { PageSpinner, Spinner } from '../components/ui/Spinner'
import type { CreateAlertConfigRequest, EventType } from '../types'

const EVENT_TYPES: EventType[] = ['entry', 'exit', 'both']

export function AlertConfigPage() {
  const { data: alerts = [], isLoading } = useAlerts()
  const { data: geofences = [] } = useGeofences()
  const { data: vehicles = [] } = useVehicles()
  const { mutateAsync, isPending } = useCreateAlertConfig()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAlertConfigRequest>()

  const onSubmit = handleSubmit(async (data) => {
    try {
      const body: CreateAlertConfigRequest = { geofence_id: data.geofence_id, event_type: data.event_type }
      if (data.vehicle_id) body.vehicle_id = data.vehicle_id
      await mutateAsync(body)
      toast.success('Alert rule created')
      reset()
    } catch {
      toast.error('Failed to create alert rule')
    }
  })

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alert Rules</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure which events trigger real-time notifications</p>
        </div>

        {/* Create form */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={15} className="text-blue-600" /> New Alert Rule
          </h2>
          <form onSubmit={onSubmit} className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Geofence *</label>
              <select {...register('geofence_id', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select geofence…</option>
                {geofences.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              {errors.geofence_id && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle <span className="text-gray-400 font-normal">(optional — all if blank)</span></label>
              <select {...register('vehicle_id')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All vehicles</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_number} – {v.driver_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Event Type *</label>
              <select {...register('event_type', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select…</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              {errors.event_type && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div className="col-span-3 flex justify-end">
              <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {isPending && <Spinner size="sm" />} Create Rule
              </button>
            </div>
          </form>
        </div>

        {/* Alert rules list */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <Bell size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Configured Rules ({alerts.length})</span>
          </div>
          {isLoading ? (
            <PageSpinner />
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No alert rules configured yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-4 py-3">Geofence</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alerts.map((a) => (
                  <tr key={a.alert_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.geofence_name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.vehicle_number ?? <span className="text-gray-400 italic">All vehicles</span>}</td>
                    <td className="px-4 py-3">
                      <Badge variant={eventVariant(a.event_type === 'both' ? 'entry' : a.event_type)}>
                        {a.event_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === 'active' ? 'green' : 'gray'}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
