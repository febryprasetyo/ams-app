import { eq } from 'drizzle-orm';
import { db } from '../db';
import { attendanceRecords } from '../db/schema/attendance';

export type AttendanceCheck = 'clear' | 'has-history' | 'unavailable';

export function assessEmployeeDeletion(input: { attendanceCheck: AttendanceCheck }): { allowed: boolean; message?: string } {
  if (input.attendanceCheck === 'clear') return { allowed: true };
  if (input.attendanceCheck === 'has-history') {
    return { allowed: false, message: 'Karyawan tidak dapat dihapus karena memiliki riwayat absensi. Tandai sebagai Nonaktif atau Resign.' };
  }
  return { allowed: false, message: 'Riwayat absensi tidak dapat diverifikasi. Penghapusan permanen diblokir untuk melindungi data historis.' };
}

export async function getAttendanceDeletionCheck(employeeId: number, runner: any = db): Promise<AttendanceCheck> {
  try {
    const rows = await runner
      .select({ id: attendanceRecords.id })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.employeeId, employeeId))
      .limit(1);
    return rows.length > 0 ? 'has-history' : 'clear';
  } catch {
    return 'unavailable';
  }
}
