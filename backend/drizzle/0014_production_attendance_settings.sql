CREATE TABLE "attendance_batches" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_batches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"filename" varchar(255) NOT NULL,
	"source_id" integer DEFAULT 1 NOT NULL,
	"file_hash" varchar(64),
	"status" varchar(20) DEFAULT 'COMMITTED' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"created_by_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"committed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"employee_id" bigint NOT NULL,
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
	"source_batch_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_batches" ADD CONSTRAINT "attendance_batches_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_source_batch_id_attendance_batches_id_fk" FOREIGN KEY ("source_batch_id") REFERENCES "public"."attendance_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_employee_date" ON "attendance_records" USING btree ("employee_id","work_date");