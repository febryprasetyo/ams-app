import { api } from '@/lib/api';
import type {
  HrActivitySummary,
  HrActivityDetail,
  HrActivityActor,
  HrActivityTargetSummary,
  HrActivityFiltersState,
  Page,
} from './types';

export async function listActivities(
  filters: HrActivityFiltersState,
  cursor?: string | null,
  limit = 25,
  signal?: AbortSignal
): Promise<Page<HrActivitySummary>> {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.action) params.set('action', filters.action);
  if (filters.actorId) params.set('actorId', filters.actorId);
  if (filters.q) params.set('q', filters.q);
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));

  const response = await api.get<{ success: boolean; items: HrActivitySummary[]; nextCursor: string | null }>(
    `/hr/activities?${params.toString()}`,
    { signal }
  );

  return {
    items: response?.items || [],
    nextCursor: response?.nextCursor || null,
  };
}

export async function getActivity(id: string, signal?: AbortSignal): Promise<HrActivityDetail> {
  const response = await api.get<{
    success: boolean;
    event: HrActivitySummary;
    metadata: Record<string, unknown> | null;
    targets: HrActivityTargetSummary[];
    nextTargetCursor: string | null;
  }>(`/hr/activities/${id}`, { signal });

  return response;
}

export async function listTargets(
  id: string,
  cursor?: string | null,
  limit = 50,
  signal?: AbortSignal
): Promise<{ targets: HrActivityTargetSummary[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));

  const response = await api.get<{
    success: boolean;
    targets: HrActivityTargetSummary[];
    nextCursor: string | null;
  }>(`/hr/activities/${id}/targets?${params.toString()}`, { signal });

  return {
    targets: response?.targets || [],
    nextCursor: response?.nextCursor || null,
  };
}

export async function listActors(
  q?: string,
  cursor?: string | null,
  limit = 25,
  signal?: AbortSignal
): Promise<Page<HrActivityActor>> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));

  const response = await api.get<{ success: boolean; items: HrActivityActor[]; nextCursor: string | null }>(
    `/hr/activities/actors?${params.toString()}`,
    { signal }
  );

  return {
    items: response?.items || [],
    nextCursor: response?.nextCursor || null,
  };
}
