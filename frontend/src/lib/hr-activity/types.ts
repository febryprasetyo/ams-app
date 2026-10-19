export interface HrActivityActor {
  id: string;
  username: string;
  name: string;
}

export interface HrActivitySummary {
  id: string;
  operationId: string;
  occurredAt: string;
  actor: HrActivityActor;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  outcome: string;
  summary: string;
}

export interface HrActivityTargetSummary {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changedFields?: string[];
}

export interface HrActivityDetail {
  event: HrActivitySummary;
  metadata: Record<string, unknown> | null;
  targets: HrActivityTargetSummary[];
  nextTargetCursor: string | null;
}

export interface HrActivityFiltersState {
  startDate: string;
  endDate: string;
  action?: string;
  actorId?: string;
  q?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
