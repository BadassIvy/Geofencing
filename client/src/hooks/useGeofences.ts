import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createGeofence, updateGeofence, deleteGeofence, fetchGeofences } from '../api/client'
import type { CreateGeofenceRequest, UpdateGeofenceRequest, GeofenceCategory } from '../types'

export function useGeofences(category?: GeofenceCategory) {
  return useQuery({
    queryKey: ['geofences', category],
    queryFn: () => fetchGeofences(category),
  })
}

export function useCreateGeofence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateGeofenceRequest) => createGeofence(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geofences'] }),
  })
}

export function useUpdateGeofence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGeofenceRequest }) => updateGeofence(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geofences'] }),
  })
}

export function useDeleteGeofence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGeofence(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geofences'] }),
  })
}
