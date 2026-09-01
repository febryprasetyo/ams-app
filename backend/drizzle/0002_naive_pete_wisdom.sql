ALTER TABLE "accurate_databases" DROP CONSTRAINT "accurate_databases_server_id_servers_id_fk";
--> statement-breakpoint
ALTER TABLE "accurate_databases" ALTER COLUMN "file_path" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "hostname" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "servers" ALTER COLUMN "os" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD COLUMN "file_size_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD COLUMN "file_size_mb" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD COLUMN "file_size_formatted" varchar(50) DEFAULT '0 MB' NOT NULL;--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD COLUMN "status" varchar(30) DEFAULT 'Online' NOT NULL;--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD COLUMN "last_modified_at" timestamp;--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD COLUMN "file_created_at" timestamp;--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD COLUMN "reported_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "accurate_license_logs" ADD COLUMN "server_id" bigint;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "mac_address" varchar(32);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "license_server_url" varchar(255);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "agent_version" varchar(30);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "uptime_seconds" bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "accurate_status" varchar(30) DEFAULT 'UNKNOWN';--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "is_accurate_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "is_firebird_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "services" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "processes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "last_seen_at" timestamp;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "accurate_databases" ADD CONSTRAINT "accurate_databases_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accurate_license_logs" ADD CONSTRAINT "accurate_license_logs_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accurate_databases_server_path_unique" ON "accurate_databases" USING btree ("server_id","file_path");--> statement-breakpoint
CREATE UNIQUE INDEX "accurate_license_logs_server_key_unique" ON "accurate_license_logs" USING btree ("server_id","license_key");--> statement-breakpoint
DO $migration$
DECLARE
  duplicate_hostnames text;
BEGIN
  SELECT string_agg(hostname, ', ' ORDER BY hostname)
  INTO duplicate_hostnames
  FROM (
    SELECT hostname
    FROM servers
    WHERE hostname IS NOT NULL
    GROUP BY hostname
    HAVING count(*) > 1
  ) duplicates;

  IF duplicate_hostnames IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate server hostnames must be resolved before Accurate agent migration: %', duplicate_hostnames;
  END IF;
END
$migration$;--> statement-breakpoint
CREATE UNIQUE INDEX "servers_hostname_unique" ON "servers" USING btree ("hostname");
