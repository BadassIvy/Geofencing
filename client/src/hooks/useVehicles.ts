import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVehicle, fetchVehicleLocation, fetchVehicles, updateLocation } from '../api/client'
import type { CreateVehicleRequest, LocationUpdateRequest } from '../types'

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateVehicleRequest) => createVehicle(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: LocationUpdateRequest) => updateLocation(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      qc.invalidateQueries({ queryKey: ['vehicle-location'] })
    },
  })
}

export function useVehicleLocation(vehicleId: string | null) {
  return useQuery({
    queryKey: ['vehicle-location', vehicleId],
    queryFn: () => fetchVehicleLocation(vehicleId!),
    enabled: !!vehicleId,
  })
}
