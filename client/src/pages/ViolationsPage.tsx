import { useState } from 'react'
import { ChevronLeft, ChevronRight, History } from 'lucide-react'
import { useViolations } from '../hooks/useAlerts'
import { useGeofences } from '../hooks/useGeofences'
import { useVehicles } from '../hooks/useVehicles'
import { Badge, eventVariant } from '../components/ui/Badge'
import { PageSpinner } from '../components/ui/Spinner'

const PAGE_SIZE = 20

export function ViolationsPage() {
  const [vehicleId, setVehicleId] = useState('')
  const [geofenceId, setGeofenceId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)

  const { data: vehicles = [] } = useVehicles()
  const { data: geofences = [] } = useGeofences()
  const { data, isLoading } = useViolations({
    vehicle_id: vehicleId || undefined,
    geofence_id: geofenceId || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const count = data?.count ?? 0
  const violations = data?.violations ?? []
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const resetFilters = () => {
    setVehicleId(''); setGeofenceId(''); setStartDate(''); setEndDate(''); setPage(0)
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Violation History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historical geofence entry/exit events</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle</label>
              <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setPage(0) }} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All vehicles</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Geofence</label>
              <select value={geofenceId} onChange={(e) => { setGeofenceId(e.target.value); setPage(0) }} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All geofences</option>
                {geofences.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0) }} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0) }} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {(vehicleId || geofenceId || startDate || endDate) && (
            <button onClick={resetFilters} className="mt-3 text-xs text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{count} events</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                Page {page + 1} of {totalPages}
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          {isLoading ? (
            <PageSpinner />
          ) : violations.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No violations found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Geofence</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {violations.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.vehicle_number}</td>
                    <td className="px-4 py-3 text-gray-700">{v.geofence_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={eventVariant(v.event_type)}>{v.event_type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(v.timestamp).toLocaleString()}
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
