CREATE TABLE IF NOT EXISTS "hardware_audit_peripherals" (
  "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "audit_id" bigint NOT NULL REFERENCES "hardware_audit_logs"("id") ON DELETE CASCADE,
  "category" varchar(100) NOT NULL,
  "preset_category" varchar(50),
  "custom_category" varchar(100),
  "brand_model" varchar(200) NOT NULL,
  "serial_number" varchar(100),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_hardware_audit_peripherals_audit_id" ON "hardware_audit_peripherals"("audit_id");
