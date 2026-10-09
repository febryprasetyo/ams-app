export type LeaveType = 'ANNUAL' | 'SPECIAL';

export type SpecialLeaveReason = 'Menikah' | 'Melahirkan' | 'Kematian' | 'Khitanan' | 'Lain-lain';

export type LeaveRequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type ApprovalStage = 'APPLICANT' | 'DIRECT_SUPERVISOR' | 'HRD' | 'HIGHER_SUPERVISOR';

export interface LeaveHistoryItem {
  no: number;
  description: string;
}

export interface EmployeeProfileSummary {
  id: number;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  joinDate: string | null;
}

export interface LeaveBalanceSummary {
  employee: EmployeeProfileSummary;
  year: number;
  baseQuota: number;              // 12
  collectiveLeaveDays: number;    // e.g. 10
  cleanAnnualQuota: number;       // 12 - 10 = 2
  usedQuota: number;              // 1
  availableBalance: number;       // 1
  historyItems: LeaveHistoryItem[];
}

export interface CalculateLeaveDurationInput {
  employeeId?: number;
  startDate: string;
  endDate: string;
}

export interface CalculateLeaveDurationOutput {
  durationDays: number;
  resumeWorkDate: string;
  isValid: boolean;
  workingDates: string[];
}

export interface LeaveRequestFormData {
  employeeId: number;
  leaveType: LeaveType;
  specialLeaveReason?: string;
  reason: string;
  startDate: string;
  endDate: string;
  durationDays: number;           // Input manual!
  resumeWorkDate?: string;        // Input manual atau rekomendasi
  handoverToEmployeeId?: number;
  handoverTask?: string;
  emergencyPhone?: string;
}

export interface LeaveApprovalItem {
  name: string;
  date: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface FullLeaveDocumentData {
  id: number;
  requestNumber: string;
  formNumber: string; // '001'
  revisionCode: string; // 'REV. 170208-1-W'
  createdAt: string;
  employee: EmployeeProfileSummary;
  balanceYear: number;
  baseQuota: number;
  collectiveLeaveDays: number;
  cleanAnnualQuota: number;
  historyItems: LeaveHistoryItem[];
  availableBefore: number;
  leaveDaysRequested: number;
  remainingAfter: number;
  leaveType: LeaveType;
  specialLeaveReason?: string | null;
  reason: string;
  startDate: string;
  endDate: string;
  resumeWorkDate: string;
  hrdNotes?: string;
  handover: {
    recipientId?: number | null;
    recipientName?: string;
    taskDescription?: string;
    emergencyPhone?: string;
  };
  approvals: {
    applicant: LeaveApprovalItem;
    directSupervisor: LeaveApprovalItem;
    hrd: LeaveApprovalItem;
    higherSupervisor: LeaveApprovalItem;
  };
}
