package models

import "time"

type Violation struct {
	ID         string    `db:"id"          json:"id"`
	VehicleID  string    `db:"vehicle_id"  json:"vehicle_id"`
	GeofenceID string    `db:"geofence_id" json:"geofence_id"`
	EventType  string    `db:"event_type"  json:"event_type"`
	Latitude   float64   `db:"latitude"    json:"latitude"`
	Longitude  float64   `db:"longitude"   json:"longitude"`
	OccurredAt time.Time `db:"occurred_at" json:"occurred_at"`
	CreatedAt  time.Time `db:"created_at"  json:"created_at"`
}

type ViolationListItem struct {
	ID            string    `db:"id"             json:"id"`
	VehicleID     string    `db:"vehicle_id"     json:"vehicle_id"`
	VehicleNumber string    `db:"vehicle_number" json:"vehicle_number"`
	GeofenceID    string    `db:"geofence_id"    json:"geofence_id"`
	GeofenceName  string    `db:"geofence_name"  json:"geofence_name"`
	EventType     string    `db:"event_type"     json:"event_type"`
	Latitude      float64   `db:"latitude"       json:"latitude"`
	Longitude     float64   `db:"longitude"      json:"longitude"`
	Timestamp     time.Time `db:"occurred_at"    json:"timestamp"`
}