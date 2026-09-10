ALTER TABLE "asset_computer_specs" ALTER COLUMN "cpu_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_computer_specs" ALTER COLUMN "ram_size_gb" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_computer_specs" ALTER COLUMN "ram_slot_count" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_computer_specs" ALTER COLUMN "disk_1_size_gb" DROP NOT NULL;