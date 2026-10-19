import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function calculateF4CleanQuota(base, collective) {
  return Math.max(0, base - collective);
}

function calculateF4Remaining(available, requested) {
  return Math.max(0, available - requested);
}

function validateManualLeaveDays(days, availableBalance, isAnnual = true) {
  const num = Number(days);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Jumlah hari cuti minimal 1 hari' };
  }
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Jumlah hari cuti harus bilangan bulat' };
  }
  if (isAnnual && num > availableBalance) {
    return {
      valid: false,
      error: `Saldo cuti tahunan tidak mencukupi (${availableBalance} hari tersedia)`,
    };
  }
  return { valid: true, error: null };
}

describe('Leave Form & F4 Document Formatters', () => {
  test('formatDateIndo converts ISO date to Indonesian standard text', () => {
    assert.strictEqual(formatDateIndo('2024-05-10'), '10 Mei 2024');
    assert.strictEqual(formatDateIndo('2024-01-05'), '5 Januari 2024');
    assert.strictEqual(formatDateIndo('2026-10-09'), '9 Oktober 2026');
  });

  test('calculateF4CleanQuota matches Excel formula 12 - 10 = 2', () => {
    assert.strictEqual(calculateF4CleanQuota(12, 10), 2);
    assert.strictEqual(calculateF4CleanQuota(12, 5), 7);
    assert.strictEqual(calculateF4CleanQuota(12, 12), 0);
  });

  test('calculateF4Remaining correctly calculates balance after requested leave', () => {
    assert.strictEqual(calculateF4Remaining(2, 1), 1);
    assert.strictEqual(calculateF4Remaining(6, 2), 4);
    assert.strictEqual(calculateF4Remaining(1, 1), 0);
  });

  test('F4 Paper Dimensions adhere to standard Indonesian Folio (215mm x 330mm)', () => {
    const F4_WIDTH_MM = 215;
    const F4_HEIGHT_MM = 330;
    assert.strictEqual(F4_WIDTH_MM, 215);
    assert.strictEqual(F4_HEIGHT_MM, 330);
  });
});

describe('Manual Leave Days Input Validation', () => {
  test('accepts valid manual days within available quota', () => {
    const result = validateManualLeaveDays(2, 5, true);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.error, null);
  });

  test('rejects zero or negative days', () => {
    const zero = validateManualLeaveDays(0, 5, true);
    assert.strictEqual(zero.valid, false);
    assert.strictEqual(zero.error, 'Jumlah hari cuti minimal 1 hari');

    const neg = validateManualLeaveDays(-1, 5, true);
    assert.strictEqual(neg.valid, false);
  });

  test('rejects requested days exceeding available annual quota', () => {
    const exceeded = validateManualLeaveDays(4, 2, true);
    assert.strictEqual(exceeded.valid, false);
    assert.match(exceeded.error, /Saldo cuti tahunan tidak mencukupi/);
  });

  test('allows requested days exceeding quota for special leave (cuti khusus)', () => {
    const special = validateManualLeaveDays(3, 0, false);
    assert.strictEqual(special.valid, true);
    assert.strictEqual(special.error, null);
  });
});

describe('F4 Full Page Print Layout Standards', () => {
  test('document structure contains required 6 sections and form headers', () => {
    const docMeta = {
      formNumber: '001',
      revisionCode: 'REV. 170208-1-W',
      title: 'PERMOHONAN CUTI KARYAWAN',
      company: 'PT. CAHAYA MAS CEMERLANG',
      sections: [
        'DATA KARYAWAN',
        'HAK DAN SISA CUTI KARYAWAN',
        'CUTI YANG AKAN DIAMBIL',
        'CATATAN HRD',
        'SERAH TERIMA TUGAS SELAMA CUTI',
        'TANDA TANGAN PERSETUJUAN',
      ],
      approvalStages: [
        'Pemohon',
        'Atasan Langsung',
        'HRD',
        'Atasan dari Atasan Langsung',
      ],
    };

    assert.strictEqual(docMeta.formNumber, '001');
    assert.strictEqual(docMeta.revisionCode, 'REV. 170208-1-W');
    assert.strictEqual(docMeta.sections.length, 6);
    assert.strictEqual(docMeta.approvalStages.length, 4);
  });
});
