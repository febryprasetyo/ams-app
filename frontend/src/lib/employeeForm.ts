export type EmployeePayload = {
  [key: string]: string | number | null | undefined;
  employeeCode?: string | null;
  fullName?: string | null;
  barcode?: string | null;
  email?: string | null;
  departmentId?: number | null;
  employmentStatus?: string | null;
  status?: string | null;
  currency?: string | null;
  birthDate?: string | null;
  age?: string | null;
  joinDate?: string | null;
  lengthOfService?: string | null;
};

export function calculateTalentaDuration(
  startDateStr: string | null | undefined,
  referenceDate: Date = new Date()
): string {
  if (!startDateStr || typeof startDateStr !== 'string') return '';
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  const [y, m, d] = parts;
  const start = new Date(y, m - 1, d);
  if (isNaN(start.getTime())) return '';

  const end = new Date(referenceDate);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return '0 Year 0 Month 0 Day';
  }

  return `${years} Year ${months} Month ${days} Day`;
}

export function buildEmployeePayload(input: EmployeePayload): EmployeePayload {
  const payload: EmployeePayload = {};

  for (const [key, value] of Object.entries(input)) {
    payload[key as keyof EmployeePayload] = typeof value === 'string' && value.trim() === '' ? null : value as never;
  }

  const employeeCode = typeof payload.employeeCode === 'string' ? payload.employeeCode.trim() : '';
  payload.employeeCode = employeeCode;
  payload.fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : payload.fullName;
  payload.barcode = typeof payload.barcode === 'string' && payload.barcode.trim() ? payload.barcode.trim() : employeeCode;
  payload.status = payload.status || 'Active';
  payload.currency = payload.currency || 'IDR';

  if (payload.birthDate && !payload.age) {
    payload.age = calculateTalentaDuration(payload.birthDate);
  }

  if (payload.joinDate && !payload.lengthOfService) {
    payload.lengthOfService = calculateTalentaDuration(payload.joinDate);
  }

  return payload;
}
