ALTER TABLE geofences DROP CONSTRAINT IF EXISTS geofences_category_check;
ALTER TABLE geofences ADD CONSTRAINT geofences_category_check
    CHECK (category IN ('delivery_zone','restricted_zone','toll_zone','customer_area'));