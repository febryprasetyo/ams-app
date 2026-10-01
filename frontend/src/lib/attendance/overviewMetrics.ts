import type { AttendanceDataset, AttendanceRecord, Employee } from './types';

export interface OverviewMetrics {
  totalActiveEmployees: number;
  presentCount: number;
  presentRate: number; // e.g. 94.2
  onTimeCount: number;
  lateCount: number;
  totalLateMinutes: number;
  earlyCount: number;
  totalEarlyMinutes: number;
  overtimeCount: number;
  totalOvertimeMinutes: number;
  missingScanCount: number;
  leaveCount: number;
  alphaCount: number;
}

export interface ActionablePriorityItem {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  type: 'LATE' | 'MISSING_SCAN';
  badgeLabel: string;
  description: string;
  recordId?: number;
  lateMinutes?: number;
}

export interface DepartmentPresenceSummary {
  id: number;
  name: string;
  activeCount: number;
  presentCount: number;
  rate: number;
}

export function calculateOverviewMetrics(
  dataset: AttendanceDataset,
  targetDate: string
): OverviewMetrics {
  const employees = dataset.employees || [];
  const activeEmployees = employees.filter(e => e.isActive);
  const activeEmpIds = new Set(activeEmployees.map(e => e.id));

  const records = (dataset.records || []).filter(
    r => r.workDate === targetDate && activeEmpIds.has(r.employeeId)
  );

  const presentRecords = records.filter(
    r => r.attendanceStatus === 'PRESENT' && !r.isDayOff
  );
  const presentCount = presentRecords.length;
  const totalActiveEmployees = activeEmployees.length;

  const presentRate = totalActiveEmployees > 0
    ? Math.round((presentCount / totalActiveEmployees) * 1000) / 10
    : 0;

  const onTimeRecords = presentRecords.filter(r => (r.lateMinutes || 0) === 0);
  const onTimeCount = onTimeRecords.length;

  const lateRecords = records.filter(r => (r.lateMinutes || 0) > 0);
  const lateCount = lateRecords.length;
  const totalLateMinutes = lateRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);

  const earlyRecords = records.filter(r => (r.earlyMinutes || 0) > 0);
  const earlyCount = earlyRecords.length;
  const totalEarlyMinutes = earlyRecords.reduce((sum, r) => sum + (r.earlyMinutes || 0), 0);

  const overtimeRecords = records.filter(r => (r.overtimeMinutes || 0) > 0);
  const overtimeCount = overtimeRecords.length;
  const totalOvertimeMinutes = overtimeRecords.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

  const missingScanRecords = records.filter(
    r => !r.isDayOff && (
      (Boolean(r.scanIn) && !r.scanOut) ||
      (!r.scanIn && Boolean(r.scanOut)) ||
      (r.normalized && !r.rawScanIn)
    )
  );
  const missingScanCount = missingScanRecords.length;

  const leaveRecords = records.filter(r =>
    ['CUTI', 'IZIN', 'SAKIT'].includes(r.attendanceStatus)
  );
  const leaveCount = leaveRecords.length;

  const recordedEmpIds = new Set(records.map(r => r.employeeId));
  const unrecordedCount = activeEmployees.filter(e => !recordedEmpIds.has(e.id)).length;
  const alphaRecords = records.filter(r => r.attendanceStatus === 'ALPHA');
  const alphaCount = unrecordedCount + alphaRecords.length;

  return {
    totalActiveEmployees,
    presentCount,
    presentRate,
    onTimeCount,
    lateCount,
    totalLateMinutes,
    earlyCount,
    totalEarlyMinutes,
    overtimeCount,
    totalOvertimeMinutes,
    missingScanCount,
    leaveCount,
    alphaCount,
  };
}

