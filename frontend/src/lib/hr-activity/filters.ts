import type { HrActivityFiltersState } from './types';

export function getDefaultDateRange(now = new Date()): { startDate: string; endDate: string } {
  const wibTime = new Date(now.getTime() + 7 * 3600 * 1000);
  const endY = wibTime.getUTCFullYear();
  const endM = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
  const endD = String(wibTime.getUTCDate()).padStart(2, '0');
  const endDate = `${endY}-${endM}-${endD}`;

  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 3600 * 1000 + 7 * 3600 * 1000);
  const startY = thirtyDaysAgo.getUTCFullYear();
  const startM = String(thirtyDaysAgo.getUTCMonth() + 1).padStart(2, '0');
  const startD = String(thirtyDaysAgo.getUTCDate()).padStart(2, '0');
  const startDate = `${startY}-${startM}-${startD}`;

  return { startDate, endDate };
}

export function createInitialFilters(now = new Date()): HrActivityFiltersState {
  const { startDate, endDate } = getDefaultDateRange(now);
  return {
    startDate,
    endDate,
    action: undefined,
    actorId: undefined,
    q: '',
  };
}

export function formatWibDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}
