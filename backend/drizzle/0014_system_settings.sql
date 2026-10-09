CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" varchar(100) PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "description" text,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
