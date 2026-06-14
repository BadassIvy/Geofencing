import { ArrowDownCircle, ArrowUpCircle, Wifi, WifiOff } from 'lucide-react'
import type { AlertMessage } from '../../types'

interface Props {
  alerts: AlertMessage[]
  status: 'connecting' | 'connected' | 'disconnected'
}

export function AlertFeed({ alerts, status }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Live Alerts</span>
        <StatusDot status={status} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-1">
            <Wifi size={20} />
            <span>Waiting for events…</span>
          </div>
        ) : (
          <ul className="divide-y">
            {alerts.map((a) => (
              <AlertItem key={a.event_id} alert={a} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function AlertItem({ alert: a }: { alert: AlertMessage }) {
  const isEntry = a.event_type === 'entry'
  return (
    <li className="px-3 py-2.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-2">
        {isEntry ? (
          <ArrowDownCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
        ) : (
          <ArrowUpCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {a.vehicle.vehicle_number}
            <span className={`ml-1 ${isEntry ? 'text-green-600' : 'text-red-600'}`}>
              {isEntry ? 'entered' : 'exited'}
            </span>
          </p>
          <p className="text-xs text-gray-600 truncate">{a.geofence.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {new Date(a.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </li>
  )
}

function StatusDot({ status }: { status: Props['status'] }) {
  if (status === 'connected')
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Wifi size={12} /> Live
      </span>
    )
  if (status === 'connecting')
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-600">
        <Wifi size={12} /> Connecting…
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-xs text-red-500">
      <WifiOff size={12} /> Offline
    </span>
  )
}
