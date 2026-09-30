import ExcelJS from 'exceljs';

export const TALENTA_HEADERS = [
  'Employee ID',
  'Full Name',
  'Barcode',
  'Organization',
  'Job Position',
  'Job Level',
  'Join Date',
  'Status Employee',
  'Email',
  'Birth Date',
  'Age',
  'Birth Place',
  'Citizen ID Address',
  'Residential Address',
  'NPWP',
  'PTKP Status',
  'Employee Tax Status',
  'Bank Name',
  'Bank Account',
  'Bank Account Holder',
  'BPJS Ketenagakerjaan',
  'BPJS Kesehatan',
  'NIK (NPWP 16 Digit)',
  'Mobile Phone',
  'Phone',
  'Religion',
  'Gender',
  'Marital Status',
  'Blood Type',
  'Nationality Code',
  'Currency',
  'Length Of Service',
  'NPWP 16 digit (new)',
];

export interface EmployeeImportRowData {
  rowNumber: number;
  employeeCode: string;
  fullName: string;
  barcode?: string | null;
  organization?: string | null;
  position?: string | null;
  jobLevel?: string | null;
  joinDate?: string | null;
  employmentStatus?: string | null;
  email: string;
  birthDate?: string | null;
  age?: string | null;
  birthPlace?: string | null;
  citizenIdAddress?: string | null;
  residentialAddress?: string | null;
  npwp?: string | null;
  ptkpStatus?: string | null;
  employeeTaxStatus?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankAccountHolder?: string | null;
  bpjsKetenagakerjaan?: string | null;
  bpjsKesehatan?: string | null;
  nikKtp?: string | null;
  mobilePhone?: string | null;
  secondaryPhone?: string | null;
  religion?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  bloodType?: string | null;
  nationalityCode?: string | null;
  currency?: string | null;
  lengthOfService?: string | null;
  npwp16Digit?: string | null;
}

export interface EmployeeImportLookups {
  existingEmployeeCodes: Set<string>;
  existingEmails: Set<string>;
  existingDepartmentNames: Set<string>;
}

export interface EmployeeImportSummary {
  totalRows: number;
  validCount: number;
  errorCount: number;
  newDepartmentsCount: number;
  newDepartments: string[];
}

export interface EmployeeImportValidationError {
  rowNumber: number;
  employeeCode?: string;
  field?: string;
  message: string;
}

export interface EmployeeImportPreviewResult {
  valid: boolean;
  summary: EmployeeImportSummary;
  errors: EmployeeImportValidationError[];
  previewRows: Array<EmployeeImportRowData & { isValid: boolean; errors: string[] }>;
}

export function normalizeHeader(val: string): string {
  if (!val) return '';
  return String(val).trim().toLowerCase().replace(/\s+/g, ' ');
}

