package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"geofence-backend/db"
	"geofence-backend/middleware"
	"geofence-backend/models"
	"geofence-backend/ws"
)

func CreateGeofence(hub *ws.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		var req models.CreateGeofenceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := validatePolygon(req.Coordinates); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		wkt := buildWKT(req.Coordinates)
		id := "geo_" + uuid.New().String()[:8]

		var geo models.Geofence
		err := db.DB.QueryRowx(`
			INSERT INTO geofences (id, name, description, category, boundary, status)
			VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326), 'active')
			RETURNING id, name, COALESCE(description,'') as description, category, status, created_at`,
			id, req.Name, req.Description, req.Category, wkt,
		).StructScan(&geo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, middleware.TimedResponse(gin.H{
			"id":     geo.ID,
			"name":   geo.Name,
			"status": geo.Status,
		}, start))
	}
}

func ListGeofences() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		query := `SELECT id, name, COALESCE(description,'') as description, category,
			ST_AsGeoJSON(boundary) as boundary_geojson, created_at
			FROM geofences WHERE 1=1`
		args := []any{}

		if cat := c.Query("category"); cat != "" {
			query += " AND category = $1"
			args = append(args, cat)
		}
		query += " ORDER BY created_at DESC"

		var rows []models.Geofence
		if err := db.DB.Select(&rows, query, args...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		items := make([]models.GeofenceListItem, len(rows))
		for i, g := range rows {
			coords, err := parseGeoJSONCoords(g.BoundaryGeoJSON)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse boundary"})
				return
			}
			items[i] = models.GeofenceListItem{
				ID:          g.ID,
				Name:        g.Name,
				Description: g.Description,
				Coordinates: coords,
				Category:    g.Category,
				CreatedAt:   g.CreatedAt,
			}
		}

		c.JSON(http.StatusOK, middleware.TimedResponse(gin.H{"geofences": items}, start))
	}
}

func DeleteGeofence() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		tx, err := db.DB.Beginx()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer tx.Rollback()

		tx.Exec(`DELETE FROM violations   WHERE geofence_id = $1`, id)
		tx.Exec(`DELETE FROM alert_configs WHERE geofence_id = $1`, id)

		result, err := tx.Exec(`DELETE FROM geofences WHERE id = $1`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		rows, _ := result.RowsAffected()
		if rows == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "geofence not found"})
			return
		}
		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}

func UpdateGeofence() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		id := c.Param("id")

		var req models.UpdateGeofenceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		setClauses := []string{}
		args := []any{id}
		argIdx := 2

		if req.Name != "" {
			setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
			args = append(args, req.Name)
			argIdx++
		}
		if req.Description != "" {
			setClauses = append(setClauses, fmt.Sprintf("description = $%d", argIdx))
			args = append(args, req.Description)
			argIdx++
		}
		if req.Category != "" {
			setClauses = append(setClauses, fmt.Sprintf("category = $%d", argIdx))
			args = append(args, req.Category)
			argIdx++
		}
		if len(req.Coordinates) >= 4 {
			if err := validatePolygon(req.Coordinates); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			setClauses = append(setClauses, fmt.Sprintf("boundary = ST_GeomFromText($%d, 4326)", argIdx))
			args = append(args, buildWKT(req.Coordinates))
			argIdx++
		}

		if len(setClauses) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
			return
		}

		query := fmt.Sprintf(
			`UPDATE geofences SET %s WHERE id = $1 RETURNING id, name, COALESCE(description,'') as description, category, status, created_at`,
			strings.Join(setClauses, ", "),
		)

		var geo models.Geofence
		if err := db.DB.QueryRowx(query, args...).StructScan(&geo); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "geofence not found"})
			return
		}

		c.JSON(http.StatusOK, middleware.TimedResponse(gin.H{
			"id":     geo.ID,
			"name":   geo.Name,
			"status": geo.Status,
		}, start))
	}
}

// parseGeoJSONCoords extracts the outer ring from a PostGIS ST_AsGeoJSON result
// and converts [lng, lat] → [lat, lng] to match the API's coordinate convention.
func parseGeoJSONCoords(geoJSON string) ([][]float64, error) {
	var geom struct {
		Coordinates [][][]float64 `json:"coordinates"`
	}
	if err := json.Unmarshal([]byte(geoJSON), &geom); err != nil {
		return nil, err
	}
	if len(geom.Coordinates) == 0 {
		return [][]float64{}, nil
	}
	ring := geom.Coordinates[0]
	coords := make([][]float64, len(ring))
	for i, pt := range ring {
		coords[i] = []float64{pt[1], pt[0]} // PostGIS: [lng,lat] → API: [lat,lng]
	}
	return coords, nil
}

func validatePolygon(coords [][]float64) error {
	if len(coords) < 4 {
		return fmt.Errorf("polygon must have at least 4 coordinates")
	}
	first := coords[0]
	last := coords[len(coords)-1]
	if len(first) != 2 || len(last) != 2 {
		return fmt.Errorf("each coordinate must contain [latitude, longitude]")
	}
	if first[0] != last[0] || first[1] != last[1] {
		return fmt.Errorf("polygon must be closed (first coordinate must equal last)")
	}
	for _, pt := range coords {
		if len(pt) != 2 {
			return fmt.Errorf("each coordinate must contain [latitude, longitude]")
		}
		lat, lng := pt[0], pt[1]
		if lng < -180 || lng > 180 {
			return fmt.Errorf("longitude %v out of range [-180, 180]", lng)
		}
		if lat < -90 || lat > 90 {
			return fmt.Errorf("latitude %v out of range [-90, 90]", lat)
		}
	}
	return nil
}

// buildWKT builds a PostGIS WKT polygon from [lat, lng] input coordinates.
// PostGIS WKT requires (lng lat) order, so pt[0] and pt[1] are swapped.
func buildWKT(coords [][]float64) string {
	parts := make([]string, len(coords))
	for i, pt := range coords {
		parts[i] = fmt.Sprintf("%.8f %.8f", pt[1], pt[0]) // pt[0]=lat, pt[1]=lng → WKT: lng lat
	}
	return "POLYGON((" + strings.Join(parts, ", ") + "))"
}
