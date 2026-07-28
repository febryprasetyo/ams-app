import { pgTable, bigint, varchar, timestamp, text, integer, date } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { assets } from './assets';
import { vendors } from './vendors';

export const softwareLicenses = pgTable('software_licenses', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  licenseKey: varchar('license_key', { length: 255 }),
  vendorId: bigint('vendor_id', { mode: 'number' }).references(() => vendors.id),
  totalSeats: integer('total_seats').default(1).notNull(),
  usedSeats: integer('used_seats').default(0).notNull(),
  licenseType: varchar('license_type', { length: 50 }), // Subscription, Perpetual, OEM
  expiresAt: date('expires_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  registeredAt: date('registered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
