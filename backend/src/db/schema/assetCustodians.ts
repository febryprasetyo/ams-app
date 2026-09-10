import { sql } from 'drizzle-orm';
import { pgTable, bigint, varchar, text, timestamp, uniqueIndex, index, check, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { locations } from './master';
import { users } from './users';

export const assetCustodians = pgTable('asset_custodians', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  displayName: varchar('display_name', { length: 150 }).notNull(),
  normalizedName: varchar('normalized_name', { length: 150 }).notNull(),
  origin: varchar('origin', { length: 20 }).notNull().default('MANUAL'),
  verificationStatus: varchar('verification_status', { length: 20 }).notNull().default('UNVERIFIED'),
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id),
  locationId: bigint('location_id', { mode: 'number' }).references(() => locations.id),
  unitText: varchar('unit_text', { length: 150 }),
  notes: text('notes'),
  recordStatus: varchar('record_status', { length: 20 }).notNull().default('ACTIVE'),
  mergedIntoCustodianId: bigint('merged_into_custodian_id', { mode: 'number' }).references((): AnyPgColumn => assetCustodians.id),
  createdByUserId: bigint('created_by_user_id', { mode: 'number' }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  uniqueIndex('asset_custodians_active_employee_unique').on(table.employeeId).where(sql`${table.employeeId} IS NOT NULL AND ${table.recordStatus} = 'ACTIVE'`),
  index('asset_custodians_normalized_name_idx').on(table.normalizedName),
  check('asset_custodians_origin_check', sql`${table.origin} IN ('MANUAL', 'HRD')`),
  check('asset_custodians_verification_check', sql`(${table.verificationStatus} = 'UNVERIFIED' AND ${table.employeeId} IS NULL) OR (${table.verificationStatus} = 'VERIFIED' AND ${table.employeeId} IS NOT NULL)`),
  check('asset_custodians_status_check', sql`${table.recordStatus} IN ('ACTIVE', 'INACTIVE', 'MERGED')`),
  check('asset_custodians_merge_check', sql`(${table.recordStatus} = 'MERGED' AND ${table.mergedIntoCustodianId} IS NOT NULL AND ${table.mergedIntoCustodianId} <> ${table.id}) OR (${table.recordStatus} <> 'MERGED' AND ${table.mergedIntoCustodianId} IS NULL)`),
  check('asset_custodians_name_check', sql`length(trim(${table.displayName})) > 0 AND length(trim(${table.normalizedName})) > 0`),
]);
