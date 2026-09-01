DELETE FROM "accurate_license_logs" WHERE "server_id" IS NULL;--> statement-breakpoint
ALTER TABLE "accurate_license_logs" ALTER COLUMN "server_id" SET NOT NULL;