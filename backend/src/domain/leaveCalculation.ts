export interface CalculateLeaveWorkingDaysInput {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  holidayDates?: string[]; // Array of YYYY-MM-DD that are holidays or collective leave
}

export interface CalculateLeaveWorkingDaysOutput {
  durationDays: number;
  resumeWorkDate: string;
  isValid: boolean;
  workingDates: string[];
}

export interface CalculateLeaveBalancesInput {
  baseQuota: number;
  collectiveLeaveDays: number;
  usedQuota: number;
  carriedOverQuota?: number;
  requestedDays: number;
}

export interface CalculateLeaveBalancesOutput {
  cleanAnnualQuota: number;
  availableBefore: number;
  remainingAfter: number;
  hasSufficientBalance: boolean;
}

function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isWeekendOrHoliday(date: Date, holidaySet: Set<string>): boolean {
  const dayOfWeek = date.getUTCDay();
  // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  const dateKey = formatDateOnly(date);
  return holidaySet.has(dateKey);
}

export function calculateLeaveWorkingDays(input: CalculateLeaveWorkingDaysInput): CalculateLeaveWorkingDaysOutput {
  const start = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);
  const holidaySet = new Set(input.holidayDates || []);

  if (start.getTime() > end.getTime()) {
    return {
      durationDays: 0,
      resumeWorkDate: input.startDate,
      isValid: false,
      workingDates: [],
    };
  }

  const workingDates: string[] = [];
  const current = new Date(start.getTime());

  while (current.getTime() <= end.getTime()) {
    if (!isWeekendOrHoliday(current, holidaySet)) {
      workingDates.push(formatDateOnly(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Find next working day after end
  const nextWork = new Date(end.getTime());
  nextWork.setUTCDate(nextWork.getUTCDate() + 1);
  while (isWeekendOrHoliday(nextWork, holidaySet)) {
    nextWork.setUTCDate(nextWork.getUTCDate() + 1);
  }

  return {
    durationDays: workingDates.length,
    resumeWorkDate: formatDateOnly(nextWork),
    isValid: true,
    workingDates,
  };
}

export function calculateLeaveBalances(input: CalculateLeaveBalancesInput): CalculateLeaveBalancesOutput {
  const carried = input.carriedOverQuota || 0;
  const cleanAnnualQuota = Math.max(0, input.baseQuota - input.collectiveLeaveDays);
  const availableBefore = Math.max(0, cleanAnnualQuota + carried - input.usedQuota);
  const remainingAfter = Math.max(0, availableBefore - input.requestedDays);
  const hasSufficientBalance = availableBefore >= input.requestedDays;

  return {
    cleanAnnualQuota,
    availableBefore,
    remainingAfter,
    hasSufficientBalance,
  };
}

export function formatLeaveRequestNumber(date: Date, sequenceNumber: number): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return `LV-${year}${month}-${seq}`;
}
