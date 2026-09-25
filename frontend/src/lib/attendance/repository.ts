import { applyCommand } from './commands';
import type { AttendanceDataset, AttendanceRepository } from './types';

export function createAttendanceRepository(accountId: number): AttendanceRepository {
  const storageKey = `ams:attendance-demo:v1:${accountId}`;
  let current: AttendanceDataset | null = null;
  async function load(signal?: AbortSignal): Promise<AttendanceDataset> {
    if (current) return structuredClone(current);
    const saved = sessionStorage.getItem(storageKey);
    let parsed: unknown;
    if (saved) parsed = JSON.parse(saved);
    else {
      const response = await fetch('/mock/attendance.json', { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000), cache: 'no-store' });
      if (!response.ok) throw new Error('Data contoh gagal dimuat. Silakan coba lagi.');
      parsed = await response.json();
    }
    if (!parsed || typeof parsed !== 'object' || !('schemaVersion' in parsed) || parsed.schemaVersion !== 1 || !('records' in parsed) || !Array.isArray(parsed.records)) throw new Error('Format data demo tidak sesuai. Reset data demo untuk memuat ulang.');
    current = parsed as AttendanceDataset;
    return structuredClone(current);
  }
  let queue = Promise.resolve();
  return {
    load,
    execute(command) {
      const operation = queue.then(async () => {
        const data = await load();
        const result = applyCommand(data, command);
        sessionStorage.setItem(storageKey, JSON.stringify(result));
        current = result;
        return structuredClone(result);
      });
      queue = operation.then(() => undefined, () => undefined);
      return operation;
    },
    async reset() {
      await queue;
      sessionStorage.removeItem(storageKey); current = null;
      return load();
    },
  };
}
