import type { AttendanceDataset, AttendanceRepository, AttendanceCommand } from './types';
import { api } from '@/lib/api';

export function createAttendanceRepository(_accountId?: number): AttendanceRepository {
  let current: AttendanceDataset | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  async function load(signal?: AbortSignal): Promise<AttendanceDataset> {
    if (current) return structuredClone(current);

    const response = await api.get<{ success: boolean; data: AttendanceDataset }>(
      '/attendance/workspace',
      { signal }
    );

    if (!response || !response.data) {
      throw new Error('Workspace absensi gagal dimuat dari server.');
    }

    const data = response.data;
    data.batches = (data.batches || []).filter((batch) => batch.filename !== 'MANUAL_ENTRY');
    data.records = data.records || [];
    data.identities = data.identities || [];
    data.departments = data.departments || [];
    data.locations = data.locations || [];
    data.sources = data.sources || [];
    data.employees = data.employees || [];
    data.audit = data.audit || [];
    data.revisions = data.revisions || [];
    data.grants = data.grants || [];
    data.locks = data.locks || [];
    data.shifts = data.shifts || [];
    data.shiftAssignments = data.shiftAssignments || [];

    current = data;
    return structuredClone(current);
  }

  return {
    load,
    async execute(command: AttendanceCommand): Promise<AttendanceDataset> {
      const operation = queue.then(async () => {
        // sync_employees is client-side metadata alignment with master employee cache
        if (command.type === 'sync_employees') {
          if (!current) {
            await load();
          }
          current!.employees = command.employees;
          if (command.departments) {
            current!.departments = command.departments;
          }
          return structuredClone(current!);
        }

        const operationId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'op-' + Math.random().toString(36).substring(2) + '-' + Date.now();

        try {
          const response = await api.post<{
            success: boolean;
            data: { changed: boolean; eventId: string | null; data: AttendanceDataset };
          }>(
            '/attendance/commands',
            {
              operationId,
              command,
            },
            {
              headers: {
                'Idempotency-Key': operationId,
              },
            }
          );

          if (!response || !response.data || !response.data.data) {
            throw new Error('Respons mutasi absensi server tidak valid.');
          }

          const dataset = response.data.data;
          dataset.batches = (dataset.batches || []).filter(
            (batch) => batch.filename !== 'MANUAL_ENTRY'
          );
          current = dataset;
          return structuredClone(current);
        } catch (err: any) {
          // If conflict or state error, reset cache to force fresh reload
          if (err.message && /konflik|kunci|conflict|locked|409/i.test(err.message)) {
            current = null;
          }
          throw err;
        }
      });

      queue = operation.then(
        () => undefined,
        () => undefined
      );
      return operation;
    },
    async reset(): Promise<AttendanceDataset> {
      await queue;
      current = null;
      return load();
    },
  };
}
