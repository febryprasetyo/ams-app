
export interface WorkShift {
  id: number;
  code: string;
  name: string;
  scheduleIn: string;
  scheduleOut: string;
  workDays: 5 | 6;
  saturdayScheduleIn?: string | null;
  saturdayScheduleOut?: string | null;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface ShiftAssignment {
  id: number;
  shiftId: number;
  departmentId?: number | null;
  employeeId?: number | null;
}
export type AttendanceRole = 'HR_ADMIN' | 'HR_STAFF' | 'REPORT_VIEWER';
export type AttendanceStatus = 'PRESENT' | 'IZIN' | 'SAKIT' | 'CUTI' | 'ALPHA' | 'UNSPECIFIED';
export type ReviewStatus = 'READY' | 'NEEDS_REVIEW' | 'BLOCKED' | 'SKIPPED';
export interface MasterItem { id: number; code: string; name: string; isActive: boolean }
export interface Employee {
  id: number; employeeCode: string; fullName: string; email: string;
  departmentId: number; locationId: number | null; position: string; isActive: boolean;
}
export interface Identity { id: number; sourceId: number; externalNoId: string; employeeId: number }
export interface AttendanceRecord {
  id: number; employeeId: number; workDate: string; shift: string | null;
  scheduleIn: string | null; scheduleOut: string | null;
  scanIn: string | null; scanOut: string | null; rawScanIn: string | null; rawScanOut: string | null;
  lateMinutes: number; earlyMinutes: number; overtimeMinutes: number;
  attendanceStatus: AttendanceStatus; isDayOff: boolean;
  normalized: boolean; revision: number; sourceBatchId: number | null;
}
export interface ImportRow {
  id: number; externalNoId: string; employeeId: number | null; workDate: string;
  scanIn: string | null; scanOut: string | null;
  lateMinutes: number; earlyMinutes: number; overtimeMinutes: number;
  reviewStatus: ReviewStatus; note: string;
  employeeName?: string; department?: string; employeeCode?: string;
  shift?: string | null; scheduleIn?: string | null; scheduleOut?: string | null;
  rawScanIn?: string | null; rawScanOut?: string | null; normalized?: boolean;
  issues?: string[];
}
export interface ImportBatch {
  id: number; filename: string; sourceId: number; fileHash?: string; createdAt: string;
  status: 'DRAFT' | 'COMMITTED' | 'CANCELLED'; rows: ImportRow[];
}
export interface AuditEntry { id: number; createdAt: string; actor: string; action: string; detail: string }
export interface Revision {
  id: number; recordId: number; reason: string; createdAt: string; actor: string;
  before: AttendanceRecord; after: AttendanceRecord;
}
export interface AttendanceGrant { id: number; principalKey: string; displayName: string; role: AttendanceRole; isActive: boolean }
export interface AttendanceLock { workDate: string; reason: string; createdAt: string }
export interface AttendanceDataset {
  schemaVersion: 1;
  meta: { defaultDate: string; periodStart: string; actor: string; role: AttendanceRole; canManageAccess: boolean; sourceFile?: string; sourceHash?: string; sourceRows?: number };
  departments: MasterItem[]; locations: MasterItem[]; sources: MasterItem[];
  employees: Employee[]; identities: Identity[]; records: AttendanceRecord[];
  batches: ImportBatch[]; audit: AuditEntry[]; revisions: Revision[];
  grants: AttendanceGrant[]; locks: AttendanceLock[];
  shifts?: WorkShift[];
  shiftAssignments?: ShiftAssignment[];
}
export interface RecordFilter { startDate: string; endDate: string; q?: string; departmentId?: number; locationId?: number; employeeId?: number }
export interface EmployeeReport { employee: Employee; recordCount: number; lateMinutes: number; overtimeMinutes: number }
export type AttendanceCommand =
  | { type: 'correct'; recordId: number; expectedRevision: number; values: Pick<AttendanceRecord, 'scanIn' | 'scanOut' | 'lateMinutes' | 'overtimeMinutes' | 'attendanceStatus'>; reason: string }
  | { type: 'employee'; value: Employee }
  | { type: 'master'; collection: 'departments' | 'locations' | 'sources'; value: MasterItem }
  | { type: 'identity'; value: Identity }
  | { type: 'grant'; value: AttendanceGrant }
  | { type: 'lock'; workDate: string; locked: boolean; reason: string }
  | { type: 'import'; filename: string; sourceId?: number; fileHash?: string; rows: ImportRow[] }
  | { type: 'review'; batchId: number; rowId: number; employeeId: number | null; skipped: boolean; reason: string; values?: { scanIn?: string | null; scanOut?: string | null; lateMinutes?: number; overtimeMinutes?: number } }
  | { type: 'batch'; batchId: number; action: 'commit' | 'cancel' | 'reopen' }
  | { type: 'record_attendance'; employeeId: number; workDate: string; attendanceStatus: AttendanceStatus; shiftId?: number; scanIn?: string | null; scanOut?: string | null; reason?: string }
  | { type: 'shift'; action: 'create' | 'update' | 'delete'; shift: WorkShift }
  | { type: 'assign_shift'; assignment: ShiftAssignment }
  | { type: 'sync_employees'; employees: Employee[]; departments?: MasterItem[] };

export interface AttendanceRepository {
  load(signal?: AbortSignal): Promise<AttendanceDataset>;
  execute(command: AttendanceCommand): Promise<AttendanceDataset>;
  reset(): Promise<AttendanceDataset>;
}
