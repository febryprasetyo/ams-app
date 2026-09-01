import { Request, Response } from 'express';
import { db } from '../db';
import {
  assets,
  assetCategories,
  assetComputerSpecs,
  assetAccessories,
  assetAssignmentHistory,
} from '../db/schema/assets';
import { locations } from '../db/schema/master';
import { auditLogs } from '../db/schema/system';
import { employees } from '../db/schema/employees';
import { eq, isNotNull, sql, ilike } from 'drizzle-orm';
import { buildAssetImportTemplate, parseAssetImportWorkbook } from '../services/assetWorkbook';
import {
  validateAssetImport,
  commitAssetImport,
  type AssetImportLookups,
  type AssetImportRepository,
} from '../services/assetImport';
import { allocateSequentialCodes } from '../domain/assetCode';

async function loadAssetImportLookups(runner: any = db): Promise<AssetImportLookups> {
  const [empRows, catRows, locRows, codeRows, snRows] = await Promise.all([
    runner
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        locationId: employees.locationId,
        locationName: locations.name,
      })
      .from(employees)
      .leftJoin(locations, eq(employees.locationId, locations.id)),
    runner
      .select({
        id: assetCategories.id,
        name: assetCategories.name,
        codePrefix: assetCategories.codePrefix,
      })
      .from(assetCategories),
    runner
      .select({
        id: locations.id,
        code: locations.code,
        name: locations.name,
      })
      .from(locations),
    runner.select({ code: assets.assetCode }).from(assets),
    runner.select({ sn: assets.serialNumber }).from(assets).where(isNotNull(assets.serialNumber)),
  ]);

  return {
    employees: empRows,
    categories: catRows,
    locations: locRows,
    existingAssetCodes: new Set(codeRows.map((r: any) => r.code)),
    existingSerialNumbers: new Set(snRows.map((r: any) => r.sn)),
  };
}

export async function downloadAssetImportTemplate(_req: Request, res: Response) {
  try {
    const buffer = await buildAssetImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ams-asset-import-template.xlsx"');
    return res.status(200).send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate template' });
  }
}

export async function previewAssetImport(req: Request, res: Response) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No XLSX file uploaded. Ensure multipart field name is "file".' });
    }

    let parsedWorkbook;
    try {
      parsedWorkbook = await parseAssetImportWorkbook(req.file.buffer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to parse XLSX workbook' });
    }

    const lookups = await loadAssetImportLookups(db);
    const validationResult = validateAssetImport(parsedWorkbook, lookups);

    return res.status(200).json(validationResult);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function commitAssetImportUpload(req: Request, res: Response) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No XLSX file uploaded. Ensure multipart field name is "file".' });
    }

    let parsedWorkbook;
    try {
      parsedWorkbook = await parseAssetImportWorkbook(req.file.buffer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to parse XLSX workbook' });
    }

    const userId = (req as any).user?.userId ?? (req as any).user?.id ?? 1;

    const commitResult = await db.transaction(async (tx) => {
      const lookups = await loadAssetImportLookups(tx);
      const validation = validateAssetImport(parsedWorkbook, lookups);

      if (!validation.valid || validation.messages.some((m) => m.type === 'error')) {
        throw new Error(`Validation failed: ${validation.summary.errorCount} error(s) found in workbook`);
      }

      const repository: AssetImportRepository = {
        allocateCodes: async (prefix: string, count: number) => {
          const year = new Date().getFullYear();
          await tx.execute(
            sql`SELECT pg_advisory_xact_lock(hashtext('asset_code_seq'), hashtext(${prefix + '-' + year}))`
          );
          const pattern = `${prefix}-${year}-%`;
          const existing = await tx
            .select({ assetCode: assets.assetCode })
            .from(assets)
            .where(ilike(assets.assetCode, pattern));

          const existingCodes = existing.map((r: any) => r.assetCode);
          return allocateSequentialCodes(prefix, year, existingCodes, count);
        },
        insertAsset: async (data) => {
          const [inserted] = await tx
            .insert(assets)
            .values({
              assetCode: data.assetCode,
              name: data.name,
              categoryId: data.categoryId,
              locationId: data.locationId ?? null,
              assignedToEmployeeId: data.assignedToEmployeeId ?? null,
              serialNumber: data.serialNumber ?? null,
              status: data.status,
              condition: data.condition,
              notes: data.notes ?? null,
            })
            .returning({ id: assets.id });
          return inserted.id;
        },
        insertComputerSpecs: async (data) => {
          await tx.insert(assetComputerSpecs).values({
            assetId: data.assetId,
            cpuName: data.cpuName,
            ramSizeGb: data.ramSizeGb,
            ramSlotCount: data.ramSlotCount,
            disk1SizeGb: data.disk1SizeGb,
            disk2SizeGb: data.disk2SizeGb ?? null,
          });
        },
        insertAccessories: async (data) => {
          if (data.length === 0) return;
          await tx.insert(assetAccessories).values(
            data.map((item) => ({
              assetId: item.assetId,
              accessoryType: item.accessoryType,
              description: item.description ?? null,
              quantity: item.quantity,
              condition: item.condition,
              notes: item.notes ?? null,
            }))
          );
        },
        insertAssignmentHistory: async (data) => {
          await tx.insert(assetAssignmentHistory).values({
            assetId: data.assetId,
            employeeId: data.employeeId,
            assignedAt: data.assignedDate,
            assignedByUserId: data.assignedByUserId,
            conditionOnAssign: data.conditionOnAssignment ?? 'Good',
            handoverNotes: data.handoverNotes ?? null,
          });
        },
        insertAuditLog: async (data) => {
          await tx.insert(auditLogs).values({
            userId: data.performedBy,
            action: data.action,
            entity: data.entity,
            entityId: data.entityId,
            newValues: data.details ? { info: data.details } : null,
          });
        },
      };

      return await commitAssetImport(repository, validation, { userId });
    });

    return res.status(200).json(commitResult);
  } catch (err: any) {
    if (err.message && err.message.startsWith('Validation failed')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
