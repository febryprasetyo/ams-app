import { test } from 'node:test';
import assert from 'node:assert';
import {
  calculateLeaveWorkingDays,
  calculateLeaveBalances,
  formatLeaveRequestNumber,
} from './leaveCalculation';

test('calculateLeaveWorkingDays correctly excludes weekends and collective leave holidays', () => {
  // Misal dari Jumat 10 Mei 2024 s/d Sabtu 11 Mei 2024:
  // Jumat = hari kerja (1 hari)
  // Sabtu = weekend (0 hari)
  // Total = 1 hari kerja
  // Resume work date: Senin 13 Mei 2024
  const holidays = ['2024-05-01']; // May day
  const result = calculateLeaveWorkingDays({
    startDate: '2024-05-10',
    endDate: '2024-05-11',
    holidayDates: holidays,
  });

  assert.strictEqual(result.durationDays, 1);
  assert.strictEqual(result.resumeWorkDate, '2024-05-13');
  assert.strictEqual(result.isValid, true);
});

test('calculateLeaveWorkingDays handles mid-week collective holidays and finds next working day', () => {
  // Rentang 2024-04-08 (Senin) s/d 2024-04-12 (Jumat)
  // Misal 10 & 11 April adalah Idul Fitri (Holidays)
  const holidays = ['2024-04-10', '2024-04-11'];
  const result = calculateLeaveWorkingDays({
    startDate: '2024-04-08',
    endDate: '2024-04-12',
    holidayDates: holidays,
  });

  // Total kerja: Senin(1) + Selasa(1) + Rabu(libur) + Kamis(libur) + Jumat(1) = 3 hari kerja
  assert.strictEqual(result.durationDays, 3);
  // Hari kerja berikutnya setelah Jumat 12 April adalah Senin 15 April
  assert.strictEqual(result.resumeWorkDate, '2024-04-15');
});

test('calculateLeaveBalances correctly calculates clean annual quota and remaining balance', () => {
  // Sesuai contoh pada FORM_CUTI_2024_(Office).xlsx:
  // Hak dasar = 12
  // Cuti bersama = 10
  // Bersih = 12 - 10 = 2 hari
  // Cuti yang sudah diambil sebelumnya = 0 (atau 0 cuti tahunan mandiri)
  // Cuti yang akan diambil sekarang = 1 hari
  // Sisa hak cuti setelah dikurangi = 1 hari
  const balance = calculateLeaveBalances({
    baseQuota: 12,
    collectiveLeaveDays: 10,
    usedQuota: 0,
    carriedOverQuota: 0,
    requestedDays: 1,
  });

  assert.strictEqual(balance.cleanAnnualQuota, 2);
  assert.strictEqual(balance.availableBefore, 2);
  assert.strictEqual(balance.remainingAfter, 1);
  assert.strictEqual(balance.hasSufficientBalance, true);
});

test('calculateLeaveBalances flags insufficient balance when requested days exceed available quota', () => {
  const balance = calculateLeaveBalances({
    baseQuota: 12,
    collectiveLeaveDays: 10,
    usedQuota: 2,
    carriedOverQuota: 0,
    requestedDays: 1,
  });

  assert.strictEqual(balance.cleanAnnualQuota, 2);
  assert.strictEqual(balance.availableBefore, 0);
  assert.strictEqual(balance.remainingAfter, 0);
  assert.strictEqual(balance.hasSufficientBalance, false);
});

test('formatLeaveRequestNumber formats sequence into LV-YYYYMM-XXXX', () => {
  const code = formatLeaveRequestNumber(new Date('2024-05-10'), 1);
  assert.strictEqual(code, 'LV-202405-0001');

  const code2 = formatLeaveRequestNumber(new Date('2026-10-09'), 42);
  assert.strictEqual(code2, 'LV-202610-0042');
});
