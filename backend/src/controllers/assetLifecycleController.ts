import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';
import { assets, assetAssignmentHistory } from '../db/schema/assets';
import { assetMaintenances } from '../db/schema/tickets';
import { auditLogs } from '../db/schema/system';
import { users } from '../db/schema/users';
import { employees } from '../db/schema/employees';
import { departments, locations } from '../db/schema/master';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';

// --- Zod Schemas ---
const assignAssetSchema = z
  .object({
    assignedToEmployeeId: z.number().optional().nullable(),
    assignedToLocationId: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
    handoverNotes: z.string().optional().nullable(),
    conditionOnAssign: z.string().optional().default('Good'),
  })
  .refine(
    (data) => data.assignedToEmployeeId != null || data.assignedToLocationId != null || data.notes != null,
    {
      message: 'Either assignedToEmployeeId or assignedToLocationId must be provided',
      path: ['assignedToEmployeeId'],
    }
  );

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

    const parsed = assignAssetSchema.parse(req.body);

    // If employee ID passed, check employee existence
    if (parsed.assignedToEmployeeId) {
      const [emp] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, parsed.assignedToEmployeeId));
      if (!emp) {
        return res.status(400).json({ error: 'Assigned employee not found' });
      }
    }

    // If location ID passed, check location existence
    if (parsed.assignedToLocationId) {
      const [loc] = await db
        .select()
        .from(locations)
        .where(eq(locations.id, parsed.assignedToLocationId));
      if (!loc) {
        return res.status(400).json({ error: 'Assigned location not found' });
      }
    }

    const newLocationId = parsed.assignedToLocationId ?? existingAsset.locationId;
    const newEmployeeId = parsed.assignedToEmployeeId ?? existingAsset.assignedToEmployeeId;
    const newStatus = newEmployeeId ? 'Assigned' : 'Available';

    // 1. Close open active assignment in history if any
    await db
      .update(assetAssignmentHistory)
      .set({
        returnedAt: new Date(),
        conditionOnReturn: existingAsset.condition,
        returnNotes: parsed.notes || 'Asset reassigned / returned',
      })
      .where(and(eq(assetAssignmentHistory.assetId, id), isNull(assetAssignmentHistory.returnedAt)));

    // 2. Insert new assignment history row
    if (newEmployeeId) {
      await db.insert(assetAssignmentHistory).values({
        assetId: id,
        employeeId: newEmployeeId,
        assignedByUserId: req.user?.userId || null,
        assignedAt: new Date(),
        conditionOnAssign: parsed.conditionOnAssign || existingAsset.condition || 'Good',
        handoverNotes: parsed.handoverNotes || parsed.notes || 'Handed over device',
      });
    }

    // 3. Update main asset record
    const [updatedAsset] = await db
      .update(assets)
      .set({
        status: newStatus,
        locationId: newLocationId,
        assignedToEmployeeId: newEmployeeId,
        notes: parsed.notes !== undefined ? parsed.notes : existingAsset.notes,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();

    // 4. Log audit action
    await db.insert(auditLogs).values({
      userId: req.user?.userId || null,
      action: 'ASSIGN',
      entity: 'ASSET',
      entityId: id,
      oldValues: {
        status: existingAsset.status,
        locationId: existingAsset.locationId,
        assignedToEmployeeId: existingAsset.assignedToEmployeeId,
      },
      newValues: {
        status: updatedAsset.status,
        locationId: updatedAsset.locationId,
        assignedToEmployeeId: updatedAsset.assignedToEmployeeId,
        notes: updatedAsset.notes,
      },
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'Asset assigned successfully',
      asset: updatedAsset,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
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
    return res.status(500).json({ error: err.message || 'Internal server error' });
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
    return res.status(500).json({ error: err.message || 'Internal server error' });
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
        employeeId: assetAssignmentHistory.employeeId,
        employeeCode: employees.employeeCode,
        employeeName: employees.fullName,
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
      .leftJoin(employees, eq(assetAssignmentHistory.employeeId, employees.id))
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
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
