import { sql } from 'drizzle-orm';
import { bigint, check, index, integer, jsonb, pgTable, primaryKey, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const hrAuditActions = [
  'CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'REVIEW', 'LINK', 'UNLINK',
  'APPROVE', 'REJECT', 'CANCEL', 'REOPEN', 'LOCK', 'UNLOCK', 'ASSIGN', 'UNASSIGN',
] as const;
export const hrAuditOutcomes = ['SUCCESS', 'PARTIAL', 'FAILED'] as const;

export const hrAuditEvents = pgTable('hr_audit_events', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  operationId: uuid('operation_id').notNull(),
  // Snapshot IDs deliberately have no FK: account/source deletion must not rewrite history.
  actorId: bigint('actor_id', { mode: 'bigint' }).notNull(),
  actorUsername: varchar('actor_username', { length: 100 }).notNull(),
  actorName: varchar('actor_name', { length: 255 }).notNull(),
  action: varchar('action', { length: 24, enum: hrAuditActions }).notNull(),
  entityType: varchar('entity_type', { length: 40 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  entityLabel: varchar('entity_label', { length: 255 }).notNull(),
  outcome: varchar('outcome', { length: 16, enum: hrAuditOutcomes }).notNull(),
  summary: varchar('summary', { length: 1000 }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  schemaVersion: integer('schema_version').default(1).notNull(),
}, (table) => [
  check('hr_audit_events_action_check', sql`${table.action} IN ('CREATE','UPDATE','DELETE','IMPORT','REVIEW','LINK','UNLINK','APPROVE','REJECT','CANCEL','REOPEN','LOCK','UNLOCK','ASSIGN','UNASSIGN')`),
  check('hr_audit_events_outcome_check', sql`${table.outcome} IN ('SUCCESS','PARTIAL','FAILED')`),
  check('hr_audit_events_metadata_object', sql`jsonb_typeof(${table.metadata}) = 'object'`),
  index('hr_audit_events_time_idx').on(table.occurredAt.desc(), table.id.desc()),
  index('hr_audit_events_actor_time_idx').on(table.actorId, table.occurredAt.desc(), table.id.desc()),
  index('hr_audit_events_action_time_idx').on(table.action, table.occurredAt.desc(), table.id.desc()),
  index('hr_audit_events_entity_idx').on(table.entityType, table.entityId),
]);

type Snapshot = Record<string, string | number | boolean | null>;

export const hrAuditTargets = pgTable('hr_audit_targets', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  eventId: bigint('event_id', { mode: 'bigint' }).notNull()
    .references(() => hrAuditEvents.id, { onDelete: 'restrict' }),
  entityType: varchar('entity_type', { length: 40 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  entityLabel: varchar('entity_label', { length: 255 }).notNull(),
  before: jsonb('before').$type<Snapshot>(),
  after: jsonb('after').$type<Snapshot>(),
  changedFields: jsonb('changed_fields').$type<string[]>().notNull(),
}, (table) => [
  check('hr_audit_targets_changed_fields_array', sql`jsonb_typeof(${table.changedFields}) = 'array' AND NOT jsonb_path_exists(${table.changedFields}, '$[*] ? (@.type() != "string")')`),
  check('hr_audit_targets_before_object', sql`${table.before} IS NULL OR jsonb_typeof(${table.before}) = 'object'`),
  check('hr_audit_targets_after_object', sql`${table.after} IS NULL OR jsonb_typeof(${table.after}) = 'object'`),
  index('hr_audit_targets_event_idx').on(table.eventId, table.id),
  index('hr_audit_targets_entity_idx').on(table.entityType, table.entityId, table.eventId),
]);

export const hrMutationReceipts = pgTable('hr_mutation_receipts', {
  actorId: bigint('actor_id', { mode: 'bigint' }).notNull(),
  operationId: uuid('operation_id').notNull(),
  requestHash: varchar('request_hash', { length: 64 }).notNull(),
  response: jsonb('response').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.actorId, table.operationId] }),
]);
