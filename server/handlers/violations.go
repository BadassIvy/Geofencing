package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"geofence-backend/db"
	"geofence-backend/middleware"
	"geofence-backend/models"
)

func GetViolationHistory() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		limit := 50
		offset := 0
		if l := c.Query("limit"); l != "" {
			if v, err := strconv.Atoi(l); err == nil && v > 0 {
				if v > 500 {
					v = 500
				}
				limit = v
			}
		}
		if o := c.Query("offset"); o != "" {
			if v, err := strconv.Atoi(o); err == nil && v >= 0 {
				offset = v
			}
		}

		conditions := []string{"1=1"}
		args := []any{}
		argIdx := 1

		if vehID := c.Query("vehicle_id"); vehID != "" {
			conditions = append(conditions, fmt.Sprintf("vi.vehicle_id = $%d", argIdx))
			args = append(args, vehID)
			argIdx++
		}
		if geoID := c.Query("geofence_id"); geoID != "" {
			conditions = append(conditions, fmt.Sprintf("vi.geofence_id = $%d", argIdx))
			args = append(args, geoID)
			argIdx++
		}
		if sd := c.Query("start_date"); sd != "" {
			t, err := time.Parse(time.RFC3339, sd)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date, use RFC3339"})
				return
			}
			conditions = append(conditions, fmt.Sprintf("vi.occurred_at >= $%d", argIdx))
			args = append(args, t)
			argIdx++
		}
		if ed := c.Query("end_date"); ed != "" {
			t, err := time.Parse(time.RFC3339, ed)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date, use RFC3339"})
				return
			}
			conditions = append(conditions, fmt.Sprintf("vi.occurred_at <= $%d", argIdx))
			args = append(args, t)
			argIdx++
		}

		where := strings.Join(conditions, " AND ")

		var total int
		countQuery := `SELECT COUNT(*) FROM violations vi JOIN vehicles v ON v.id = vi.vehicle_id JOIN geofences g ON g.id = vi.geofence_id WHERE ` + where
		if err := db.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		query := fmt.Sprintf(`
			SELECT vi.id, vi.vehicle_id, v.vehicle_number, vi.geofence_id,
				g.name as geofence_name, vi.event_type, vi.latitude, vi.longitude, vi.occurred_at
			FROM violations vi
			JOIN vehicles v ON v.id = vi.vehicle_id
			JOIN geofences g ON g.id = vi.geofence_id
			WHERE %s ORDER BY vi.occurred_at DESC LIMIT $%d OFFSET $%d`,
			where, argIdx, argIdx+1,
		)
		args = append(args, limit, offset)

		var violations []models.ViolationListItem
		if err := db.DB.Select(&violations, query, args...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if violations == nil {
			violations = []models.ViolationListItem{}
		}

		c.JSON(http.StatusOK, middleware.TimedResponse(gin.H{
			"violations":  violations,
			"total_count": total,
		}, start))
	}
}
