import { pgTable, bigint, varchar, text, date, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { users } from './users';

// 1. Kalender Cuti Bersama & Libur Perusahaan per Tahun
export const leaveHolidayCalendars = pgTable('leave_holiday_calendars', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  year: integer('year').notNull(),
  holidayDate: date('holiday_date').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  isCollectiveLeave: boolean('is_collective_leave').default(true).notNull(), // Cuti Bersama pemerintah yang memotong kuota
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Saldo Cuti Karyawan per Tahun
export const leaveBalances = pgTable('leave_balances', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  baseQuota: integer('base_quota').default(12).notNull(), // Hak cuti dasar tahunan (default 12)
  collectiveLeaveDeduction: integer('collective_leave_deduction').default(0).notNull(), // Jumlah cuti bersama tahun berjalan
  usedQuota: integer('used_quota').default(0).notNull(), // Cuti tahunan yang telah disetujui & diambil
  carriedOverQuota: integer('carried_over_quota').default(0).notNull(), // Kuota sisa tahun lalu (jika ada)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Permohonan Cuti Karyawan
export const leaveRequests = pgTable('leave_requests', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  requestNumber: varchar('request_number', { length: 50 }).notNull().unique(), // Format: LV-YYYYMM-XXXX
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'restrict' }),
  leaveType: varchar('leave_type', { length: 30 }).notNull(), // 'ANNUAL' | 'SPECIAL'
  specialLeaveReason: varchar('special_leave_reason', { length: 100 }), // 'Menikah' | 'Melahirkan' | 'Kematian' | 'Lain-lain'
  reason: text('reason').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  durationDays: integer('duration_days').notNull(), // Jumlah hari kerja efektif
  resumeWorkDate: date('resume_work_date').notNull(), // Kembali Bekerja Tgl
  
  // Serah Terima Tugas (Handover)
  handoverToEmployeeId: bigint('handover_to_employee_id', { mode: 'number' }).references(() => employees.id),
  handoverTask: text('handover_task'),
  emergencyPhone: varchar('emergency_phone', { length: 50 }),
  
  // Status & Catatan HRD
  hrdNotes: text('hrd_notes'),
  status: varchar('status', { length: 30 }).default('PENDING').notNull(), // 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  
  // Snapshot Saldo saat Pengajuan (untuk arsip & cetak form F4)
  balanceYear: integer('balance_year').notNull(),
  snapshotBaseQuota: integer('snapshot_base_quota').notNull(),
  snapshotCollectiveLeave: integer('snapshot_collective_leave').notNull(),
  snapshotAvailableBefore: integer('snapshot_available_before').notNull(),
  snapshotRemainingAfter: integer('snapshot_remaining_after').notNull(),

  createdById: bigint('created_by_id', { mode: 'number' }).references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Persetujuan Bertingkat (4 Kolom Sesuai Form Cetak F4)
export const leaveApprovals = pgTable('leave_approvals', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  leaveRequestId: bigint('leave_request_id', { mode: 'number' }).notNull().references(() => leaveRequests.id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 30 }).notNull(), // 'APPLICANT' | 'DIRECT_SUPERVISOR' | 'HRD' | 'HIGHER_SUPERVISOR'
  approverEmployeeId: bigint('approver_employee_id', { mode: 'number' }).references(() => employees.id),
  approverName: varchar('approver_name', { length: 150 }),
  status: varchar('status', { length: 30 }).default('PENDING').notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED'
  signatureDate: date('signature_date'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
