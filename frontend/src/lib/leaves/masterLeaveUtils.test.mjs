import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCleanQuota,
  calculateTotalEntitlement,
  calculateRemainingQuota,
  getLeaveBalanceStatus,
  formatIndoDays,
  filterMasterLeaveBalances,
} from './masterLeaveUtils.ts';

describe('Master Leave Utilities & Calculations', () => {
  test('calculateCleanQuota deducts collective leave without negative overflow', () => {
    assert.strictEqual(calculateCleanQuota(12, 10), 2);
    assert.strictEqual(calculateCleanQuota(12, 12), 0);
    assert.strictEqual(calculateCleanQuota(12, 14), 0);
    assert.strictEqual(calculateCleanQuota(15, 5), 10);
  });

  test('calculateTotalEntitlement combines clean annual quota and carry forward', () => {
    assert.strictEqual(calculateTotalEntitlement(2, 3), 5);
    assert.strictEqual(calculateTotalEntitlement(0, 0), 0);
    assert.strictEqual(calculateTotalEntitlement(10, 0), 10);
  });

  test('calculateRemainingQuota computes available days without negative overflow', () => {
    assert.strictEqual(calculateRemainingQuota(5, 2), 3);
    assert.strictEqual(calculateRemainingQuota(5, 5), 0);
    assert.strictEqual(calculateRemainingQuota(5, 7), 0);
  });

  test('getLeaveBalanceStatus categorizes SAFE (>=4), WARNING (1-3), EXHAUSTED (0)', () => {
    assert.strictEqual(getLeaveBalanceStatus(10), 'SAFE');
    assert.strictEqual(getLeaveBalanceStatus(4), 'SAFE');
    assert.strictEqual(getLeaveBalanceStatus(3), 'WARNING');
    assert.strictEqual(getLeaveBalanceStatus(1), 'WARNING');
    assert.strictEqual(getLeaveBalanceStatus(0), 'EXHAUSTED');
    assert.strictEqual(getLeaveBalanceStatus(-1), 'EXHAUSTED');
  });

  test('formatIndoDays formats number with Hari suffix', () => {
    assert.strictEqual(formatIndoDays(12), '12 Hari');
    assert.strictEqual(formatIndoDays(0), '0 Hari');
  });

  test('filterMasterLeaveBalances filters by search, department, and balance status correctly', () => {
    const sampleBalances = [
      {
        balanceId: 1,
        employeeId: 101,
        employeeCode: 'EMP-001',
        fullName: 'Budi Santoso',
        department: 'Information Technology',
        departmentId: 10,
        position: 'Software Engineer',
        year: 2026,
        baseQuota: 12,
        collectiveLeaveDeduction: 10,
        cleanAnnualQuota: 2,
        carriedOverQuota: 4,
        totalEntitlement: 6,
        usedQuota: 1,
        remainingQuota: 5,
        isCustomQuota: false,
        isCustomCarryForward: false,
      },
      {
        balanceId: 2,
        employeeId: 102,
        employeeCode: 'EMP-002',
        fullName: 'Siti Aminah',
        department: 'Finance',
        departmentId: 20,
        position: 'Accountant',
        year: 2026,
        baseQuota: 12,
        collectiveLeaveDeduction: 10,
        cleanAnnualQuota: 2,
        carriedOverQuota: 0,
        totalEntitlement: 2,
        usedQuota: 0,
        remainingQuota: 2,
        isCustomQuota: false,
        isCustomCarryForward: false,
      },
      {
        balanceId: 3,
        employeeId: 103,
        employeeCode: 'EMP-003',
        fullName: 'Ahmad Fauzi',
        department: 'Information Technology',
        departmentId: 10,
        position: 'DevOps',
        year: 2026,
        baseQuota: 12,
        collectiveLeaveDeduction: 10,
        cleanAnnualQuota: 2,
        carriedOverQuota: 0,
        totalEntitlement: 2,
        usedQuota: 2,
        remainingQuota: 0,
        isCustomQuota: true,
        isCustomCarryForward: false,
      },
    ];

    // Search by name
    const byName = filterMasterLeaveBalances(sampleBalances, { search: 'budi' });
    assert.strictEqual(byName.length, 1);
    assert.strictEqual(byName[0].fullName, 'Budi Santoso');

    // Search by NIP/code
    const byCode = filterMasterLeaveBalances(sampleBalances, { search: 'emp-002' });
    assert.strictEqual(byCode.length, 1);
    assert.strictEqual(byCode[0].employeeCode, 'EMP-002');

    // Filter by department
    const byDept = filterMasterLeaveBalances(sampleBalances, { departmentId: 10 });
    assert.strictEqual(byDept.length, 2);

    // Filter by status WARNING (1-3)
    const byWarning = filterMasterLeaveBalances(sampleBalances, { status: 'WARNING' });
    assert.strictEqual(byWarning.length, 1);
    assert.strictEqual(byWarning[0].fullName, 'Siti Aminah');

    // Filter by status EXHAUSTED (0)
    const byExhausted = filterMasterLeaveBalances(sampleBalances, { status: 'EXHAUSTED' });
    assert.strictEqual(byExhausted.length, 1);
    assert.strictEqual(byExhausted[0].fullName, 'Ahmad Fauzi');

    // Filter combined
    const combined = filterMasterLeaveBalances(sampleBalances, {
      search: 'ahmad',
      departmentId: 10,
      status: 'EXHAUSTED',
    });
    assert.strictEqual(combined.length, 1);
    assert.strictEqual(combined[0].fullName, 'Ahmad Fauzi');
  });
});
