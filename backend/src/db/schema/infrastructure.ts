import { pgTable, bigint, varchar, timestamp, text, numeric, boolean } from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { employees } from './employees';
import { accurateLicenses } from './licenses';

export const accurateLicenseLogs = pgTable('accurate_license_logs', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  computerName: varchar('computer_name', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userName: varchar('user_name', { length: 100 }),
  licenseVariant: varchar('license_variant', { length: 100 }).default('Accurate 5 Enterprise'),
  loginTime: timestamp('login_time'),
  status: varchar('status', { length: 30 }).default('Active'),
  scrapedAt: timestamp('scraped_at').defaultNow(),
});

export const servers = pgTable('servers', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  serverCode: varchar('server_code', { length: 50 }),
  name: varchar('name', { length: 150 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  os: varchar('os', { length: 100 }),
  specs: varchar('specs', { length: 255 }),
  status: varchar('status', { length: 30 }).default('Online'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dbBackups = pgTable('db_backups', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  serverId: bigint('server_id', { mode: 'number' }).references(() => servers.id),
  dbName: varchar('db_name', { length: 100 }),
  sizeMb: numeric('size_mb'),
  status: varchar('status', { length: 30 }).default('Success'),
  backupPath: varchar('backup_path', { length: 255 }),
  completedAt: timestamp('completed_at').defaultNow(),
});

export const accurateDatabases = pgTable('accurate_databases', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  databaseName: varchar('database_name', { length: 150 }).notNull(),
  serverId: bigint('server_id', { mode: 'number' }).references(() => servers.id).notNull(),
  filePath: varchar('file_path', { length: 255 }),
  companyAlias: varchar('company_alias', { length: 150 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accurateDatabaseUsers = pgTable('accurate_database_users', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  databaseId: bigint('database_id', { mode: 'number' }).references(() => accurateDatabases.id).notNull(),
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id).notNull(),
  licenseId: bigint('license_id', { mode: 'number' }).references(() => accurateLicenses.id),
  accessRole: varchar('access_role', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const databaseBackups = pgTable('database_backups', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  databaseId: bigint('database_id', { mode: 'number' }).references(() => accurateDatabases.id).notNull(),
  backupPath: varchar('backup_path', { length: 255 }).notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  status: varchar('status', { length: 30 }).default('Success').notNull(),
  backupTimestamp: timestamp('backup_timestamp').defaultNow().notNull(),
  notes: text('notes'),
});
