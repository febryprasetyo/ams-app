export const LIFECYCLE_STATUSES = ['Active', 'Inactive', 'Resigned'] as const;

export type LifecycleStatus = typeof LIFECYCLE_STATUSES[number];

export interface EmployeeInput {
  employeeCode?: string;
  barcode?: string | null;
  email?: string | null;
  status?: string | null;
  birthDate?: string | null;
  age?: string | null;
  joinDate?: string | null;
  lengthOfService?: string | null;
  [key: string]: unknown;
}

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

export function isLifecycleStatus(value: string): value is LifecycleStatus {
  return (LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function normalizeEmployeeInput<T extends EmployeeInput>(input: T): T {
  const normalized = { ...input } as T;

  for (const [key, value] of Object.entries(normalized)) {
    if (key !== 'employeeCode' && key !== 'fullName' && typeof value === 'string' && value.trim() === '') {
      normalized[key as keyof T] = null as T[keyof T];
    }
  }

  if (typeof normalized.employeeCode === 'string' && normalized.barcode === null) {
    normalized.barcode = normalized.employeeCode;
  }

  if (normalized.birthDate && !normalized.age) {
    normalized.age = calculateTalentaDuration(normalized.birthDate as string);
  }

  if (normalized.joinDate && !normalized.lengthOfService) {
    normalized.lengthOfService = calculateTalentaDuration(normalized.joinDate as string);
  }

  return normalized;
}
