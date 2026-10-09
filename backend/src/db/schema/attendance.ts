import { pgTable, bigint, varchar, integer, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { users } from './users';

export const attendanceBatches = pgTable('attendance_batches', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  filename: varchar('filename', { length: 255 }).notNull(),
  sourceId: integer('source_id').default(1).notNull(),
  fileHash: varchar('file_hash', { length: 64 }),
  status: varchar('status', { length: 20 }).default('COMMITTED').notNull(), // 'DRAFT' | 'COMMITTED' | 'CANCELLED'
  totalRows: integer('total_rows').default(0).notNull(),
  validRows: integer('valid_rows').default(0).notNull(),
  skippedRows: integer('skipped_rows').default(0).notNull(),
  createdById: bigint('created_by_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  committedAt: timestamp('committed_at').defaultNow().notNull(),
});

export const attendanceRecords = pgTable('attendance_records', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  workDate: varchar('work_date', { length: 10 }).notNull(), // 'YYYY-MM-DD'
  shift: varchar('shift', { length: 100 }),
  scheduleIn: varchar('schedule_in', { length: 10 }),
  scheduleOut: varchar('schedule_out', { length: 10 }),
  scanIn: varchar('scan_in', { length: 10 }),
  scanOut: varchar('scan_out', { length: 10 }),
  rawScanIn: varchar('raw_scan_in', { length: 10 }),
  rawScanOut: varchar('raw_scan_out', { length: 10 }),
  lateMinutes: integer('late_minutes').default(0).notNull(),
  earlyMinutes: integer('early_minutes').default(0).notNull(),
  overtimeMinutes: integer('overtime_minutes').default(0).notNull(),
  attendanceStatus: varchar('attendance_status', { length: 20 }).default('PRESENT').notNull(), // 'PRESENT' | 'IZIN' | 'SAKIT' | 'CUTI' | 'ALPHA'
  isDayOff: boolean('is_day_off').default(false).notNull(),
  normalized: boolean('normalized').default(false).notNull(),
  revision: integer('revision').default(1).notNull(),
  sourceBatchId: bigint('source_batch_id', { mode: 'number' }).references(() => attendanceBatches.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('uq_attendance_employee_date').on(table.employeeId, table.workDate),
]);
