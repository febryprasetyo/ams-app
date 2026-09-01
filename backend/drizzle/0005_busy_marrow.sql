CREATE TABLE "asset_accessories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asset_accessories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"asset_id" bigint NOT NULL,
	"accessory_type" varchar(50) NOT NULL,
	"description" varchar(150),
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition" varchar(30) DEFAULT 'Good' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_accessories_quantity_positive" CHECK ("asset_accessories"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "asset_computer_specs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asset_computer_specs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"asset_id" bigint NOT NULL,
	"cpu_name" varchar(200) NOT NULL,
	"ram_size_gb" integer NOT NULL,
	"ram_slot_count" integer NOT NULL,
	"disk_1_size_gb" integer NOT NULL,
	"disk_2_size_gb" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_computer_specs_asset_id_unique" UNIQUE("asset_id"),
	CONSTRAINT "asset_computer_specs_ram_size_positive" CHECK ("asset_computer_specs"."ram_size_gb" > 0),
	CONSTRAINT "asset_computer_specs_ram_slots_positive" CHECK ("asset_computer_specs"."ram_slot_count" > 0),
	CONSTRAINT "asset_computer_specs_disk_1_positive" CHECK ("asset_computer_specs"."disk_1_size_gb" > 0),
	CONSTRAINT "asset_computer_specs_disk_2_positive" CHECK ("asset_computer_specs"."disk_2_size_gb" IS NULL OR "asset_computer_specs"."disk_2_size_gb" > 0)
);
--> statement-breakpoint
ALTER TABLE "asset_accessories" ADD CONSTRAINT "asset_accessories_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_computer_specs" ADD CONSTRAINT "asset_computer_specs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;