ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
