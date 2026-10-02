'use client';

import { useAttendance } from './AttendanceWorkspace';
import { FormDialog } from './shared';
import { dateLabel, statusLabels } from '@/lib/attendance/domain';
import type { AttendanceRecord, AttendanceStatus, Employee } from '@/lib/attendance/types';

interface UnifiedCorrectionModalProps {
  employee: Employee;
  date: string;
  existingRecord?: AttendanceRecord | null;
  shiftId?: number;
  onClose: () => void;
}

export function UnifiedCorrectionModal({
  employee,
  date,
  existingRecord,
  shiftId,
  onClose,
}: UnifiedCorrectionModalProps) {
  const { execute } = useAttendance();

  const isExisting = !!existingRecord;

  return (
    <FormDialog
      title="Koreksi absensi"
      description={`${employee.fullName} · ${dateLabel(date)}.`}
      onClose={onClose}
      fields={[
        {
          name: 'attendanceStatus',
          label: 'Status kehadiran',
          type: 'select',
          value: existingRecord?.attendanceStatus || 'PRESENT',
          options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
        },
        {
          name: 'scanIn',
          label: 'Scan masuk',
          type: 'time',
          value: existingRecord?.scanIn ?? '',
        },
        {
          name: 'scanOut',
          label: 'Scan pulang',
          type: 'time',
          value: existingRecord?.scanOut ?? '',
        },
        {
          name: 'lateMinutes',
          label: 'Keterlambatan (menit)',
          type: 'number',
          value: existingRecord?.lateMinutes ?? 0,
          required: true,
        },
        {
          name: 'overtimeMinutes',
          label: 'Lembur (menit)',
          type: 'number',
          value: existingRecord?.overtimeMinutes ?? 0,
          required: true,
        },
        {
          name: 'reason',
          label: 'Alasan / Catatan koreksi (opsional)',
          type: 'textarea',
          required: false,
        },
      ]}
      onSubmit={async (form) => {
        const status = String(form.get('attendanceStatus')) as AttendanceStatus;
        const scanIn = String(form.get('scanIn')) || null;
        const scanOut = String(form.get('scanOut')) || null;
        const lateMinutes = Number(form.get('lateMinutes')) || 0;
        const overtimeMinutes = Number(form.get('overtimeMinutes')) || 0;
        const reason = String(form.get('reason') || '').trim();

        if (isExisting && existingRecord) {
          await execute({
            type: 'correct',
            recordId: existingRecord.id,
            expectedRevision: existingRecord.revision,
            reason: reason || 'Koreksi absensi',
            values: {
              attendanceStatus: status,
              scanIn,
              scanOut,
              lateMinutes,
              overtimeMinutes,
            },
          });
        } else {
          await execute({
            type: 'record_attendance',
            employeeId: employee.id,
            workDate: date,
            attendanceStatus: status,
            shiftId: shiftId || 1,
            scanIn: status === 'PRESENT' ? scanIn : null,
            scanOut: status === 'PRESENT' ? scanOut : null,
            reason: reason || 'Koreksi absensi',
          });
        }
      }}
    />
  );
}
