import { pgTable, bigint, varchar, timestamp, text, integer, numeric } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { assets } from './assets';
import { vendors } from './vendors';

export const softwareLicenses = pgTable('software_licenses', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  licenseKey: varchar('license_key', { length: 255 }),
  licenseType: varchar('license_type', { length: 50 }), // 'CD / Dongle', 'OEM Bundled', 'Subscription', 'Perpetual'
  vendorId: bigint('vendor_id', { mode: 'number' }).references(() => vendors.id),
  totalSeats: integer('total_seats').default(1).notNull(),
  usedSeats: integer('used_seats').default(0).notNull(),
  purchaseDate: timestamp('purchase_date'),
  expirationDate: timestamp('expiration_date'),
  cost: numeric('cost'),
  status: varchar('status', { length: 30 }).default('Active').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const licenseAllocations = pgTable('license_allocations', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  licenseId: bigint('license_id', { mode: 'number' }).references(() => softwareLicenses.id),
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id),
  assetId: bigint('asset_id', { mode: 'number' }).references(() => assets.id),
  allocatedAt: timestamp('allocated_at').defaultNow().notNull(),
  notes: text('notes'),
});

export const m365Accounts = pgTable('m365_accounts', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  licenseType: varchar('license_type', { length: 100 }), // E3, E5, Business Basic, Business Standard
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id),
  status: varchar('status', { length: 30 }).default('Active').notNull(),
  assignedAt: timestamp('assigned_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accurateLicenses = pgTable('accurate_licenses', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  licenseNumber: varchar('license_number', { length: 100 }).notNull().unique(),
  variant: varchar('variant', { length: 50 }), // Accurate 5 Desktop Standard, Executive, Deluxe
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id),
  assetId: bigint('asset_id', { mode: 'number' }).references(() => assets.id),
  status: varchar('status', { length: 30 }).default('Active').notNull(),
  registeredAt: timestamp('registered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
