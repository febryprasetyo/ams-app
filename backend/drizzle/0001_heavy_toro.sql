CREATE TABLE "asset_assignment_history" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asset_assignment_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"asset_id" bigint NOT NULL,
	"employee_id" bigint,
	"assigned_by_user_id" bigint,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"returned_at" timestamp,
	"condition_on_assign" varchar(50) DEFAULT 'Good' NOT NULL,
	"condition_on_return" varchar(50),
	"handover_notes" text,
	"return_notes" text
);
--> statement-breakpoint
CREATE TABLE "accurate_license_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accurate_license_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"seat_no" integer,
	"license_key" varchar(100),
	"date" varchar(50),
	"ip_address" varchar(45),
	"version" varchar(50),
	"host" varchar(100),
	"status" varchar(30) DEFAULT 'ACTIVE',
	"scraped_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "db_backups" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "db_backups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"server_id" bigint,
	"db_name" varchar(100),
	"size_mb" numeric,
	"status" varchar(30) DEFAULT 'Success',
	"backup_path" varchar(255),
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "license_allocations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "license_allocations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"license_id" bigint,
	"employee_id" bigint,
	"asset_id" bigint,
	"allocated_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ticket_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ticket_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"comment_text" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" DROP CONSTRAINT "assets_asset_code_unique";--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_employee_code_unique";--> statement-breakpoint
ALTER TABLE "servers" DROP CONSTRAINT "servers_server_name_unique";--> statement-breakpoint
ALTER TABLE "servers" DROP CONSTRAINT "servers_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "it_tickets" DROP CONSTRAINT "it_tickets_reporter_id_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "ip_address" SET DATA TYPE varchar(45);--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "ip_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accurate_licenses" ALTER COLUMN "registered_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD COLUMN "code" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "asset_tag" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "brand" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "current_user_id" bigint;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employee_number" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "hostname" varchar(50);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "name" varchar(150);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "os" varchar(100);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "storage_spec" varchar(255);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "software_licenses" ADD COLUMN "license_name" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "software_licenses" ADD COLUMN "purchase_date" timestamp;--> statement-breakpoint
ALTER TABLE "software_licenses" ADD COLUMN "expiry_date" timestamp;--> statement-breakpoint
ALTER TABLE "software_licenses" ADD COLUMN "purchase_price" numeric;--> statement-breakpoint
ALTER TABLE "software_licenses" ADD COLUMN "status" varchar(30) DEFAULT 'Active' NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "code" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "it_tickets" ADD COLUMN "type" varchar(20) DEFAULT 'Incident' NOT NULL;--> statement-breakpoint
ALTER TABLE "it_tickets" ADD COLUMN "resolution_notes" text;--> statement-breakpoint
ALTER TABLE "ticket_categories" ADD COLUMN "code" varchar(20);--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'SuperAdmin' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" varchar(30) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_backups" ADD CONSTRAINT "db_backups_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_allocations" ADD CONSTRAINT "license_allocations_license_id_software_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."software_licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_allocations" ADD CONSTRAINT "license_allocations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_allocations" ADD CONSTRAINT "license_allocations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_it_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."it_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_current_user_id_employees_id_fk" FOREIGN KEY ("current_user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_categories" DROP COLUMN "code_prefix";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "asset_code";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "employee_code";--> statement-breakpoint
ALTER TABLE "servers" DROP COLUMN "server_name";--> statement-breakpoint
ALTER TABLE "servers" DROP COLUMN "os_version";--> statement-breakpoint
ALTER TABLE "servers" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "software_licenses" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "software_licenses" DROP COLUMN "expires_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_tag_unique" UNIQUE("asset_tag");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_number_unique" UNIQUE("employee_number");--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");