export function formatDateValue(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    // Excel serial date to JS Date
    const utcDays = Math.floor(val - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

function cleanString(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val.text) {
    val = val.text;
  }
  const str = String(val).trim();
  return str.length > 0 ? str : null;
}

export async function parseEmployeeWorkbook(buffer: Buffer): Promise<EmployeeImportRowData[]> {
  const wb = new ExcelJS.Workbook();
  // @ts-ignore
  await wb.xlsx.load(buffer);

  const sheet = wb.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return [];
  }

  const headerRow = sheet.getRow(1);
  const headerMap: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const text = normalizeHeader(cell.text || String(cell.value || ''));
    if (text) {
      headerMap[text] = colNumber;
    }
  });

  const getCol = (normalizedName: string): number | undefined => headerMap[normalizedName];

  const colEmpId = getCol('employee id') || 1;
  const colFullName = getCol('full name') || 2;
  const colBarcode = getCol('barcode') || 3;
  const colOrg = getCol('organization') || 4;
  const colPosition = getCol('job position') || 5;
  const colJobLevel = getCol('job level') || 6;
  const colJoinDate = getCol('join date') || 7;
  const colStatus = getCol('status employee') || 8;
  const colEmail = getCol('email') || 9;
  const colBirthDate = getCol('birth date') || 10;
  const colAge = getCol('age') || 11;
  const colBirthPlace = getCol('birth place') || 12;
  const colCitizenIdAddr = getCol('citizen id address') || 13;
  const colResAddr = getCol('residential address') || 14;
  const colNpwp = getCol('npwp') || 15;
  const colPtkp = getCol('ptkp status') || 16;
  const colTaxStatus = getCol('employee tax status') || 17;
  const colBankName = getCol('bank name') || 18;
  const colBankAcc = getCol('bank account') || 19;
  const colBankHolder = getCol('bank account holder') || 20;
  const colBpjsTk = getCol('bpjs ketenagakerjaan') || 21;
  const colBpjsKes = getCol('bpjs kesehatan') || 22;
  const colNik = getCol('nik (npwp 16 digit)') || 23;
  const colMobile = getCol('mobile phone') || 24;
  const colPhone = getCol('phone') || 25;
  const colReligion = getCol('religion') || 26;
  const colGender = getCol('gender') || 27;
  const colMarital = getCol('marital status') || 28;
  const colBlood = getCol('blood type') || 29;
  const colNationality = getCol('nationality code') || 30;
  const colCurrency = getCol('currency') || 31;
  const colLengthService = getCol('length of service') || 32;
  const colNpwp16 = getCol('npwp 16 digit (new)') || 33;

  const rows: EmployeeImportRowData[] = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const empIdVal = cleanString(row.getCell(colEmpId).value);
    const fullNameVal = cleanString(row.getCell(colFullName).value);

    // If both Employee ID and Full Name are missing, skip row
    if (!empIdVal && !fullNameVal) continue;

    const rowData: EmployeeImportRowData = {
      rowNumber: r,
      employeeCode: empIdVal || '',
      fullName: fullNameVal || '',
      barcode: cleanString(row.getCell(colBarcode).value),
      organization: cleanString(row.getCell(colOrg).value),
      position: cleanString(row.getCell(colPosition).value),
      jobLevel: cleanString(row.getCell(colJobLevel).value),
      joinDate: formatDateValue(row.getCell(colJoinDate).value),
      employmentStatus: cleanString(row.getCell(colStatus).value),
      email: cleanString(row.getCell(colEmail).value) || '',
      birthDate: formatDateValue(row.getCell(colBirthDate).value),
      age: cleanString(row.getCell(colAge).value),
      birthPlace: cleanString(row.getCell(colBirthPlace).value),
      citizenIdAddress: cleanString(row.getCell(colCitizenIdAddr).value),
      residentialAddress: cleanString(row.getCell(colResAddr).value),
      npwp: cleanString(row.getCell(colNpwp).value),
      ptkpStatus: cleanString(row.getCell(colPtkp).value),
      employeeTaxStatus: cleanString(row.getCell(colTaxStatus).value),
      bankName: cleanString(row.getCell(colBankName).value),
      bankAccount: cleanString(row.getCell(colBankAcc).value),
      bankAccountHolder: cleanString(row.getCell(colBankHolder).value),
      bpjsKetenagakerjaan: cleanString(row.getCell(colBpjsTk).value),
      bpjsKesehatan: cleanString(row.getCell(colBpjsKes).value),
      nikKtp: cleanString(row.getCell(colNik).value),
      mobilePhone: cleanString(row.getCell(colMobile).value),
      secondaryPhone: cleanString(row.getCell(colPhone).value),
      religion: cleanString(row.getCell(colReligion).value),
      gender: cleanString(row.getCell(colGender).value),
      maritalStatus: cleanString(row.getCell(colMarital).value),
      bloodType: cleanString(row.getCell(colBlood).value),
      nationalityCode: cleanString(row.getCell(colNationality).value),
      currency: cleanString(row.getCell(colCurrency).value) || 'IDR',
      lengthOfService: cleanString(row.getCell(colLengthService).value),
      npwp16Digit: cleanString(row.getCell(colNpwp16).value),
    };

    rows.push(rowData);
  }

  return rows;
}

