'use client';

import { useAttendance } from './AttendanceWorkspace';
import { FormDialog } from './shared';
import { getScheduleForDate, resolveEmployeeShift } from '@/lib/attendance/scheduleShift';
import { dateLabel, statusLabels } from '@/lib/attendance/domain';
import type { AttendanceDayType, AttendanceRecord, AttendanceStatus, Employee } from '@/lib/attendance/types';

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
  const { data, execute } = useAttendance();
  const shift = data.shifts?.find(s => s.id === shiftId)
    ?? resolveEmployeeShift(employee, data.shifts || [], data.shiftAssignments || []);
  const isDayOff = existingRecord?.isDayOff ?? getScheduleForDate(date, shift).isDayOff;
  const initialDayType: AttendanceDayType = existingRecord?.attendanceStatus === 'DINAS_LUAR'
    ? 'DINAS_LUAR' : isDayOff ? 'DAY_OFF' : 'WORK_DAY';

  const isExisting = !!existingRecord;

  return (
    <FormDialog
      title="Koreksi absensi"
      description={`${employee.fullName} · ${dateLabel(date)}. Dinas Luar otomatis memakai jam masuk dan pulang dari jadwal shift karyawan; durasi keterlambatan, pulang awal, dan lembur menjadi nol.`}
      onClose={onClose}
      fields={[
        {
          name: 'dayType',
          label: 'Kategori hari',
          type: 'select',
          value: initialDayType,
          options: [
            { value: 'WORK_DAY', label: 'Hari kerja' },
            { value: 'DAY_OFF', label: 'Dayoff / Libur' },
            { value: 'DINAS_LUAR', label: 'Dinas Luar' },
          ],
        },
        {
          name: 'attendanceStatus',
          label: 'Status kehadiran',
          type: 'select',
          value: existingRecord?.attendanceStatus === 'DINAS_LUAR' ? 'PRESENT' : (existingRecord?.attendanceStatus || 'PRESENT'),
          options: Object.entries(statusLabels).filter(([value]) => value !== 'DINAS_LUAR').map(([value, label]) => ({ value, label })),
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
        const dayType = String(form.get('dayType')) as AttendanceDayType;
        const dayOff = dayType === 'DAY_OFF';
        const status = dayType === 'DINAS_LUAR' ? 'DINAS_LUAR' : String(form.get('attendanceStatus')) as AttendanceStatus;
        const cleanTime = (t: unknown) => {
          const s = String(t || '').trim();
          if (!s || s === '-') return null;
          return s.length >= 5 ? s.slice(0, 5) : s;
        };
        const scanIn = cleanTime(form.get('scanIn'));
        const scanOut = cleanTime(form.get('scanOut'));
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
              isDayOff: dayOff,
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
            shiftId: shift.id,
            isDayOff: dayOff,
            scanIn: status === 'PRESENT' ? scanIn : null,
            scanOut: status === 'PRESENT' ? scanOut : null,
            reason: reason || 'Koreksi absensi',
          });
        }
      }}
    />
  );
}
