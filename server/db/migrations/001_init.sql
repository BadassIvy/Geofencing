CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS geofences (
    id          VARCHAR(20)  PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    category    VARCHAR(50)  NOT NULL CHECK (category IN ('delivery_zone','restricted_zone','toll_zone','customer_area')),
    boundary    GEOMETRY(POLYGON, 4326) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_geofences_boundary ON geofences USING GIST (boundary);

CREATE TABLE IF NOT EXISTS vehicles (
    id             VARCHAR(20)      PRIMARY KEY,
    vehicle_number VARCHAR(50)      NOT NULL UNIQUE,
    driver_name    VARCHAR(255)     NOT NULL,
    vehicle_type   VARCHAR(50)      NOT NULL CHECK (vehicle_type IN ('car','truck','motorcycle','van')),
    phone          VARCHAR(20),
    status         VARCHAR(20)      NOT NULL DEFAULT 'active',
    last_lat       DOUBLE PRECISION,
    last_lng       DOUBLE PRECISION,
    last_seen      TIMESTAMPTZ,
    created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_updates (
    id          VARCHAR(20)      PRIMARY KEY,
    vehicle_id  VARCHAR(20)      NOT NULL REFERENCES vehicles(id),
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_location_updates_vehicle ON location_updates(vehicle_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS alert_configs (
    id          VARCHAR(20) PRIMARY KEY,
    geofence_id VARCHAR(20) NOT NULL REFERENCES geofences(id),
    vehicle_id  VARCHAR(20) REFERENCES vehicles(id),
    event_type  VARCHAR(10) NOT NULL CHECK (event_type IN ('entry','exit','both')),
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violations (
    id          VARCHAR(20)      PRIMARY KEY,
    vehicle_id  VARCHAR(20)      NOT NULL REFERENCES vehicles(id),
    geofence_id VARCHAR(20)      NOT NULL REFERENCES geofences(id),
    event_type  VARCHAR(10)      NOT NULL CHECK (event_type IN ('entry','exit')),
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    occurred_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle  ON violations(vehicle_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_geofence ON violations(geofence_id, occurred_at DESC);
