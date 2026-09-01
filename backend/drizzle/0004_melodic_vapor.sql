DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM "asset_categories" GROUP BY lower("name") HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot enforce unique IT equipment type names: case-insensitive duplicates exist. Rename or merge duplicates before retrying migration 0004.';
	END IF;

	IF EXISTS (
		SELECT 1 FROM "asset_categories" GROUP BY lower("code") HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot enforce unique IT equipment type prefixes: case-insensitive duplicates exist. Assign unique prefixes before retrying migration 0004.';
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_categories_name_lower_unique" ON "asset_categories" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "asset_categories_code_lower_unique" ON "asset_categories" USING btree (lower("code"));
