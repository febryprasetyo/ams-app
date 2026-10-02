export type AttendanceCheck = 'clear' | 'has-history' | 'unavailable';

export function assessEmployeeDeletion(input: { attendanceCheck: AttendanceCheck }): { allowed: boolean; message?: string } {
  if (input.attendanceCheck === 'clear') return { allowed: true };
  if (input.attendanceCheck === 'has-history') {
    return { allowed: false, message: 'Karyawan tidak dapat dihapus karena memiliki riwayat absensi. Tandai sebagai Nonaktif atau Resign.' };
  }
  return { allowed: false, message: 'Riwayat absensi tidak dapat diverifikasi. Penghapusan permanen diblokir untuk melindungi data historis.' };
}

export async function getAttendanceDeletionCheck(_employeeId: number): Promise<AttendanceCheck> {
  return 'unavailable';
}
