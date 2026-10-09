import { Request, Response } from 'express';
import { db } from '../db';
import { attendanceBatches, attendanceRecords } from '../db/schema/attendance';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export interface AttendanceRecordInput {
  employeeId: number;
  workDate: string;
  shift?: string | null;
  scheduleIn?: string | null;
  scheduleOut?: string | null;
  scanIn?: string | null;
  scanOut?: string | null;
  rawScanIn?: string | null;
  rawScanOut?: string | null;
  lateMinutes?: number;
  earlyMinutes?: number;
  overtimeMinutes?: number;
  attendanceStatus?: string;
  isDayOff?: boolean;
  normalized?: boolean;
}

export function normalizeAttendanceRecordPayload(input: any): AttendanceRecordInput & {
  lateMinutes: number;
  earlyMinutes: number;
  overtimeMinutes: number;
  attendanceStatus: string;
  isDayOff: boolean;
  normalized: boolean;
} {
  const employeeId = Number(input.employeeId);
  if (!employeeId || isNaN(employeeId)) {
    throw new Error('employeeId is required and must be a valid number');
  }

  const workDate = String(input.workDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    throw new Error('Invalid workDate format. Must be YYYY-MM-DD');
  }

  return {
    employeeId,
    workDate,
    shift: input.shift ? String(input.shift) : null,
    scheduleIn: input.scheduleIn ? String(input.scheduleIn) : null,
    scheduleOut: input.scheduleOut ? String(input.scheduleOut) : null,
    scanIn: input.scanIn ? String(input.scanIn) : null,
    scanOut: input.scanOut ? String(input.scanOut) : null,
    rawScanIn: input.rawScanIn ? String(input.rawScanIn) : input.scanIn ? String(input.scanIn) : null,
    rawScanOut: input.rawScanOut ? String(input.rawScanOut) : input.scanOut ? String(input.scanOut) : null,
    lateMinutes: Number(input.lateMinutes) || 0,
    earlyMinutes: Number(input.earlyMinutes) || 0,
    overtimeMinutes: Number(input.overtimeMinutes) || 0,
    attendanceStatus: String(input.attendanceStatus || (input.scanIn ? 'PRESENT' : 'ALPHA')).toUpperCase(),
    isDayOff: Boolean(input.isDayOff),
    normalized: Boolean(input.normalized),
  };
}

export async function getAttendanceRecords(req: Request, res: Response) {
  try {
    const { startDate, endDate, employeeId } = req.query;

    const conditions: any[] = [];
    if (startDate && typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      conditions.push(gte(attendanceRecords.workDate, startDate));
    }
    if (endDate && typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      conditions.push(lte(attendanceRecords.workDate, endDate));
    }
    if (employeeId) {
      const empIdNum = Number(employeeId);
      if (!isNaN(empIdNum)) {
        conditions.push(eq(attendanceRecords.employeeId, empIdNum));
      }
    }

    const rows = await db
      .select()
      .from(attendanceRecords)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendanceRecords.workDate));

    return res.status(200).json(rows);
  } catch (err) {
    console.error('getAttendanceRecords error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attendance records' });
  }
}

export async function getAttendanceBatches(_req: Request, res: Response) {
  try {
    const batches = await db
      .select()
      .from(attendanceBatches)
      .orderBy(desc(attendanceBatches.createdAt))
      .limit(50);

    return res.status(200).json(batches);
  } catch (err) {
    console.error('getAttendanceBatches error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attendance batches' });
  }
}

export async function commitAttendanceBatch(req: Request, res: Response) {
  try {
    const { filename, sourceId = 1, fileHash, records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records must be a non-empty array' });
    }

    const normalizedRecords = records.map(normalizeAttendanceRecordPayload);
    const userId = (req as any).user?.id ? Number((req as any).user.id) : null;

    const result = await db.transaction(async (tx) => {
      const [batch] = await tx
        .insert(attendanceBatches)
        .values({
          filename: String(filename || 'IMPORT_ATTENDANCE.xlsx'),
          sourceId: Number(sourceId) || 1,
          fileHash: fileHash ? String(fileHash) : null,
          status: 'COMMITTED',
          totalRows: normalizedRecords.length,
          validRows: normalizedRecords.length,
          skippedRows: 0,
          createdById: userId,
          createdAt: new Date(),
          committedAt: new Date(),
        })
        .returning();

      // Chunk inserts/upserts for safety
      const chunkSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < normalizedRecords.length; i += chunkSize) {
        const chunk = normalizedRecords.slice(i, i + chunkSize);
        await tx
          .insert(attendanceRecords)
          .values(
            chunk.map((rec) => ({
              ...rec,
              sourceBatchId: batch.id,
              revision: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          )
          .onConflictDoUpdate({
            target: [attendanceRecords.employeeId, attendanceRecords.workDate],
            set: {
              shift: sql`excluded.shift`,
              scheduleIn: sql`excluded.schedule_in`,
              scheduleOut: sql`excluded.schedule_out`,
              scanIn: sql`excluded.scan_in`,
              scanOut: sql`excluded.scan_out`,
              rawScanIn: sql`excluded.raw_scan_in`,
              rawScanOut: sql`excluded.raw_scan_out`,
              lateMinutes: sql`excluded.late_minutes`,
              earlyMinutes: sql`excluded.early_minutes`,
              overtimeMinutes: sql`excluded.overtime_minutes`,
              attendanceStatus: sql`excluded.attendance_status`,
              isDayOff: sql`excluded.is_day_off`,
              normalized: sql`excluded.normalized`,
              revision: sql`${attendanceRecords.revision} + 1`,
              sourceBatchId: batch.id,
              updatedAt: new Date(),
            },
          });
        insertedCount += chunk.length;
      }

      return { batch, insertedCount };
    });

    return res.status(200).json({
      success: true,
      message: `${result.insertedCount} attendance records saved to database`,
      batchId: result.batch.id,
      insertedCount: result.insertedCount,
    });
  } catch (err: any) {
    console.error('commitAttendanceBatch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to commit attendance batch' });
  }
}
