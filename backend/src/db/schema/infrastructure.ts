import { pgTable, bigint, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { employees } from './employees';
import { accurateLicenses } from './licenses';

export const servers = pgTable('servers', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  serverName: varchar('server_name', { length: 100 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 50 }).notNull(),
  osVersion: varchar('os_version', { length: 100 }),
  assetId: bigint('asset_id', { mode: 'number' }).references(() => assets.id),
  status: varchar('status', { length: 30 }).default('Online').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accurateDatabases = pgTable('accurate_databases', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  databaseName: varchar('database_name', { length: 150 }).notNull(),
  serverId: bigint('server_id', { mode: 'number' }).references(() => servers.id).notNull(),
  filePath: varchar('file_path', { length: 255 }), // e.g. C:\AccurateData\COMPANY.GDB
  companyAlias: varchar('company_alias', { length: 150 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accurateDatabaseUsers = pgTable('accurate_database_users', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  databaseId: bigint('database_id', { mode: 'number' }).references(() => accurateDatabases.id).notNull(),
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id).notNull(),
  licenseId: bigint('license_id', { mode: 'number' }).references(() => accurateLicenses.id),
  accessRole: varchar('access_role', { length: 50 }), // Admin, Operator, Viewer
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const databaseBackups = pgTable('database_backups', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  databaseId: bigint('database_id', { mode: 'number' }).references(() => accurateDatabases.id).notNull(),
  backupPath: varchar('backup_path', { length: 255 }).notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  status: varchar('status', { length: 30 }).default('Success').notNull(), // Success, Failed, Partial
  backupTimestamp: timestamp('backup_timestamp').defaultNow().notNull(),
  notes: text('notes'),
});
