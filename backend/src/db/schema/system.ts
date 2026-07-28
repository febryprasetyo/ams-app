import { pgTable, bigint, varchar, timestamp, text, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, ASSIGN, LOGIN
  entity: varchar('entity', { length: 50 }).notNull(), // ASSET, TICKET, USER, LICENSE, DB
  entityId: bigint('entity_id', { mode: 'number' }),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: varchar('user_agent', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 30 }).default('INFO').notNull(), // INFO, WARNING, SLA_ALERT, EXPIRATION
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
