CREATE TABLE "asset_custodians" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asset_custodians_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"display_name" varchar(150) NOT NULL,
	"normalized_name" varchar(150) NOT NULL,
	"origin" varchar(20) DEFAULT 'MANUAL' NOT NULL,
	"verification_status" varchar(20) DEFAULT 'UNVERIFIED' NOT NULL,
	"employee_id" bigint,
	"location_id" bigint,
	"unit_text" varchar(150),
	"notes" text,
	"record_status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"merged_into_custodian_id" bigint,
	"created_by_user_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_custodians_origin_check" CHECK ("asset_custodians"."origin" IN ('MANUAL', 'HRD')),
	CONSTRAINT "asset_custodians_verification_check" CHECK (("asset_custodians"."verification_status" = 'UNVERIFIED' AND "asset_custodians"."employee_id" IS NULL) OR ("asset_custodians"."verification_status" = 'VERIFIED' AND "asset_custodians"."employee_id" IS NOT NULL)),
	CONSTRAINT "asset_custodians_status_check" CHECK ("asset_custodians"."record_status" IN ('ACTIVE', 'INACTIVE', 'MERGED')),
	CONSTRAINT "asset_custodians_merge_check" CHECK (("asset_custodians"."record_status" = 'MERGED' AND "asset_custodians"."merged_into_custodian_id" IS NOT NULL AND "asset_custodians"."merged_into_custodian_id" <> "asset_custodians"."id") OR ("asset_custodians"."record_status" <> 'MERGED' AND "asset_custodians"."merged_into_custodian_id" IS NULL)),
	CONSTRAINT "asset_custodians_name_check" CHECK (length(trim("asset_custodians"."display_name")) > 0 AND length(trim("asset_custodians"."normalized_name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD COLUMN "custodian_id" bigint;--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD COLUMN "custodian_name_snapshot" varchar(150);--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD COLUMN "location_name_snapshot" varchar(100);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "current_custodian_id" bigint;--> statement-breakpoint
ALTER TABLE "asset_custodians" ADD CONSTRAINT "asset_custodians_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_custodians" ADD CONSTRAINT "asset_custodians_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_custodians" ADD CONSTRAINT "asset_custodians_merged_into_custodian_id_asset_custodians_id_fk" FOREIGN KEY ("merged_into_custodian_id") REFERENCES "public"."asset_custodians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_custodians" ADD CONSTRAINT "asset_custodians_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_custodians_active_employee_unique" ON "asset_custodians" USING btree ("employee_id") WHERE "asset_custodians"."employee_id" IS NOT NULL AND "asset_custodians"."record_status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "asset_custodians_normalized_name_idx" ON "asset_custodians" USING btree ("normalized_name");--> statement-breakpoint
ALTER TABLE "asset_assignment_history" ADD CONSTRAINT "asset_assignment_history_custodian_id_asset_custodians_id_fk" FOREIGN KEY ("custodian_id") REFERENCES "public"."asset_custodians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_current_custodian_id_asset_custodians_id_fk" FOREIGN KEY ("current_custodian_id") REFERENCES "public"."asset_custodians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Referenced employees only: the holder directory does not copy all HR.
DO $$
DECLARE expected_people bigint; actual_people bigint; expected_assets bigint; actual_assets bigint; expected_history bigint; actual_history bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM assets a LEFT JOIN employees e ON e.id = a.current_user_id WHERE a.current_user_id IS NOT NULL AND e.id IS NULL)
    OR EXISTS (SELECT 1 FROM asset_assignment_history h LEFT JOIN employees e ON e.id = h.employee_id WHERE h.employee_id IS NOT NULL AND e.id IS NULL) THEN
    RAISE EXCEPTION 'Custodian backfill aborted: unresolved legacy employee references';
  END IF;
  SELECT count(*) INTO expected_people FROM (SELECT current_user_id FROM assets WHERE current_user_id IS NOT NULL UNION SELECT employee_id FROM asset_assignment_history WHERE employee_id IS NOT NULL) refs;
  SELECT count(*) INTO expected_assets FROM assets WHERE current_user_id IS NOT NULL;
  SELECT count(*) INTO expected_history FROM asset_assignment_history WHERE employee_id IS NOT NULL;
  INSERT INTO asset_custodians (display_name, normalized_name, origin, verification_status, employee_id, location_id, unit_text)
    SELECT trim(regexp_replace(e.full_name, '[[:space:]]+', ' ', 'g')), lower(trim(regexp_replace(e.full_name, '[[:space:]]+', ' ', 'g'))), 'HRD', 'VERIFIED', e.id, e.location_id, d.name
    FROM employees e LEFT JOIN departments d ON d.id = e.department_id
    WHERE e.id IN (SELECT current_user_id FROM assets WHERE current_user_id IS NOT NULL UNION SELECT employee_id FROM asset_assignment_history WHERE employee_id IS NOT NULL);
  GET DIAGNOSTICS actual_people = ROW_COUNT;
  UPDATE assets a SET current_custodian_id = c.id FROM asset_custodians c WHERE c.employee_id = a.current_user_id;
  GET DIAGNOSTICS actual_assets = ROW_COUNT;
  -- History had no location column: capture asset location at cutover, not a claimed past location.
  UPDATE asset_assignment_history h SET custodian_id = c.id, custodian_name_snapshot = c.display_name, location_name_snapshot = l.name
    FROM asset_custodians c, assets a LEFT JOIN locations l ON l.id = a.location_id
    WHERE c.employee_id = h.employee_id AND a.id = h.asset_id;
  GET DIAGNOSTICS actual_history = ROW_COUNT;
  IF expected_people <> actual_people OR expected_assets <> actual_assets OR expected_history <> actual_history
    OR EXISTS (SELECT 1 FROM assets WHERE current_user_id IS NOT NULL AND current_custodian_id IS NULL)
    OR EXISTS (SELECT 1 FROM asset_assignment_history WHERE employee_id IS NOT NULL AND (custodian_id IS NULL OR custodian_name_snapshot IS NULL)) THEN
    RAISE EXCEPTION 'Custodian backfill aborted: reference count mismatch';
  END IF;
END $$;
