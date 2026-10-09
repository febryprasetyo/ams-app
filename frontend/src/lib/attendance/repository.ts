import { applyCommand } from './commands';
import type { AttendanceDataset, AttendanceRepository, AttendanceRecord, Employee, MasterItem } from './types';
import { DEFAULT_OFFICE_SHIFT, DEFAULT_PRODUCTION_SHIFT } from './scheduleShift.ts';
import { api } from '@/lib/api';

export function createAttendanceRepository(accountId?: number): AttendanceRepository {
  const sharedKey = 'ams:attendance-workspace:v2';
  const accountKey = accountId ? `ams:attendance-demo:v2:${accountId}` : '';
  const legacyKey = `ams:attendance-demo:v1:${accountId}`;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(legacyKey);
  }
  let current: AttendanceDataset | null = null;
  async function load(signal?: AbortSignal): Promise<AttendanceDataset> {
    if (current) return structuredClone(current);
    let saved = typeof window !== 'undefined' ? localStorage.getItem(sharedKey) : null;
    if (!saved && typeof window !== 'undefined' && accountKey) {
      saved = sessionStorage.getItem(accountKey) || sessionStorage.getItem('ams:attendance-demo:v2:1');
      if (saved) {
        localStorage.setItem(sharedKey, saved);
      }
    }
    let parsed: unknown;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch {
        parsed = null;
      }
    }
    if (!parsed) {
      const response = await fetch('/mock/attendance.json', { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000), cache: 'no-store' });
      if (!response.ok) throw new Error('Data contoh gagal dimuat. Silakan coba lagi.');
      parsed = await response.json();
    }
    if (!parsed || typeof parsed !== 'object' || !('schemaVersion' in parsed) || parsed.schemaVersion !== 1 || !('records' in parsed) || !Array.isArray(parsed.records)) throw new Error('Format data demo tidak sesuai. Reset data demo untuk memuat ulang.');
    current = parsed as AttendanceDataset;
    if (!current.shifts || current.shifts.length === 0) { current.shifts = [DEFAULT_OFFICE_SHIFT, DEFAULT_PRODUCTION_SHIFT]; }
    if (!current.shiftAssignments) { current.shiftAssignments = []; }

    // Live sync with real database: employees, departments, strict_integrity, and attendance records
    if (typeof window !== 'undefined') {
      try {
        const [empData, deptData, settingRes, dbRecords, dbBatches] = await Promise.all([
          api.get<any[]>('/employees').catch(() => null),
          api.get<any[]>('/master/departments').catch(() => null),
          api.get<{ key: string; value: any }>('/system/settings/attendance_strict_integrity').catch(() => null),
          api.get<any[]>('/attendance/records').catch(() => null),
          api.get<any[]>('/attendance/batches').catch(() => null),
        ]);

        if (Array.isArray(empData) && empData.length > 0) {
          current.employees = empData.map((e: any): Employee => ({
            id: Number(e.id),
            employeeCode: String(e.employeeId || e.nik || e.employeeCode || ''),
            fullName: String(e.fullName || e.name || ''),
            email: String(e.email || ''),
            departmentId: Number(e.departmentId || 0),
            locationId: e.locationId ? Number(e.locationId) : null,
            position: String(e.jobPosition || e.position || ''),
            isActive: e.isActive !== false,
            barcode: String(e.barcode || ''),
          } as any));
        }

        if (Array.isArray(deptData) && deptData.length > 0) {
          current.departments = deptData.map((d: any): MasterItem => ({
            id: Number(d.id),
            code: String(d.code || ''),
            name: String(d.name || ''),
            isActive: d.isActive !== false,
          }));
        }

        if (settingRes && typeof settingRes.value === 'boolean') {
          current.meta.strictIntegrity = settingRes.value;
          for (const b of current.batches) {
            b.strictIntegrity = settingRes.value;
          }
        }

        // Live sync attendance records from database if present
        if (Array.isArray(dbRecords) && dbRecords.length > 0) {
          const mappedRecords: AttendanceRecord[] = dbRecords.map((r: any): AttendanceRecord => ({
            id: Number(r.id),
            employeeId: Number(r.employeeId),
            workDate: String(r.workDate),
            shift: r.shift ? String(r.shift) : null,
            scheduleIn: r.scheduleIn ? String(r.scheduleIn) : null,
            scheduleOut: r.scheduleOut ? String(r.scheduleOut) : null,
            scanIn: r.scanIn ? String(r.scanIn) : null,
            scanOut: r.scanOut ? String(r.scanOut) : null,
            rawScanIn: r.rawScanIn ? String(r.rawScanIn) : (r.scanIn ? String(r.scanIn) : null),
            rawScanOut: r.rawScanOut ? String(r.rawScanOut) : (r.scanOut ? String(r.scanOut) : null),
            lateMinutes: Number(r.lateMinutes || 0),
            earlyMinutes: Number(r.earlyMinutes || 0),
            overtimeMinutes: Number(r.overtimeMinutes || 0),
            attendanceStatus: (r.attendanceStatus || 'PRESENT') as any,
            isDayOff: Boolean(r.isDayOff),
            normalized: Boolean(r.normalized),
            revision: Number(r.revision || 1),
            sourceBatchId: r.sourceBatchId ? Number(r.sourceBatchId) : null,
          }));

          // Merge: use database records as ground truth for employee-date pairs
          const dbKeySet = new Set(mappedRecords.map(r => `${r.employeeId}:${r.workDate}`));
          const localOnly = current.records.filter(r => !dbKeySet.has(`${r.employeeId}:${r.workDate}`));
          current.records = [...mappedRecords, ...localOnly];
        }

        // Live sync committed batches from database if present
        if (Array.isArray(dbBatches) && dbBatches.length > 0) {
          const existingBatchIds = new Set(current.batches.map(b => b.id));
          for (const dbb of dbBatches) {
            const bId = Number(dbb.id);
            if (!existingBatchIds.has(bId)) {
              current.batches.push({
                id: bId,
                filename: String(dbb.filename),
                sourceId: Number(dbb.sourceId || 1),
                fileHash: dbb.fileHash ? String(dbb.fileHash) : undefined,
                status: 'COMMITTED',
                createdAt: dbb.createdAt ? new Date(dbb.createdAt).toISOString() : new Date().toISOString(),
                rows: [],
                strictIntegrity: current.meta.strictIntegrity,
              });
            }
          }
        }
      } catch {
        // Fallback silently if offline or token not yet ready
      }
    }

    return structuredClone(current);
  }
  let queue = Promise.resolve();
  return {
    load,
    execute(command) {
      const operation = queue.then(async () => {
        const data = await load();
        const result = applyCommand(data, command);

        if (command.type === 'set_strict_integrity' && typeof window !== 'undefined') {
          try {
            await api.put('/system/settings/attendance_strict_integrity', {
              value: command.enabled,
              description: 'Integritas Data Ketat (Strict Integrity) impor absensi',
            });
          } catch {
            // fallback gracefully
          }
        }

        // Persist committed batch to central PostgreSQL database
        if (command.type === 'batch' && command.action === 'commit' && typeof window !== 'undefined') {
          const committedBatch = result.batches.find(b => b.id === command.batchId);
          if (committedBatch) {
            const batchRecords = result.records.filter(r => r.sourceBatchId === command.batchId);
            if (batchRecords.length > 0) {
              try {
                await api.post('/attendance/commit-batch', {
                  filename: committedBatch.filename,
                  sourceId: committedBatch.sourceId || 1,
                  fileHash: committedBatch.fileHash,
                  records: batchRecords.map(r => ({
                    employeeId: r.employeeId,
                    workDate: r.workDate,
                    shift: r.shift,
                    scheduleIn: r.scheduleIn,
                    scheduleOut: r.scheduleOut,
                    scanIn: r.scanIn,
                    scanOut: r.scanOut,
                    rawScanIn: r.rawScanIn,
                    rawScanOut: r.rawScanOut,
                    lateMinutes: r.lateMinutes,
                    earlyMinutes: r.earlyMinutes,
                    overtimeMinutes: r.overtimeMinutes,
                    attendanceStatus: r.attendanceStatus,
                    isDayOff: r.isDayOff,
                    normalized: r.normalized,
                  })),
                });
              } catch (err) {
                console.error('Failed to commit attendance batch to database:', err);
              }
            }
          }
        }

        // Persist manual attendance record (e.g. SAKIT/IZIN/CUTI) to central database
        if (command.type === 'record_attendance' && typeof window !== 'undefined') {
          try {
            await api.post('/attendance/commit-batch', {
              filename: 'MANUAL_ENTRY',
              sourceId: 1,
              records: [{
                employeeId: command.employeeId,
                workDate: command.workDate,
                attendanceStatus: command.attendanceStatus,
                scanIn: command.scanIn || null,
                scanOut: command.scanOut || null,
                lateMinutes: 0,
                earlyMinutes: 0,
                overtimeMinutes: 0,
                isDayOff: false,
                normalized: true,
              }],
            });
          } catch (err) {
            console.error('Failed to save manual attendance record to database:', err);
          }
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(sharedKey, JSON.stringify(result));
          if (accountKey) sessionStorage.setItem(accountKey, JSON.stringify(result));
        }
        current = result;
        return structuredClone(result);
      });
      queue = operation.then(() => undefined, () => undefined);
      return operation;
    },
    async reset() {
      await queue;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(sharedKey);
        if (accountKey) sessionStorage.removeItem(accountKey);
      }
      current = null;
      return load();
    },
  };
}
