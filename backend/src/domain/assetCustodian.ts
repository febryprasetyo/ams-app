import type { Response } from 'express';
import { z } from 'zod';
export function normalizeCustodianName(name: string): string {
  return name.trim().replace(/\s+/gu, ' ').toLowerCase();
}

function editDistance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}
export function findCustodianCandidates<T extends {
  displayName?: string;
  fullName?: string;
  normalizedName?: string;
}>(name: string, candidates: T[]): T[] {
  const normalized = normalizeCustodianName(name);
  if (!normalized) {
    return [];
  }
  return candidates.filter(candidate => {
    const other = normalizeCustodianName(candidate.displayName ?? candidate.fullName ?? candidate.normalizedName ?? '');
    return other === normalized || (Math.min(other.length, normalized.length) >= 4 && editDistance(normalized, other) <= Math.max(1, Math.floor(Math.max(other.length, normalized.length) * 0.2)));
  }).sort((a, b) => Number(normalizeCustodianName(b.displayName ?? b.fullName ?? b.normalizedName ?? '') === normalized) - Number(normalizeCustodianName(a.displayName ?? a.fullName ?? a.normalizedName ?? '') === normalized));
}
export function rankEmployeeMatches<T extends {
  id: number;
  fullName: string;
  locationId: number | null;
  departmentName: string | null;
}>(custodian: {
  displayName: string;
  locationId: number | null;
  unitText: string | null;
}, candidates: T[]): T[] {
  const name = normalizeCustodianName(custodian.displayName);
  const unit = normalizeCustodianName(custodian.unitText ?? '');
  const score = (candidate: T) => (normalizeCustodianName(candidate.fullName) === name ? 4 : 0) +
    (custodian.locationId !== null && custodian.locationId === candidate.locationId ? 2 : 0) +
    (unit && normalizeCustodianName(candidate.departmentName ?? '') === unit ? 1 : 0);
  return findCustodianCandidates(custodian.displayName, candidates)
    .sort((a, b) => score(b) - score(a) || a.fullName.localeCompare(b.fullName) || a.id - b.id);
}

export const manualCustodianSchema = z.object({
  displayName: z.string().transform(value => value.trim().replace(/\s+/gu, ' ')).pipe(z.string().min(1).max(150)),
  locationId: z.number().int().positive().nullable().optional(),
  unitText: z.string().trim().max(150).nullable().optional(),
  notes: z.string().trim().max(10000).nullable().optional(),
  duplicateAcknowledged: z.boolean().optional(),
}).strict();

export type ManualCustodianInput = z.input<typeof manualCustodianSchema>;

export type CustodianSelection = {
  custodianId: number;
  newCustodian?: never;
} | {
  custodianId?: never;
  newCustodian: ManualCustodianInput;
};

export class CustodianError extends Error {
  constructor(message: string, public status = 400, public code?: string, public candidates?: unknown[]) { super(message); }
}
export function sendCustodianError(res: Response, err: unknown): boolean {
  if (err instanceof CustodianError) {
    res.status(err.status).json({ error: err.message, ...(err.code ? { code: err.code } : {}), ...(err.candidates ? { candidates: err.candidates } : {}) });
    return true;
  }
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'Invalid custodian input', details: err.flatten() });
    return true;
  }
  const databaseError = err as {
    code?: string;
    cause?: {
      code?: string;
    };
  };
  const code = databaseError?.cause?.code ?? databaseError?.code;
  if (code === '23505' || code === '23503' || code === '23514') {
    res.status(code === '23505' ? 409 : 400).json({ error: code === '23505' ? 'Custodian conflicts with an existing record; reconcile by merging' : 'Invalid referenced record or custodian state' });
    return true;
  }
  return false;
}
