export type VehicleType = 'car' | 'truck' | 'motorcycle' | 'van'
export type EventType = 'entry' | 'exit' | 'both'
export type GeofenceCategory = 'delivery_zone' | 'restricted_zone' | 'toll_zone' | 'customer_area'

export interface Vehicle {
  id: string
  vehicle_number: string
  driver_name: string
  vehicle_type: VehicleType
  phone: string
  status: string
  created_at: string
}

export interface CreateVehicleRequest {
  vehicle_number: string
  driver_name: string
  vehicle_type: VehicleType
  phone?: string
}

export interface LocationUpdateRequest {
  vehicle_id: string
  latitude: number
  longitude: number
}

export interface VehicleGeofence {
  geofence_id: string
  geofence_name: string
  category: GeofenceCategory
}

export interface VehicleLocation {
  vehicle_id: string
  vehicle_number: string
  current_location: {
    latitude: number
    longitude: number
    timestamp: string
  } | null
  current_geofences: VehicleGeofence[]
}

export interface Geofence {
  id: string
  name: string
  description: string
  category: GeofenceCategory
  coordinates: [number, number][]
  status: string
  created_at: string
}

export interface CreateGeofenceRequest {
  name: string
  description?: string
  category: GeofenceCategory
  coordinates: [number, number][]
}

export interface UpdateGeofenceRequest {
  name?: string
  description?: string
  category?: GeofenceCategory
  coordinates?: [number, number][]
}

export interface AlertConfig {
  alert_id: string
  geofence_id: string
  geofence_name: string
  vehicle_id: string | null
  vehicle_number: string | null
  event_type: EventType
  status: string
  created_at: string
}

export interface CreateAlertConfigRequest {
  geofence_id: string
  vehicle_id?: string
  event_type: EventType
}

export interface Violation {
  id: string
  vehicle_id: string
  vehicle_number: string
  geofence_id: string
  geofence_name: string
  event_type: 'entry' | 'exit'
  latitude: number
  longitude: number
  timestamp: string
}

export interface ViolationsResponse {
  count: number
  violations: Violation[]
}

export interface AlertMessage {
  event_id: string
  event_type: 'entry' | 'exit'
  timestamp: string
  vehicle: {
    id: string
    vehicle_number: string
    driver_name: string
  }
  geofence: {
    id: string
    name: string
    category: GeofenceCategory
  }
  location: {
    latitude: number
    longitude: number
  }
}
