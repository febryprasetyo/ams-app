import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  text,
  numeric,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { accurateLicenses } from './licenses';

export const servers = pgTable('servers', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  serverCode: varchar('hostname', { length: 100 }),
  name: varchar('name', { length: 150 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  macAddress: varchar('mac_address', { length: 32 }),
  os: varchar('os', { length: 150 }),
  specs: varchar('storage_spec', { length: 255 }),
  status: varchar('status', { length: 30 }).default('Online'),
  notes: text('notes'),
  licenseServerUrl: varchar('license_server_url', { length: 255 }),
  agentVersion: varchar('agent_version', { length: 30 }),
  uptimeSeconds: bigint('uptime_seconds', { mode: 'number' }).default(0),
  accurateStatus: varchar('accurate_status', { length: 30 }).default('UNKNOWN'),
  isAccurateActive: boolean('is_accurate_active').default(false).notNull(),
  isFirebirdActive: boolean('is_firebird_active').default(false).notNull(),
  services: jsonb('services').$type<unknown[]>().default([]).notNull(),
  processes: jsonb('processes').$type<unknown[]>().default([]).notNull(),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('servers_hostname_unique').on(table.serverCode),
]);

export const accurateLicenseLogs = pgTable('accurate_license_logs', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  serverId: bigint('server_id', { mode: 'number' }).references(() => servers.id, { onDelete: 'cascade' }).notNull(),
  seatNo: integer('seat_no'),
  licenseKey: varchar('license_key', { length: 100 }),
  date: varchar('date', { length: 50 }),
  ip: varchar('ip_address', { length: 45 }),
  version: varchar('version', { length: 50 }),
  host: varchar('host', { length: 100 }),
  status: varchar('status', { length: 30 }).default('ACTIVE'),
  scrapedAt: timestamp('scraped_at').defaultNow(),
}, (table) => [
  uniqueIndex('accurate_license_logs_server_key_unique').on(table.serverId, table.licenseKey),
]);

export const accurateDatabases = pgTable('accurate_databases', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  databaseName: varchar('database_name', { length: 150 }).notNull(),
  serverId: bigint('server_id', { mode: 'number' }).references(() => servers.id, { onDelete: 'cascade' }).notNull(),
  filePath: varchar('file_path', { length: 500 }),
  companyAlias: varchar('company_alias', { length: 150 }),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).default(0).notNull(),
  fileSizeMb: numeric('file_size_mb').default('0').notNull(),
  fileSizeFormatted: varchar('file_size_formatted', { length: 50 }).default('0 MB').notNull(),
  status: varchar('status', { length: 30 }).default('Online').notNull(),
  lastModifiedAt: timestamp('last_modified_at'),
  fileCreatedAt: timestamp('file_created_at'),
  reportedAt: timestamp('reported_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('accurate_databases_server_path_unique').on(table.serverId, table.filePath),
]);

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

export const dbBackups = pgTable('db_backups', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  serverId: bigint('server_id', { mode: 'number' }).references(() => servers.id),
  dbName: varchar('db_name', { length: 100 }),
  sizeMb: numeric('size_mb'),
  status: varchar('status', { length: 30 }).default('Success'),
  backupPath: varchar('backup_path', { length: 255 }),
  completedAt: timestamp('completed_at').defaultNow(),
});
