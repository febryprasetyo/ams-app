CREATE TABLE IF NOT EXISTS "hardware_audit_logs" (
  "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "custodian_name" varchar(150) NOT NULL,
  "serial_number" varchar(100),
  "manufacturer" varchar(100),
  "model" varchar(150),
  "cpu_name" varchar(200),
  "ram_size_gb" integer,
  "ram_slot_count" integer,
  "disk_1_size_gb" integer,
  "disk_2_size_gb" integer,
  "raw_specs" text,
  "notes" text,
  "status" varchar(30) DEFAULT 'PENDING' NOT NULL,
  "matched_asset_id" bigint REFERENCES "assets"("id") ON DELETE SET NULL,
  "scanned_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
