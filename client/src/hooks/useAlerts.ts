import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAlertConfig, fetchAlerts, fetchViolations } from '../api/client'
import type { CreateAlertConfigRequest } from '../types'

export function useAlerts(params?: { geofence_id?: string; vehicle_id?: string }) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => fetchAlerts(params),
  })
}

export function useCreateAlertConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAlertConfigRequest) => createAlertConfig(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

export function useViolations(params: {
  vehicle_id?: string
  geofence_id?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['violations', params],
    queryFn: () => fetchViolations(params),
  })
}
