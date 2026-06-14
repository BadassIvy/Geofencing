package models

import "time"

type Vehicle struct {
	ID            string     `db:"id"             json:"id"`
	VehicleNumber string     `db:"vehicle_number" json:"vehicle_number"`
	DriverName    string     `db:"driver_name"    json:"driver_name"`
	VehicleType   string     `db:"vehicle_type"   json:"vehicle_type"`
	Phone         string     `db:"phone"          json:"phone"`
	Status        string     `db:"status"         json:"status"`
	LastLat       *float64   `db:"last_lat"       json:"last_lat"`
	LastLng       *float64   `db:"last_lng"       json:"last_lng"`
	LastSeen      *time.Time `db:"last_seen"      json:"last_seen"`
	CreatedAt     time.Time  `db:"created_at"     json:"created_at"`
}

type CreateVehicleRequest struct {
	VehicleNumber string `json:"vehicle_number" binding:"required"`
	DriverName    string `json:"driver_name"    binding:"required"`
	VehicleType   string `json:"vehicle_type"   binding:"required,oneof=car truck motorcycle van"`
	Phone         string `json:"phone"`
}

type LocationUpdateRequest struct {
	VehicleID string  `json:"vehicle_id" binding:"required"`
	Latitude  float64 `json:"latitude"   binding:"required,min=-90,max=90"`
	Longitude float64 `json:"longitude"  binding:"required,min=-180,max=180"`
}

type GeofenceSummary struct {
	ID       string `db:"id"       json:"id"`
	Name     string `db:"name"     json:"name"`
	Category string `db:"category" json:"category"`
}

type VehicleListItem struct {
	ID            string    `db:"id"             json:"id"`
	VehicleNumber string    `db:"vehicle_number" json:"vehicle_number"`
	DriverName    string    `db:"driver_name"    json:"driver_name"`
	VehicleType   string    `db:"vehicle_type"   json:"vehicle_type"`
	Phone         string    `db:"phone"          json:"phone"`
	Status        string    `db:"status"         json:"status"`
	CreatedAt     time.Time `db:"created_at"     json:"created_at"`
}

type CurrentGeofenceStatus struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Status       string `json:"status"`
}

type CurrentLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Timestamp string  `json:"timestamp"`
}

type VehicleLocationGeofence struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category"`
}