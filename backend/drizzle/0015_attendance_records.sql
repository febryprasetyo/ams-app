CREATE TABLE IF NOT EXISTS "attendance_batches" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "filename" varchar(255) NOT NULL,
  "source_id" integer DEFAULT 1 NOT NULL,
  "file_hash" varchar(64),
  "status" varchar(20) DEFAULT 'COMMITTED' NOT NULL,
  "total_rows" integer DEFAULT 0 NOT NULL,
  "valid_rows" integer DEFAULT 0 NOT NULL,
  "skipped_rows" integer DEFAULT 0 NOT NULL,
  "created_by_id" bigint REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "committed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "employee_id" bigint NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "work_date" varchar(10) NOT NULL,
  "shift" varchar(100),
  "schedule_in" varchar(10),
  "schedule_out" varchar(10),
  "scan_in" varchar(10),
  "scan_out" varchar(10),
  "raw_scan_in" varchar(10),
  "raw_scan_out" varchar(10),
  "late_minutes" integer DEFAULT 0 NOT NULL,
  "early_minutes" integer DEFAULT 0 NOT NULL,
  "overtime_minutes" integer DEFAULT 0 NOT NULL,
  "attendance_status" varchar(20) DEFAULT 'PRESENT' NOT NULL,
  "is_day_off" boolean DEFAULT false NOT NULL,
  "normalized" boolean DEFAULT false NOT NULL,
  "revision" integer DEFAULT 1 NOT NULL,
  "source_batch_id" bigint REFERENCES "attendance_batches"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_employee_date" ON "attendance_records" ("employee_id", "work_date");
CREATE INDEX IF NOT EXISTS "idx_attendance_records_date" ON "attendance_records" ("work_date");
CREATE INDEX IF NOT EXISTS "idx_attendance_records_emp" ON "attendance_records" ("employee_id");
