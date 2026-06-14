import axios from 'axios'
import type {
  Vehicle,
  CreateVehicleRequest,
  LocationUpdateRequest,
  VehicleLocation,
  Geofence,
  CreateGeofenceRequest,
  UpdateGeofenceRequest,
  AlertConfig,
  CreateAlertConfigRequest,
  Violation,
  GeofenceCategory,
  EventType,
} from '../types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

// Geofences
export async function fetchGeofences(category?: GeofenceCategory): Promise<Geofence[]> {
  const params = category ? { category } : {}
  const { data } = await http.get('/geofences', { params })
  return data.geofences ?? []
}

export async function createGeofence(body: CreateGeofenceRequest): Promise<{ id: string }> {
  const { data } = await http.post('/geofences', body)
  return data
}

export async function updateGeofence(id: string, body: UpdateGeofenceRequest): Promise<{ id: string }> {
  const { data } = await http.put(`/geofences/${id}`, body)
  return data
}

export async function deleteGeofence(id: string): Promise<void> {
  await http.delete(`/geofences/${id}`)
}

// Vehicles
export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data } = await http.get('/vehicles')
  return data.vehicles ?? []
}

export async function createVehicle(body: CreateVehicleRequest): Promise<{ id: string }> {
  const { data } = await http.post('/vehicles', body)
  return data
}

export async function updateLocation(body: LocationUpdateRequest) {
  const { data } = await http.post('/vehicles/location', body)
  return data
}

export async function fetchVehicleLocation(vehicleId: string): Promise<VehicleLocation> {
  const { data } = await http.get(`/vehicles/location/${vehicleId}`)
  return data
}

// Alerts
export async function fetchAlerts(params?: { geofence_id?: string; vehicle_id?: string }): Promise<AlertConfig[]> {
  const { data } = await http.get('/alerts', { params })
  return data.alerts ?? []
}

export async function createAlertConfig(body: CreateAlertConfigRequest): Promise<{ alert_id: string }> {
  const { data } = await http.post('/alerts/configure', body)
  return data
}

// Violations
export async function fetchViolations(params: {
  vehicle_id?: string
  geofence_id?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}): Promise<{ count: number; violations: Violation[] }> {
  const { data } = await http.get('/violations/history', { params })
  return { count: data.count ?? 0, violations: data.violations ?? [] }
}

export type { GeofenceCategory, EventType, UpdateGeofenceRequest }
