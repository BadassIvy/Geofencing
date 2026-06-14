package models

import "time"

type AlertConfig struct {
	ID         string    `db:"id"          json:"id"`
	GeofenceID string    `db:"geofence_id" json:"geofence_id"`
	VehicleID  *string   `db:"vehicle_id"  json:"vehicle_id"`
	EventType  string    `db:"event_type"  json:"event_type"`
	Status     string    `db:"status"      json:"status"`
	CreatedAt  time.Time `db:"created_at"  json:"created_at"`
}

type CreateAlertConfigRequest struct {
	GeofenceID string  `json:"geofence_id" binding:"required"`
	VehicleID  *string `json:"vehicle_id"`
	EventType  string  `json:"event_type"  binding:"required,oneof=entry exit both"`
}

type AlertListItem struct {
	AlertID       string    `db:"id"             json:"alert_id"`
	GeofenceID    string    `db:"geofence_id"    json:"geofence_id"`
	GeofenceName  string    `db:"geofence_name"  json:"geofence_name"`
	VehicleID     *string   `db:"vehicle_id"     json:"vehicle_id"`
	VehicleNumber *string   `db:"vehicle_number" json:"vehicle_number"`
	EventType     string    `db:"event_type"     json:"event_type"`
	Status        string    `db:"status"         json:"status"`
	CreatedAt     time.Time `db:"created_at"     json:"created_at"`
}
