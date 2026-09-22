export interface TicketCategory {
  id: number;
  code?: string;
  name: string;
  description?: string;
}

export interface AssetItem {
  id: number;
  assetCode: string;
  name: string;
}

export interface EmployeeItem {
  id: number;
  employeeCode?: string;
  fullName: string;
  email?: string;
}

export interface TechnicianItem {
  id: number;
  name: string;
  email?: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  commentText: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ITTicket {
  id: number;
  ticketCode: string;
  type: string; // 'Incident' | 'Request'
  subject: string;
  title?: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  reporterId: number;
  reporterName?: string;
  reporterEmployeeName?: string;
  reporterEmail?: string;
  assigneeId?: number | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  assetId?: number | null;
  assetCode?: string | null;
  assetName?: string | null;
  dueAt?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketDetail extends ITTicket {
  comments?: TicketComment[];
}
