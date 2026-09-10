ALTER TABLE "asset_assignment_history" DROP CONSTRAINT IF EXISTS "asset_assignment_history_asset_id_assets_id_fk";--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "asset_maintenances" DROP CONSTRAINT IF EXISTS "asset_maintenances_asset_id_assets_id_fk";--> statement-breakpoint
ALTER TABLE "asset_maintenances" ADD CONSTRAINT "asset_maintenances_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "it_tickets" DROP CONSTRAINT IF EXISTS "it_tickets_asset_id_assets_id_fk";--> statement-breakpoint
ALTER TABLE "it_tickets" ADD CONSTRAINT "it_tickets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "license_allocations" DROP CONSTRAINT IF EXISTS "license_allocations_asset_id_assets_id_fk";--> statement-breakpoint
ALTER TABLE "license_allocations" ADD CONSTRAINT "license_allocations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "accurate_licenses" DROP CONSTRAINT IF EXISTS "accurate_licenses_asset_id_assets_id_fk";--> statement-breakpoint
ALTER TABLE "accurate_licenses" ADD CONSTRAINT "accurate_licenses_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL;
