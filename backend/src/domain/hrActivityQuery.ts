import { z } from "zod";
import { createHash } from "node:crypto";

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "IMPORT",
  "REVIEW",
  "LINK",
  "UNLINK",
  "APPROVE",
  "REJECT",
  "CANCEL",
  "REOPEN",
  "LOCK",
  "UNLOCK",
  "ASSIGN",
  "UNASSIGN",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const hrActivityQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  actorId: z.string().optional(),
  entityType: z.string().optional(),
  q: z.string().max(100, "Pencarian maksimal 100 karakter").optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type RawHrActivityQuery = z.infer<typeof hrActivityQuerySchema>;

export interface ParsedHrActivityQuery {
  startDate: string;
  endDate: string;
  dateFrom: Date;
  dateTo: Date;
  action?: AuditAction;
  actorId?: string;
  entityType?: string;
  q?: string;
  cursor?: {
    occurredAt: Date;
    id: bigint;
  };
  limit: number;
  filterFingerprint: string;
}

export function escapeIlike(text: string): string {
  return text.replace(/[%_\\]/g, "\\$&");
}

export function computeFilterFingerprint(filters: {
  startDate: string;
  endDate: string;
  action?: string;
  actorId?: string;
  entityType?: string;
  q?: string;
}): string {
  const normalized = `${filters.startDate}|${filters.endDate}|${filters.action || ""}|${filters.actorId || ""}|${filters.entityType || ""}|${filters.q?.trim().toLowerCase() || ""}`;
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function encodeCursor(occurredAt: Date, id: bigint, fingerprint: string): string {
  const payload = {
    t: occurredAt.toISOString(),
    i: id.toString(),
    f: fingerprint,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(
  cursorStr: string,
  expectedFingerprint: string
): { occurredAt: Date; id: bigint } {
  try {
    const raw = Buffer.from(cursorStr, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid cursor format");
    }
    if (parsed.f !== expectedFingerprint) {
      const err = new Error("Cursor expired: filters have changed");
      (err as any).statusCode = 400;
      throw err;
    }
    const occurredAt = new Date(parsed.t);
    if (isNaN(occurredAt.getTime())) {
      throw new Error("Invalid cursor timestamp");
    }
    const id = BigInt(parsed.i);
    return { occurredAt, id };
  } catch (err: any) {
    if (err.statusCode === 400) throw err;
    const error = new Error("Invalid cursor parameter");
    (error as any).statusCode = 400;
    throw error;
  }
}

function getWibDateParts(date: Date): { year: number; month: number; day: number } {
  const wibTime = new Date(date.getTime() + 7 * 3600 * 1000);
  return {
    year: wibTime.getUTCFullYear(),
    month: wibTime.getUTCMonth() + 1,
    day: wibTime.getUTCDate(),
  };
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function parseHrActivityQuery(
  rawInput: unknown,
  now = new Date()
): ParsedHrActivityQuery {
  const parsed = hrActivityQuerySchema.parse(rawInput);

  const wibNow = getWibDateParts(now);
  const defaultEndDateStr = formatYmd(wibNow.year, wibNow.month, wibNow.day);

  // 30 calendar days ago
  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 3600 * 1000);
  const wib30 = getWibDateParts(thirtyDaysAgo);
  const defaultStartDateStr = formatYmd(wib30.year, wib30.month, wib30.day);

  const startDateStr = parsed.startDate || defaultStartDateStr;
  const endDateStr = parsed.endDate || defaultEndDateStr;

  const [sY, sM, sD] = startDateStr.split("-").map(Number);
  const [eY, eM, eD] = endDateStr.split("-").map(Number);

  // Validate calendar validity
  const sTest = new Date(Date.UTC(sY, sM - 1, sD));
  if (
    sTest.getUTCFullYear() !== sY ||
    sTest.getUTCMonth() !== sM - 1 ||
    sTest.getUTCDate() !== sD
  ) {
    const err = new Error("startDate bukan tanggal kalender yang valid");
    (err as any).statusCode = 400;
    throw err;
  }

  const eTest = new Date(Date.UTC(eY, eM - 1, eD));
  if (
    eTest.getUTCFullYear() !== eY ||
    eTest.getUTCMonth() !== eM - 1 ||
    eTest.getUTCDate() !== eD
  ) {
    const err = new Error("endDate bukan tanggal kalender yang valid");
    (err as any).statusCode = 400;
    throw err;
  }

  if (startDateStr > endDateStr) {
    const err = new Error("startDate harus lebih kecil atau sama dengan endDate");
    (err as any).statusCode = 400;
    throw err;
  }

  // Convert WIB YYYY-MM-DD to UTC boundaries
  const dateFrom = new Date(Date.UTC(sY, sM - 1, sD) - 7 * 3600 * 1000);
  const dateTo = new Date(Date.UTC(eY, eM - 1, eD + 1) - 7 * 3600 * 1000);

  const filterFingerprint = computeFilterFingerprint({
    startDate: startDateStr,
    endDate: endDateStr,
    action: parsed.action,
    actorId: parsed.actorId,
    entityType: parsed.entityType,
    q: parsed.q,
  });

  let cursor: { occurredAt: Date; id: bigint } | undefined;
  if (parsed.cursor) {
    cursor = decodeCursor(parsed.cursor, filterFingerprint);
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    dateFrom,
    dateTo,
    action: parsed.action as AuditAction | undefined,
    actorId: parsed.actorId,
    entityType: parsed.entityType,
    q: parsed.q?.trim(),
    cursor,
    limit: parsed.limit,
    filterFingerprint,
  };
}
