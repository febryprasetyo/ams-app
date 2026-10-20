import type { LeaveHistoryItem } from '@/types/leaves';

export function formatLeaveDocumentDate(value?: string | null): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

export function formatLeaveHistoryDescription(item: LeaveHistoryItem): string {
  if (!item.startDate || !item.durationDays) return item.description;
  const start = formatLeaveDocumentDate(item.startDate);
  const dates = item.durationDays === 2 && item.endDate && item.endDate !== item.startDate
    ? `${start} s/d ${formatLeaveDocumentDate(item.endDate)}`
    : start;
  return `${item.durationDays} = Cuti tahunan tgl ${dates}`;
}
