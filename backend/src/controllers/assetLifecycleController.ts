import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';
import { assets, assetAssignmentHistory } from '../db/schema/assets';
import { assetMaintenances } from '../db/schema/tickets';
import { auditLogs } from '../db/schema/system';
import { users } from '../db/schema/users';
import { employees } from '../db/schema/employees';
import { assetCustodians } from '../db/schema/assetCustodians';
import { CustodianError, manualCustodianSchema, sendCustodianError } from '../domain/assetCustodian';
import { lockCustodianDirectory, requireActiveCustodian, resolveCustodianSelection } from '../services/assetCustodian';
import { hydrateAssetCustodians } from '../services/assetCustodianRead';
import { assignmentActor, canCreateManualCustodian, writeAssetAssignment } from '../services/assetAssignment';
import { departments, locations } from '../db/schema/master';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// --- Zod Schemas ---
const assignAssetSchema = z.object({
  custodianId: z.number().int().positive().optional(),
  newCustodian: manualCustodianSchema.optional(),
  assignedToEmployeeId: z.never().optional(),
  currentCustodianId: z.never().optional(),
  assignedToLocationId: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  handoverNotes: z.string().nullable().optional(),
  conditionOnAssign: z.enum(['Good', 'Fair', 'Poor', 'Damaged']).optional(),
}).refine(data => !(data.custodianId !== undefined && data.newCustodian !== undefined), {
  message: 'Select one existing custodian or create one new holder',
}).refine(data => data.custodianId !== undefined || data.newCustodian !== undefined || data.assignedToLocationId != null, {
  message: 'A custodian or assignment location is required',
});

const unassignAssetSchema = z.object({
  returnNotes: z.string().optional().nullable(),
  conditionOnReturn: z.enum(['Good', 'Fair', 'Poor', 'Damaged']).optional(),
});

const logMaintenanceSchema = z.object({
  maintenanceType: z.string().min(1, 'Maintenance type is required'),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  cost: z.number().optional().default(0),
  performedById: z.number().optional().nullable(),
  vendorId: z.number().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  status: z.string().optional().default('Completed'),
});

const disposeAssetSchema = z.object({
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// --- Controller Handlers ---

export async function assignAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new CustodianError('Invalid asset ID');
    const parsed = assignAssetSchema.parse(req.body);
    const actorId = assignmentActor(req);
    const result = await db.transaction(async tx => {
      await lockCustodianDirectory(tx);
      const [existing] = await tx.select().from(assets).where(eq(assets.id, id)).for('update');
      if (!existing) throw new CustodianError('Asset not found', 404);
      if (['Disposed', 'Lost', 'Maintenance'].includes(existing.status)) throw new CustodianError('This asset is not available for assignment', 409);
      const custodian = parsed.custodianId !== undefined || parsed.newCustodian !== undefined
        ? await resolveCustodianSelection(tx, parsed, actorId, canCreateManualCustodian(req))
        : existing.currentCustodianId ? await requireActiveCustodian(tx, existing.currentCustodianId) : null;
      const updated = await writeAssetAssignment(tx, existing, custodian, actorId, {
        locationId: parsed.assignedToLocationId ?? existing.locationId ?? custodian?.locationId ?? null,
        conditionOnAssign: parsed.conditionOnAssign,
        handoverNotes: parsed.handoverNotes,
        notes: parsed.notes,
        returnNotes: parsed.notes,
        action: 'ASSIGN',
      });
      return (await hydrateAssetCustodians([updated], tx))[0];
    });
    return res.status(200).json({ message: 'Asset assigned successfully', asset: result });
  } catch (err) {
    if (sendCustodianError(res, err)) return;
    return res.status(500).json({ error: 'Failed to assign asset' });
  }
}

export async function unassignAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new CustodianError('Invalid asset ID');
    const parsed = unassignAssetSchema.parse(req.body || {});
    const actorId = assignmentActor(req);
    const updated = await db.transaction(async tx => {
      await lockCustodianDirectory(tx);
      const [existing] = await tx.select().from(assets).where(eq(assets.id, id)).for('update');
      if (!existing) throw new CustodianError('Asset not found', 404);
      const asset = await writeAssetAssignment(tx, existing, null, actorId, {
        conditionOnReturn: parsed.conditionOnReturn,
        returnNotes: parsed.returnNotes ?? 'Returned to IT stock',
        action: 'UNASSIGN',
      });
      return (await hydrateAssetCustodians([asset], tx))[0];
    });
    return res.status(200).json({ message: 'Asset unassigned successfully and returned to stock', asset: updated });
  } catch (err) {
    if (sendCustodianError(res, err)) return;
    return res.status(500).json({ error: 'Failed to unassign asset' });
  }
}

