import { pgTable, bigint, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { locations } from './master';

export const assetCategories = pgTable('asset_categories', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  codePrefix: varchar('code_prefix', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assets = pgTable('assets', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  assetCode: varchar('asset_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  categoryId: bigint('category_id', { mode: 'number' }).references(() => assetCategories.id).notNull(),
  locationId: bigint('location_id', { mode: 'number' }).references(() => locations.id),
  serialNumber: varchar('serial_number', { length: 100 }),
  status: varchar('status', { length: 30 }).default('Available').notNull(), // Available, Assigned, Maintenance, Disposed, Lost
  condition: varchar('condition', { length: 30 }).default('Good').notNull(), // Good, Fair, Poor, Damaged
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
