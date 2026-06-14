package db

import (
	"embed"
	"fmt"
	"log"
	"strings"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

var DB *sqlx.DB

func Connect(dsn string) error {
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return err
	}
	DB = db
	return runMigrations(db)
}

func runMigrations(db *sqlx.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename   VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	entries, err := migrationFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		name := entry.Name()

		var count int
		if err := db.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE filename=$1`, name).Scan(&count); err != nil {
			return fmt.Errorf("check migration %s: %w", name, err)
		}
		if count > 0 {
			log.Printf("migration %s already applied, skipping", name)
			continue
		}

		sql, err := migrationFS.ReadFile("migrations/" + name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		if _, err := db.Exec(string(sql)); err != nil {
			return fmt.Errorf("run migration %s: %w", name, err)
		}
		if _, err := db.Exec(`INSERT INTO schema_migrations (filename) VALUES ($1)`, name); err != nil {
			return fmt.Errorf("record migration %s: %w", name, err)
		}
		log.Printf("applied migration %s", name)
	}
	return nil
}