export async function logMaintenance(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid asset ID' });
    }

    const [existingAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id));

    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const parsed = logMaintenanceSchema.parse(req.body);

    const [maintenanceRecord] = await db
      .insert(assetMaintenances)
      .values({
        assetId: id,
        maintenanceType: parsed.maintenanceType,
        title: parsed.title || `${parsed.maintenanceType} - ${existingAsset.name}`,
        description: parsed.description || null,
        cost: parsed.cost || 0,
        performedById: parsed.performedById || req.user?.userId || null,
        vendorId: parsed.vendorId || null,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
        completedAt: parsed.completedAt ? new Date(parsed.completedAt) : new Date(),
        status: parsed.status || 'Completed',
      })
      .returning();

    // Update asset status to Maintenance if in progress, or restore
    const targetStatus = parsed.status === 'In Progress' ? 'Maintenance' : existingAsset.status;

    const [updatedAsset] = await db
      .update(assets)
      .set({
        status: targetStatus,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();

    // Log audit action
    await db.insert(auditLogs).values({
      userId: req.user?.userId || null,
      action: 'MAINTENANCE',
      entity: 'ASSET',
      entityId: id,
      oldValues: { status: existingAsset.status },
      newValues: {
        status: updatedAsset.status,
        maintenanceId: maintenanceRecord.id,
        maintenanceType: parsed.maintenanceType,
      },
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(201).json({
      message: 'Maintenance logged successfully',
      maintenance: maintenanceRecord,
      asset: updatedAsset,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: 'Asset operation failed' });
  }
}

export async function disposeAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid asset ID' });
    }

    const [existingAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id));

    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const parsed = disposeAssetSchema.parse(req.body);

    const disposeNote = parsed.reason || parsed.notes || 'Asset disposed';
    const updatedNotes = existingAsset.notes
      ? `${existingAsset.notes} | Disposed: ${disposeNote}`
      : `Disposed: ${disposeNote}`;

    const [updatedAsset] = await db
      .update(assets)
      .set({
        status: 'Disposed',
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();

    // Log audit action
    await db.insert(auditLogs).values({
      userId: req.user?.userId || null,
      action: 'DISPOSE',
      entity: 'ASSET',
      entityId: id,
      oldValues: {
        status: existingAsset.status,
        notes: existingAsset.notes,
      },
      newValues: {
        status: 'Disposed',
        reason: disposeNote,
      },
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'Asset disposed successfully',
      asset: updatedAsset,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: 'Asset operation failed' });
  }
}

export async function getAssetHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid asset ID' });
    }

    const [existingAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id));

    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // 1. Fetch User Transfer Assignment History
    const assignmentHistory = await db
      .select({
        id: assetAssignmentHistory.id,
        assetId: assetAssignmentHistory.assetId,
        custodianId: assetAssignmentHistory.custodianId,
        custodianNameSnapshot: assetAssignmentHistory.custodianNameSnapshot,
        locationNameSnapshot: assetAssignmentHistory.locationNameSnapshot,
        assignedByUserId: assetAssignmentHistory.assignedByUserId,
        employeeId: employees.id,
        employeeCode: employees.employeeCode,
        employeeName: assetAssignmentHistory.custodianNameSnapshot,
        employeePosition: employees.position,
        departmentName: departments.name,
        assignedByUsername: users.username,
        assignedAt: assetAssignmentHistory.assignedAt,
        returnedAt: assetAssignmentHistory.returnedAt,
        conditionOnAssign: assetAssignmentHistory.conditionOnAssign,
        conditionOnReturn: assetAssignmentHistory.conditionOnReturn,
        handoverNotes: assetAssignmentHistory.handoverNotes,
        returnNotes: assetAssignmentHistory.returnNotes,
      })
      .from(assetAssignmentHistory)
      .leftJoin(assetCustodians, eq(assetAssignmentHistory.custodianId, assetCustodians.id))
      .leftJoin(employees, eq(assetCustodians.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(users, eq(assetAssignmentHistory.assignedByUserId, users.id))
      .where(eq(assetAssignmentHistory.assetId, id))
      .orderBy(desc(assetAssignmentHistory.assignedAt));

    // 2. Fetch Maintenance Records
    const maintenanceHistory = await db
      .select({
        id: assetMaintenances.id,
        assetId: assetMaintenances.assetId,
        maintenanceType: assetMaintenances.maintenanceType,
        title: assetMaintenances.title,
        description: assetMaintenances.description,
        cost: assetMaintenances.cost,
        vendorId: assetMaintenances.vendorId,
        scheduledAt: assetMaintenances.scheduledAt,
        completedAt: assetMaintenances.completedAt,
        status: assetMaintenances.status,
        performedById: assetMaintenances.performedById,
        performedByUsername: users.username,
        createdAt: assetMaintenances.createdAt,
      })
      .from(assetMaintenances)
      .leftJoin(users, eq(assetMaintenances.performedById, users.id))
      .where(eq(assetMaintenances.assetId, id))
      .orderBy(desc(assetMaintenances.createdAt));

    // 3. Fetch Audit Log Records
    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        username: users.username,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(eq(auditLogs.entity, 'ASSET'), eq(auditLogs.entityId, id)))
      .orderBy(desc(auditLogs.createdAt));

    return res.status(200).json({
      assetId: id,
      assignmentHistory,
      maintenanceHistory,
      auditLogs: logs,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Asset operation failed' });
  }
}
