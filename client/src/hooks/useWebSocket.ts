import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { AlertMessage } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'
const MAX_ALERTS = 50

type Status = 'connecting' | 'connected' | 'disconnected'

export function useWebSocket() {
  const [alerts, setAlerts] = useState<AlertMessage[]>([])
  const [status, setStatus] = useState<Status>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryDelay = useRef(1000)
  const unmounted = useRef(false)

  useEffect(() => {
    unmounted.current = false

    function connect() {
      if (unmounted.current) return
      setStatus('connecting')
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        retryDelay.current = 1000
        setStatus('connected')
      }

      ws.onmessage = (e) => {
        try {
          const msg: AlertMessage = JSON.parse(e.data)
          setAlerts((prev) => [msg, ...prev].slice(0, MAX_ALERTS))
          const label = msg.event_type === 'entry' ? 'Entered' : 'Exited'
          toast(`${msg.vehicle.vehicle_number} ${label} ${msg.geofence.name}`, {
            description: `Driver: ${msg.vehicle.driver_name} · ${new Date(msg.timestamp).toLocaleTimeString()}`,
            duration: 6000,
          })
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (unmounted.current) return
        setStatus('disconnected')
        setTimeout(connect, retryDelay.current)
        retryDelay.current = Math.min(retryDelay.current * 2, 30000)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      unmounted.current = true
      wsRef.current?.close()
    }
  }, [])

  return { alerts, status }
}
