package models

import "time"

type Geofence struct {
	ID              string    `db:"id"               json:"id"`
	Name            string    `db:"name"             json:"name"`
	Description     string    `db:"description"      json:"description"`
	Category        string    `db:"category"         json:"category"`
	BoundaryGeoJSON string    `db:"boundary_geojson" json:"boundary,omitempty"`
	Status          string    `db:"status"           json:"status"`
	CreatedAt       time.Time `db:"created_at"       json:"created_at"`
}

type CreateGeofenceRequest struct {
	Name        string      `json:"name"        binding:"required"`
	Description string      `json:"description"`
	Category    string      `json:"category"    binding:"required,oneof= delivery_zone restricted_zone toll_zone customer_area"`
	Coordinates [][]float64 `json:"coordinates" binding:"required"`
}

type UpdateGeofenceRequest struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Category    string      `json:"category"    binding:"omitempty,oneof=delivery_zone restricted_zone toll_zone customer_area"`
	Coordinates [][]float64 `json:"coordinates"`
}

type GeofenceListItem struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Coordinates [][]float64 `json:"coordinates"`
	Category    string      `json:"category"`
	CreatedAt   time.Time   `json:"created_at"`
}
