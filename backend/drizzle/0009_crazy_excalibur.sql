CREATE TABLE "hardware_audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hardware_audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
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
	"matched_asset_id" bigint,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hardware_audit_peripherals" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hardware_audit_peripherals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"audit_id" bigint NOT NULL,
	"category" varchar(100) NOT NULL,
	"preset_category" varchar(50),
	"custom_category" varchar(100),
	"brand_model" varchar(200) NOT NULL,
	"serial_number" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "permissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"module" varchar(50) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" bigint NOT NULL,
	"permission_id" bigint NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
ALTER TABLE "asset_assignment_history" DROP CONSTRAINT "asset_assignment_history_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "accurate_licenses" DROP CONSTRAINT "accurate_licenses_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "license_allocations" DROP CONSTRAINT "license_allocations_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "asset_maintenances" DROP CONSTRAINT "asset_maintenances_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "it_tickets" DROP CONSTRAINT "it_tickets_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "barcode" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "job_level" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "join_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_status" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "age" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "birth_place" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "citizen_id_address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "residential_address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "npwp" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "ptkp_status" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employee_tax_status" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_name" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_account" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_account_holder" varchar(150);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bpjs_ketenagakerjaan" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bpjs_kesehatan" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "nik_ktp" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "mobile_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "secondary_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "religion" varchar(30);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "marital_status" varchar(30);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "blood_type" varchar(10);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "nationality_code" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "currency" varchar(10) DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "length_of_service" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "npwp_16_digit" varchar(50);--> statement-breakpoint
ALTER TABLE "software_licenses" ADD COLUMN "location_id" bigint;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role_id" bigint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employee_id" bigint;--> statement-breakpoint
ALTER TABLE "hardware_audit_logs" ADD CONSTRAINT "hardware_audit_logs_matched_asset_id_assets_id_fk" FOREIGN KEY ("matched_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_audit_peripherals" ADD CONSTRAINT "hardware_audit_peripherals_audit_id_hardware_audit_logs_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."hardware_audit_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accurate_licenses" ADD CONSTRAINT "accurate_licenses_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_allocations" ADD CONSTRAINT "license_allocations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenances" ADD CONSTRAINT "asset_maintenances_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_tickets" ADD CONSTRAINT "it_tickets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;