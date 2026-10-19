CREATE TABLE "attendance_grants" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_grants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"principal_key" varchar(150) NOT NULL,
	"display_name" varchar(150) NOT NULL,
	"role" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_grants_principal_key_unique" UNIQUE("principal_key")
);
--> statement-breakpoint
CREATE TABLE "attendance_identities" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_identities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source_id" bigint,
	"external_no_id" varchar(100) NOT NULL,
	"employee_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_import_rows" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_import_rows_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"batch_id" bigint NOT NULL,
	"row_number" integer NOT NULL,
	"external_no_id" varchar(100) NOT NULL,
	"employee_id" bigint,
	"work_date" varchar(10) NOT NULL,
	"scan_in" varchar(10),
	"scan_out" varchar(10),
	"raw_scan_in" varchar(10),
	"raw_scan_out" varchar(10),
	"late_minutes" integer DEFAULT 0 NOT NULL,
	"early_minutes" integer DEFAULT 0 NOT NULL,
	"overtime_minutes" integer DEFAULT 0 NOT NULL,
	"review_status" varchar(20) DEFAULT 'NEEDS_REVIEW' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"attendance_status" varchar(20),
	"normalized" boolean DEFAULT false NOT NULL,
	"issues" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_locks" (
	"work_date" varchar(10) PRIMARY KEY NOT NULL,
	"reason" varchar(255) NOT NULL,
	"actor_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_revisions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_revisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"record_id" bigint NOT NULL,
	"reason" varchar(255) NOT NULL,
	"actor" varchar(150) NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_shift_assignments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_shift_assignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"shift_id" bigint NOT NULL,
	"department_id" bigint,
	"employee_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_shifts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_shifts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"schedule_in" varchar(10) NOT NULL,
	"schedule_out" varchar(10) NOT NULL,
	"work_days" integer DEFAULT 5 NOT NULL,
	"saturday_schedule_in" varchar(10),
	"saturday_schedule_out" varchar(10),
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_shifts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "attendance_sources" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "annual_leave_configs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "annual_leave_configs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"year" integer NOT NULL,
	"base_quota" integer DEFAULT 12 NOT NULL,
	"collective_leave_days" integer DEFAULT 0 NOT NULL,
	"allow_carry_forward" boolean DEFAULT false NOT NULL,
	"max_carry_forward_days" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "annual_leave_configs_year_unique" UNIQUE("year")
);
--> statement-breakpoint
ALTER TABLE "attendance_batches" ALTER COLUMN "committed_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attendance_batches" ALTER COLUMN "committed_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_batches" ADD COLUMN "strict_integrity" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_batches" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD COLUMN "is_custom_quota" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD COLUMN "is_custom_carry_forward" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_identities" ADD CONSTRAINT "attendance_identities_source_id_attendance_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."attendance_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_identities" ADD CONSTRAINT "attendance_identities_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_import_rows" ADD CONSTRAINT "attendance_import_rows_batch_id_attendance_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."attendance_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_import_rows" ADD CONSTRAINT "attendance_import_rows_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_locks" ADD CONSTRAINT "attendance_locks_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_shift_assignments" ADD CONSTRAINT "attendance_shift_assignments_shift_id_attendance_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."attendance_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_shift_assignments" ADD CONSTRAINT "attendance_shift_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_shift_assignments" ADD CONSTRAINT "attendance_shift_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_identities_source_external" ON "attendance_identities" USING btree ("source_id","external_no_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_import_rows_batch_row" ON "attendance_import_rows" USING btree ("batch_id","row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_shift_assignment_employee" ON "attendance_shift_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_shift_assignment_department" ON "attendance_shift_assignments" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_balances_employee_year_unique" ON "leave_balances" USING btree ("employee_id","year");