package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"geofence-backend/db"
	"geofence-backend/middleware"
	"geofence-backend/models"
)

func ConfigureAlert() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		var req models.CreateAlertConfigRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var exists bool
		if err := db.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM geofences WHERE id=$1)`, req.GeofenceID).Scan(&exists); err != nil || !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "geofence not found"})
			return
		}

		if req.VehicleID != nil {
			if err := db.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM vehicles WHERE id=$1)`, *req.VehicleID).Scan(&exists); err != nil || !exists {
				c.JSON(http.StatusBadRequest, gin.H{"error": "vehicle not found"})
				return
			}
		}

		id := "alr_" + uuid.New().String()[:8]
		var cfg models.AlertConfig
		err := db.DB.QueryRowx(`
			INSERT INTO alert_configs (id, geofence_id, vehicle_id, event_type, status)
			VALUES ($1, $2, $3, $4, 'active')
			RETURNING id, geofence_id, vehicle_id, event_type, status, created_at`,
			id, req.GeofenceID, req.VehicleID, req.EventType,
		).StructScan(&cfg)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, middleware.TimedResponse(gin.H{
			"alert_id":   cfg.ID,
			"geofence_id": cfg.GeofenceID,
			"vehicle_id": cfg.VehicleID,
			"event_type": cfg.EventType,
			"status":     cfg.Status,
		}, start))
	}
}

func ListAlerts() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		conditions := []string{"ac.status = 'active'"}
		args := []any{}
		argIdx := 1

		if geoID := c.Query("geofence_id"); geoID != "" {
			conditions = append(conditions, fmt.Sprintf("ac.geofence_id = $%d", argIdx))
			args = append(args, geoID)
			argIdx++
		}
		if vehID := c.Query("vehicle_id"); vehID != "" {
			conditions = append(conditions, fmt.Sprintf("ac.vehicle_id = $%d", argIdx))
			args = append(args, vehID)
			argIdx++
		}

		query := `
			SELECT ac.id, ac.geofence_id, g.name as geofence_name,
				ac.vehicle_id, v.vehicle_number, ac.event_type, ac.status, ac.created_at
			FROM alert_configs ac
			JOIN geofences g ON g.id = ac.geofence_id
			LEFT JOIN vehicles v ON v.id = ac.vehicle_id
			WHERE ` + strings.Join(conditions, " AND ") + ` ORDER BY ac.created_at DESC`

		log.Printf("[ListAlerts] query: %s | args: %v", query, args)

		var alerts []models.AlertListItem
		if err := db.DB.Select(&alerts, query, args...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if alerts == nil {
			alerts = []models.AlertListItem{}
		}

		c.JSON(http.StatusOK, middleware.TimedResponse(gin.H{"alerts": alerts}, start))
	}
}
