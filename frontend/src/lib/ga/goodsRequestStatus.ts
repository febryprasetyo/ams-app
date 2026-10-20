export type GoodsRequestStatus =
  | 'draft'
  | 'ready_to_print'
  | 'pending_signature'
  | 'approved_manually'
  | 'processing'
  | 'completed'
  | 'cancelled';

export const STATUS_LABELS: Record<GoodsRequestStatus, string> = {
  draft: 'Draft',
  ready_to_print: 'Siap Cetak',
  pending_signature: 'Menunggu Tanda Tangan',
  approved_manually: 'Persetujuan Manual Lengkap',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const ALLOWED_STATUS_TRANSITIONS: Record<GoodsRequestStatus, GoodsRequestStatus[]> = {
  draft: ['ready_to_print', 'cancelled'],
  ready_to_print: ['pending_signature', 'draft', 'cancelled'],
  pending_signature: ['approved_manually', 'draft', 'cancelled'],
  approved_manually: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function getStatusLabel(status: GoodsRequestStatus): string {
  return STATUS_LABELS[status] || status;
}

export function getAllowedTransitions(currentStatus: GoodsRequestStatus): GoodsRequestStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
}

export interface StatusBadgeConfig {
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export function getStatusBadgeConfig(status: GoodsRequestStatus): StatusBadgeConfig {
  switch (status) {
    case 'approved_manually':
    case 'completed':
      return {
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        borderClass: 'border-emerald-200 dark:border-emerald-800/60',
        dotClass: 'bg-emerald-500',
      };
    case 'pending_signature':
      return {
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        textClass: 'text-amber-700 dark:text-amber-300',
        borderClass: 'border-amber-200 dark:border-amber-800/60',
        dotClass: 'bg-amber-500',
      };
    case 'processing':
      return {
        bgClass: 'bg-blue-50 dark:bg-blue-950/40',
        textClass: 'text-blue-700 dark:text-blue-300',
        borderClass: 'border-blue-200 dark:border-blue-800/60',
        dotClass: 'bg-blue-500',
      };
    case 'ready_to_print':
      return {
        bgClass: 'bg-teal-50 dark:bg-teal-950/40',
        textClass: 'text-teal-700 dark:text-teal-300',
        borderClass: 'border-teal-200 dark:border-teal-800/60',
        dotClass: 'bg-teal-500',
      };
    case 'cancelled':
      return {
        bgClass: 'bg-rose-50 dark:bg-rose-950/40',
        textClass: 'text-rose-700 dark:text-rose-300',
        borderClass: 'border-rose-200 dark:border-rose-800/60',
        dotClass: 'bg-rose-500',
      };
    case 'draft':
    default:
      return {
        bgClass: 'bg-slate-100 dark:bg-slate-800',
        textClass: 'text-slate-700 dark:text-slate-300',
        borderClass: 'border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400',
      };
  }
}
