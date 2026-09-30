import { applyCommand } from './commands';
import type { AttendanceDataset, AttendanceRepository, Employee, MasterItem } from './types';
import { api } from '@/lib/api';

export function createAttendanceRepository(accountId: number): AttendanceRepository {
  const storageKey = `ams:attendance-demo:v1:${accountId}`;
  let current: AttendanceDataset | null = null;
  async function load(signal?: AbortSignal): Promise<AttendanceDataset> {
    if (current) return structuredClone(current);
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
    let parsed: unknown;
    if (saved) parsed = JSON.parse(saved);
    else {
      const response = await fetch('/mock/attendance.json', { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000), cache: 'no-store' });
      if (!response.ok) throw new Error('Data contoh gagal dimuat. Silakan coba lagi.');
      parsed = await response.json();
    }
    if (!parsed || typeof parsed !== 'object' || !('schemaVersion' in parsed) || parsed.schemaVersion !== 1 || !('records' in parsed) || !Array.isArray(parsed.records)) throw new Error('Format data demo tidak sesuai. Reset data demo untuk memuat ulang.');
    current = parsed as AttendanceDataset;

    // Live sync with real database employees and departments if available
    if (typeof window !== 'undefined') {
      try {
        const [empData, deptData] = await Promise.all([
          api.get<any[]>('/employees'),
          api.get<any[]>('/master/departments'),
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
          }));
        }
        if (Array.isArray(deptData) && deptData.length > 0) {
          current.departments = deptData.map((d: any): MasterItem => ({
            id: Number(d.id),
            code: String(d.code || ''),
            name: String(d.name || ''),
            isActive: d.isActive !== false,
          }));
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
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(storageKey, JSON.stringify(result));
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
        sessionStorage.removeItem(storageKey);
      }
      current = null;
      return load();
    },
  };
}