export function validateEmployeeImport(
  rows: EmployeeImportRowData[],
  lookups: EmployeeImportLookups
): EmployeeImportPreviewResult {
  const errors: EmployeeImportValidationError[] = [];
  const seenEmpCodes = new Set<string>();
  const seenEmails = new Set<string>();
  const newDeptsSet = new Set<string>();

  const previewRows: Array<EmployeeImportRowData & { isValid: boolean; errors: string[] }> = [];

  for (const row of rows) {
    const rowErrors: string[] = [];

    // 1. Employee Code validation
    if (!row.employeeCode) {
      rowErrors.push('Employee ID (NIK) is required');
      errors.push({
        rowNumber: row.rowNumber,
        field: 'Employee ID',
        message: 'Employee ID (NIK) wajib diisi',
      });
    } else {
      const codeKey = row.employeeCode.toUpperCase();
      if (seenEmpCodes.has(codeKey)) {
        rowErrors.push(`Employee ID "${row.employeeCode}" duplikat dalam file`);
        errors.push({
          rowNumber: row.rowNumber,
          employeeCode: row.employeeCode,
          field: 'Employee ID',
          message: `Employee ID "${row.employeeCode}" duplikat dalam file`,
        });
      } else if (lookups.existingEmployeeCodes.has(codeKey)) {
        rowErrors.push(`Employee ID "${row.employeeCode}" sudah terdaftar di database`);
        errors.push({
          rowNumber: row.rowNumber,
          employeeCode: row.employeeCode,
          field: 'Employee ID',
          message: `Employee ID "${row.employeeCode}" sudah terdaftar di database`,
        });
      } else {
        seenEmpCodes.add(codeKey);
      }
    }

    // 2. Full Name validation
    if (!row.fullName) {
      rowErrors.push('Full Name is required');
      errors.push({
        rowNumber: row.rowNumber,
        employeeCode: row.employeeCode,
        field: 'Full Name',
        message: 'Nama lengkap karyawan wajib diisi',
      });
    }

    // 3. Email validation
    if (!row.email) {
      rowErrors.push('Email is required');
      errors.push({
        rowNumber: row.rowNumber,
        employeeCode: row.employeeCode,
        field: 'Email',
        message: 'Email karyawan wajib diisi',
      });
    } else {
      const emailLower = row.email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        rowErrors.push(`Format email "${row.email}" tidak valid`);
        errors.push({
          rowNumber: row.rowNumber,
          employeeCode: row.employeeCode,
          field: 'Email',
          message: `Format email "${row.email}" tidak valid`,
        });
      } else if (seenEmails.has(emailLower)) {
        rowErrors.push(`Email "${row.email}" duplikat dalam file`);
        errors.push({
          rowNumber: row.rowNumber,
          employeeCode: row.employeeCode,
          field: 'Email',
          message: `Email "${row.email}" duplikat dalam file`,
        });
      } else if (lookups.existingEmails.has(emailLower)) {
        rowErrors.push(`Email "${row.email}" sudah terdaftar di database`);
        errors.push({
          rowNumber: row.rowNumber,
          employeeCode: row.employeeCode,
          field: 'Email',
          message: `Email "${row.email}" sudah terdaftar di database`,
        });
      } else {
        seenEmails.add(emailLower);
      }
    }

    // 4. Department / Organization inspection
    if (row.organization) {
      const orgUpper = row.organization.trim().toUpperCase();
      let exists = false;
      for (const d of lookups.existingDepartmentNames) {
        if (d.trim().toUpperCase() === orgUpper) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        newDeptsSet.add(row.organization.trim());
      }
    }

    const isValid = rowErrors.length === 0;
    previewRows.push({
      ...row,
      isValid,
      errors: rowErrors,
    });
  }

  const validCount = previewRows.filter((r) => r.isValid).length;
  const errorCount = previewRows.filter((r) => !r.isValid).length;
  const newDepartments = Array.from(newDeptsSet);

  return {
    valid: errorCount === 0,
    summary: {
      totalRows: rows.length,
      validCount,
      errorCount,
      newDepartmentsCount: newDepartments.length,
      newDepartments,
    },
    errors,
    previewRows,
  };
}

export async function buildEmployeeImportTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Worksheet');

  sheet.columns = TALENTA_HEADERS.map((h) => ({
    header: h,
    key: h,
    width: Math.max(h.length + 4, 15),
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate-800
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;

  // Add dummy sample rows
  sheet.addRow({
    'Employee ID': '30001',
    'Full Name': 'JOHN DOE',
    'Barcode': '30001',
    'Organization': 'IT INFRASTRUCTURE',
    'Job Position': 'SYSTEM ADMINISTRATOR',
    'Job Level': 'Staff',
    'Join Date': '2022-01-10',
    'Status Employee': 'Permanent',
    'Email': 'john.doe@company.com',
    'Birth Date': '1992-05-15',
    'Age': '32 Year 4 Month 15 Day',
    'Birth Place': 'Jakarta',
    'Citizen ID Address': 'Jl. Sudirman No. 1, Jakarta Selatan',
    'Residential Address': 'Jl. Sudirman No. 1, Jakarta Selatan',
    'NPWP': '01.234.567.8-901.000',
    'PTKP Status': 'TK/0',
    'Employee Tax Status': 'Pegawai Tetap',
    'Bank Name': 'BCA',
    'Bank Account': '1234567890',
    'Bank Account Holder': 'JOHN DOE',
    'BPJS Ketenagakerjaan': '00012345678',
    'BPJS Kesehatan': '00087654321',
    'NIK (NPWP 16 Digit)': '3171010101920001',
    'Mobile Phone': '081234567890',
    'Phone': '0215551234',
    'Religion': 'Islam',
    'Gender': 'Male',
    'Marital Status': 'Single',
    'Blood Type': 'O',
    'Nationality Code': 'ID',
    'Currency': 'IDR',
    'Length Of Service': '4 Year 8 Month 20 Day',
    'NPWP 16 digit (new)': '3171010101920001',
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
