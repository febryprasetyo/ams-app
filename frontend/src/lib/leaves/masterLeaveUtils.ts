import type { MasterLeaveBalanceItem } from '../../types/leaves';

/**
 * Menghitung Hak Cuti Bersih:
 * Kuota Dasar - Potongan Cuti Bersama (tidak boleh negatif)
 */
export function calculateCleanQuota(baseQuota: number, collectiveLeaveDays: number): number {
  return Math.max(0, (Number(baseQuota) || 0) - (Number(collectiveLeaveDays) || 0));
}

/**
 * Menghitung Total Hak Cuti Aktif:
 * Hak Cuti Bersih + Kuota Carry Over (Bawaan tahun lalu)
 */
export function calculateTotalEntitlement(cleanAnnualQuota: number, carriedOverQuota: number): number {
  return (Number(cleanAnnualQuota) || 0) + (Number(carriedOverQuota) || 0);
}

/**
 * Menghitung Sisa Cuti:
 * Total Hak - Kuota Terpakai (tidak boleh negatif)
 */
export function calculateRemainingQuota(totalEntitlement: number, usedQuota: number): number {
  return Math.max(0, (Number(totalEntitlement) || 0) - (Number(usedQuota) || 0));
}

export type LeaveBalanceStatus = 'SAFE' | 'WARNING' | 'EXHAUSTED';

/**
 * Menentukan status visual sisa saldo:
 * - SAFE: >= 4 hari (Hijau)
 * - WARNING: 1 - 3 hari (Kuning)
 * - EXHAUSTED: <= 0 hari (Merah)
 */
export function getLeaveBalanceStatus(remainingQuota: number): LeaveBalanceStatus {
  const rem = Number(remainingQuota) || 0;
  if (rem >= 4) return 'SAFE';
  if (rem >= 1) return 'WARNING';
  return 'EXHAUSTED';
}

/**
 * Format jumlah hari dalam bahasa Indonesia baku
 */
export function formatIndoDays(days: number): string {
  return `${Number(days) || 0} Hari`;
}

export interface MasterLeaveFilterCriteria {
  search?: string;
  departmentId?: number | null;
  status?: 'ALL' | LeaveBalanceStatus;
}

/**
 * Filter reaktif untuk daftar saldo master cuti karyawan
 */
export function filterMasterLeaveBalances(
  balances: MasterLeaveBalanceItem[],
  criteria: MasterLeaveFilterCriteria
): MasterLeaveBalanceItem[] {
  const search = criteria.search?.trim().toLowerCase() || '';
  const deptId = criteria.departmentId;
  const status = criteria.status || 'ALL';

  return balances.filter((b) => {
    // Search filter: Nama atau NIP/Kode Karyawan
    if (search) {
      const matchName = b.fullName.toLowerCase().includes(search);
      const matchCode = b.employeeCode.toLowerCase().includes(search);
      if (!matchName && !matchCode) return false;
    }

    // Department filter
    if (deptId !== undefined && deptId !== null && b.departmentId !== deptId) {
      return false;
    }

    // Status filter
    if (status !== 'ALL') {
      const bStatus = getLeaveBalanceStatus(b.remainingQuota);
      if (bStatus !== status) return false;
    }

    return true;
  });
}
