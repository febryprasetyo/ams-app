'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { useAttendance } from './AttendanceWorkspace';
import { dateLabel } from '@/lib/attendance/domain';
import type { AttendanceRecord, AttendanceStatus, Employee } from '@/lib/attendance/types';
import { resolveEmployeeShift, type WorkShift } from '@/lib/attendance/scheduleShift';

interface RecordAttendanceDialogProps {
  employee: Employee;
  date: string;
  existingRecord?: AttendanceRecord | null;
  shift?: WorkShift;
  onClose: () => void;
}

export function RecordAttendanceDialog({
  employee,
  date,
  existingRecord,
  shift: propShift,
  onClose,
}: RecordAttendanceDialogProps) {
  const { data, execute } = useAttendance();
  const shift = propShift || resolveEmployeeShift(employee, data.shifts || [], data.shiftAssignments || []);

  const [status, setStatus] = useState<AttendanceStatus>(existingRecord?.attendanceStatus || 'SAKIT');
  const [scanIn, setScanIn] = useState(existingRecord?.scanIn || shift.scheduleIn || '08:00');
  const [scanOut, setScanOut] = useState(existingRecord?.scanOut || shift.scheduleOut || '17:00');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await execute({
        type: 'record_attendance',
        employeeId: employee.id,
        workDate: date,
        attendanceStatus: status,
        shiftId: shift.id,
        scanIn: status === 'PRESENT' ? scanIn : null,
        scanOut: status === 'PRESENT' ? scanOut : null,
        reason: reason.trim() || undefined, // Catatan/alasan bersifat opsional
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan absensi.');
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={existingRecord ? 'Koreksi Catatan Absensi' : 'Catat Kehadiran / Izin Karyawan'}
      subtitle={`${employee.fullName} (${employee.employeeCode || '-'}) · ${dateLabel(date)}`}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button type="button" className="hr-btn" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="button" className="hr-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-slate-700">
          <div>
            <span className="text-[11px] text-slate-500 block">Jadwal Shift yang Berlaku</span>
            <span className="font-bold text-slate-900">{shift.name}</span>
          </div>
          <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-white border border-slate-200">
            {shift.scheduleIn} – {shift.scheduleOut} ({shift.workDays} Hari)
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 block">Status Kehadiran / Keterangan</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { val: 'PRESENT', label: '🟢 Hadir Manual', desc: 'Isi jam masuk & pulang' },
              { val: 'SAKIT', label: '🟡 Sakit (S)', desc: 'Surat dokter / sakit' },
              { val: 'CUTI', label: '🔵 Cuti (C)', desc: 'Cuti tahunan / bersama' },
              { val: 'IZIN', label: '🟣 Izin (I)', desc: 'Izin keperluan resmi' },
              { val: 'ALPHA', label: '🔴 Mangkir (A)', desc: 'Tidak ada kabar' },
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => setStatus(item.val as AttendanceStatus)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  status === item.val
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs">{item.label}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {status === 'PRESENT' && (
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
            <span className="font-bold text-emerald-900 block text-xs">
              Waktu Scan Hadir Manual
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 block">
                <span className="font-semibold text-slate-700">Scan Masuk (Clock In)</span>
                <input
                  type="time"
                  required
                  value={scanIn}
                  onChange={e => setScanIn(e.target.value)}
                  className="hr-input w-full bg-white"
                />
              </label>
              <label className="space-y-1 block">
                <span className="font-semibold text-slate-700">Scan Pulang (Clock Out)</span>
                <input
                  type="time"
                  required
                  value={scanOut}
                  onChange={e => setScanOut(e.target.value)}
                  className="hr-input w-full bg-white"
                />
              </label>
            </div>
          </div>
        )}

        <label className="space-y-1 block">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Alasan / Catatan Tambahan</span>
            <span className="text-[11px] text-slate-400">Opsional (tidak wajib)</span>
          </div>
          <textarea
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Contoh: Sakit demam surat dokter terlampir, atau lupa scan pagi..."
            className="hr-input w-full"
          />
        </label>
      </form>
    </ModalShell>
  );
}
