package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"geofence-backend/db"
	"geofence-backend/middleware"
	"geofence-backend/models"
	"geofence-backend/ws"
)

func CreateVehicle() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		var req models.CreateVehicleRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		id := "veh_" + uuid.New().String()[:8]
		var vehicle models.Vehicle
		err := db.DB.QueryRowx(`
			INSERT INTO vehicles (id, vehicle_number, driver_name, vehicle_type, phone, status)
			VALUES ($1, $2, $3, $4, $5, 'active')
			RETURNING id, vehicle_number, status`,
			id, req.VehicleNumber, req.DriverName, req.VehicleType, req.Phone,
		).StructScan(&vehicle)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, middleware.TimedResponse(gin.H{
			"id":             vehicle.ID,
			"vehicle_number": vehicle.VehicleNumber,
			"status":         vehicle.Status,
		}, start))
	}
}

func ListVehicles() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		var vehicles []models.VehicleListItem
		err := db.DB.Select(&vehicles, `
			SELECT id, vehicle_number, driver_name, vehicle_type,
				COALESCE(phone,'') as phone, status, created_at
			FROM vehicles ORDER BY created_at DESC`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if vehicles == nil {
			vehicles = []models.VehicleListItem{}
		}

		c.JSON(http.StatusOK, middleware.TimedResponse(gin.H{"vehicles": vehicles}, start))
	}
}

func GetCurrentLocation() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		vehicleID := c.Param("vehicle_id")
		var vehicle models.Vehicle
		err := db.DB.QueryRowx(`
			SELECT id, vehicle_number, driver_name, vehicle_type,
				COALESCE(phone,'') as phone, status, last_lat, last_lng, last_seen, created_at
			FROM vehicles WHERE id=$1`, vehicleID,
		).StructScan(&vehicle)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var currentLocation *models.CurrentLocation
		var geoStatuses []models.VehicleLocationGeofence
		if vehicle.LastLat != nil && vehicle.LastLng != nil {
			ts := ""
			if vehicle.LastSeen != nil {
				ts = vehicle.LastSeen.Format(time.RFC3339)
			}
			currentLocation = &models.CurrentLocation{
				Latitude:  *vehicle.LastLat,
				Longitude: *vehicle.LastLng,
				Timestamp: ts,
			}
			summaries, err := getGeofencesContaining(*vehicle.LastLng, *vehicle.LastLat)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			geoStatuses = toLocationGeofences(summaries)
		}
		if geoStatuses == nil {
			geoStatuses = []models.VehicleLocationGeofence{}
		}

		c.JSON(http.StatusOK, middleware.TimedResponse(gin.H{
			"vehicle_id":        vehicle.ID,
			"vehicle_number":    vehicle.VehicleNumber,
			"current_location":  currentLocation,
			"current_geofences": geoStatuses,
		}, start))
	}
}

