-- Clean any legacy duplicate serial numbers before applying unique index
WITH ranked_serials AS (
  SELECT id, serial_number,
         ROW_NUMBER() OVER (
           PARTITION BY lower(trim(serial_number))
           ORDER BY id ASC
         ) AS rn
  FROM "assets"
  WHERE "serial_number" IS NOT NULL AND trim("serial_number") <> ''
)
UPDATE "assets"
SET "serial_number" = "assets"."serial_number" || '-DUP-' || "assets"."id"
WHERE "id" IN (
  SELECT id FROM ranked_serials WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "assets_serial_number_lower_unique" ON "assets" (lower(trim("serial_number"))) WHERE "serial_number" IS NOT NULL AND trim("serial_number") <> '';
