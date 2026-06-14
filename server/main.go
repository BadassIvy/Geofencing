package main

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"geofence-backend/db"
	"geofence-backend/handlers"
	"geofence-backend/ws"
)

func main() {
	if err := godotenv.Load(".env.local"); err != nil {
		log.Println("No .env.local found, falling back to environment variables")
	}

	dbUrl := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/geofence_db?sslmode=disable")
	port := getEnv("PORT", "8080")
	corsConfig := cors.Config{
		AllowOrigins:     strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if err := db.Connect(dbUrl); err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}

	hub := ws.NewHub()
	go hub.Run()

	r := gin.Default()
	r.Use(cors.New(corsConfig))

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Api is running"})
	})

	r.GET("/ws", hub.ServeWS)

	r.POST("/geofences", handlers.CreateGeofence(hub))
	r.GET("/geofences", handlers.ListGeofences())
	r.PUT("/geofences/:id", handlers.UpdateGeofence())
	r.DELETE("/geofences/:id", handlers.DeleteGeofence())

	r.POST("/vehicles", handlers.CreateVehicle())
	r.GET("/vehicles", handlers.ListVehicles())
	r.POST("/vehicles/location", handlers.UpdateLocation(hub))
	r.GET("/vehicles/location/:vehicle_id", handlers.GetCurrentLocation())

	r.POST("/alerts/configure", handlers.ConfigureAlert())
	r.GET("/alerts", handlers.ListAlerts())

	r.GET("/violations/history", handlers.GetViolationHistory())

	log.Printf("Server starting on :%s", port)
	r.Run(":" + port)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