func UpdateLocation(hub *ws.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		var req models.LocationUpdateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var vehicle models.Vehicle
		err := db.DB.QueryRowx(`
			SELECT id, vehicle_number, driver_name, vehicle_type,
				COALESCE(phone,'') as phone, status, last_lat, last_lng, last_seen, created_at
			FROM vehicles WHERE id=$1`, req.VehicleID,
		).StructScan(&vehicle)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		currentGeofences, err := getGeofencesContaining(req.Longitude, req.Latitude)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var prevGeofences []models.GeofenceSummary
		var prevLat, prevLng float64
		err = db.DB.QueryRow(`
			SELECT latitude, longitude FROM location_updates
			WHERE vehicle_id=$1 ORDER BY recorded_at DESC LIMIT 1`, req.VehicleID,
		).Scan(&prevLat, &prevLng)
		if err == nil {
			prevGeofences, err = getGeofencesContaining(prevLng, prevLat)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		prevSet := make(map[string]models.GeofenceSummary)
		for _, g := range prevGeofences {
			prevSet[g.ID] = g
		}
		currSet := make(map[string]models.GeofenceSummary)
		for _, g := range currentGeofences {
			currSet[g.ID] = g
		}

		var entered, exited []models.GeofenceSummary
		for id, g := range currSet {
			if _, wasThere := prevSet[id]; !wasThere {
				entered = append(entered, g)
			}
		}
		for id, g := range prevSet {
			if _, stillThere := currSet[id]; !stillThere {
				exited = append(exited, g)
			}
		}

		processViolations(hub, &vehicle, entered, "entry", req.Latitude, req.Longitude)
		processViolations(hub, &vehicle, exited, "exit", req.Latitude, req.Longitude)

		_, err = db.DB.Exec(`
			UPDATE vehicles SET last_lat=$1, last_lng=$2, last_seen=NOW() WHERE id=$3`,
			req.Latitude, req.Longitude, req.VehicleID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		locID := "loc_" + uuid.New().String()[:8]
		_, err = db.DB.Exec(`
			INSERT INTO location_updates (id, vehicle_id, latitude, longitude)
			VALUES ($1, $2, $3, $4)`,
			locID, req.VehicleID, req.Latitude, req.Longitude,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		statuses := toCurrentStatus(currentGeofences)
		if statuses == nil {
			statuses = []models.CurrentGeofenceStatus{}
		}

		c.JSON(http.StatusOK, middleware.TimedResponse(gin.H{
			"vehicle_id":        req.VehicleID,
			"location_updated":  true,
			"current_geofences": statuses,
		}, start))
	}
}

func getGeofencesContaining(lng, lat float64) ([]models.GeofenceSummary, error) {
	var result []models.GeofenceSummary
	err := db.DB.Select(&result, `
		SELECT id, name, category FROM geofences
		WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))
		AND status = 'active'`,
		lng, lat,
	)
	return result, err
}

func toCurrentStatus(summaries []models.GeofenceSummary) []models.CurrentGeofenceStatus {
	out := make([]models.CurrentGeofenceStatus, len(summaries))
	for i, g := range summaries {
		out[i] = models.CurrentGeofenceStatus{
			GeofenceID:   g.ID,
			GeofenceName: g.Name,
			Status:       "inside",
		}
	}
	return out
}

func toLocationGeofences(summaries []models.GeofenceSummary) []models.VehicleLocationGeofence {
	out := make([]models.VehicleLocationGeofence, len(summaries))
	for i, g := range summaries {
		out[i] = models.VehicleLocationGeofence{
			GeofenceID:   g.ID,
			GeofenceName: g.Name,
			Category:     g.Category,
		}
	}
	return out
}

func processViolations(hub *ws.Hub, vehicle *models.Vehicle, geofences []models.GeofenceSummary, eventType string, lat, lng float64) {
	for _, geo := range geofences {
		vioID := "vio_" + uuid.New().String()[:8]
		_, err := db.DB.Exec(`
			INSERT INTO violations (id, vehicle_id, geofence_id, event_type, latitude, longitude)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			vioID, vehicle.ID, geo.ID, eventType, lat, lng,
		)
		if err != nil {
			continue
		}

		var configs []struct {
			ID string `db:"id"`
		}
		db.DB.Select(&configs, `
			SELECT id FROM alert_configs
			WHERE geofence_id=$1
			AND (vehicle_id=$2 OR vehicle_id IS NULL)
			AND (event_type=$3 OR event_type='both')
			AND status='active'`,
			geo.ID, vehicle.ID, eventType,
		)

		if len(configs) == 0 {
			continue
		}

		alert := ws.AlertMessage{
			EventID:   vioID,
			EventType: eventType,
			Timestamp: time.Now().Format(time.RFC3339),
			Vehicle: ws.VehicleInfo{
				ID:            vehicle.ID,
				VehicleNumber: vehicle.VehicleNumber,
				DriverName:    vehicle.DriverName,
			},
			Geofence: ws.GeofenceInfo{
				ID:       geo.ID,
				Name:     geo.Name,
				Category: geo.Category,
			},
			Location: ws.LocationInfo{Latitude: lat, Longitude: lng},
		}
		go func(a ws.AlertMessage) { hub.Broadcast(a) }(alert)
	}
}