export function getActionablePriorities(
  dataset: AttendanceDataset,
  targetDate: string,
  limit = 5
): ActionablePriorityItem[] {
  const activeEmployees = (dataset.employees || []).filter(e => e.isActive);
  const empMap = new Map<number, Employee>(activeEmployees.map(e => [e.id, e]));
  const deptMap = new Map<number, string>((dataset.departments || []).map(d => [d.id, d.name]));

  const records = (dataset.records || []).filter(
    r => r.workDate === targetDate && empMap.has(r.employeeId)
  );

  const items: ActionablePriorityItem[] = [];

  // 1. Keterlambatan (diurutkan dari durasi terlambat terbesar)
  const lateRecords = records
    .filter(r => (r.lateMinutes || 0) > 0)
    .sort((a, b) => (b.lateMinutes || 0) - (a.lateMinutes || 0));

  for (const r of lateRecords) {
    const emp = empMap.get(r.employeeId);
    if (!emp) continue;
    const hours = Math.floor(r.lateMinutes / 60);
    const mins = r.lateMinutes % 60;
    const durText = hours > 0 ? `${hours}j ${mins}m` : `${mins} menit`;

    items.push({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      departmentName: deptMap.get(emp.departmentId) || 'Umum',
      type: 'LATE',
      badgeLabel: 'Terlambat',
      description: `Terlambat ${durText} (Masuk ${r.scanIn || '—'})`,
      recordId: r.id,
      lateMinutes: r.lateMinutes,
    });
  }

  // 2. Missing Scan (Scan Masuk ada tapi Scan Pulang belum ada)
  const missingScanRecords = records.filter(
    r => !r.isDayOff && (
      (Boolean(r.scanIn) && !r.scanOut) ||
      (r.normalized && !r.rawScanIn)
    )
  );

  for (const r of missingScanRecords) {
    const emp = empMap.get(r.employeeId);
    if (!emp) continue;

    // Hindari duplikasi jika karyawan sudah masuk di daftar keterlambatan
    if (items.some(it => it.employeeId === emp.id)) continue;

    const desc = r.scanIn && !r.scanOut
      ? `Scan masuk ${r.scanIn}, belum ada scan pulang`
      : 'Catatan scan tidak lengkap (perlu verifikasi)';

    items.push({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      departmentName: deptMap.get(emp.departmentId) || 'Umum',
      type: 'MISSING_SCAN',
      badgeLabel: 'Scan Tidak Lengkap',
      description: desc,
      recordId: r.id,
    });
  }

  return items.slice(0, limit);
}

export function getDepartmentPresenceSummary(
  dataset: AttendanceDataset,
  targetDate: string
): DepartmentPresenceSummary[] {
  const departments = (dataset.departments || []).filter(d => d.isActive);
  const activeEmployees = (dataset.employees || []).filter(e => e.isActive);
  const records = (dataset.records || []).filter(r => r.workDate === targetDate);
  const recordMap = new Map<number, AttendanceRecord>(records.map(r => [r.employeeId, r]));

  const summary: DepartmentPresenceSummary[] = [];

  for (const dept of departments) {
    const deptEmployees = activeEmployees.filter(e => e.departmentId === dept.id);
    if (deptEmployees.length === 0) continue;

    let present = 0;
    for (const emp of deptEmployees) {
      const rec = recordMap.get(emp.id);
      if (rec && rec.attendanceStatus === 'PRESENT' && !rec.isDayOff) {
        present++;
      }
    }

    const rate = Math.round((present / deptEmployees.length) * 1000) / 10;
    summary.push({
      id: dept.id,
      name: dept.name,
      activeCount: deptEmployees.length,
      presentCount: present,
      rate,
    });
  }

  return summary;
}

export function getTimeBasedGreeting(userName?: string, hour?: number): string {
  let h = hour;
  if (h === undefined) {
    try {
      const nowJakarta = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        hour12: false,
      }).format(new Date());
      h = parseInt(nowJakarta, 10);
    } catch {
      h = new Date().getHours();
    }
  }

  let salam = 'Pagi';
  if (h >= 11 && h < 15) {
    salam = 'Siang';
  } else if (h >= 15 && h < 18) {
    salam = 'Sore';
  } else if (h >= 18 || h < 4) {
    salam = 'Malam';
  }

  const cleanName = (userName || '').trim();
  return cleanName ? `${salam}, ${cleanName} 👋` : `${salam} 👋`;
}

export function formatJakartaDate(dateStr?: string): string {
  if (!dateStr) return 'Hari ini';

  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(date);
  } catch {
    return dateStr;
  }
}
