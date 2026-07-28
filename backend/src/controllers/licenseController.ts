import { Request, Response } from 'express';
import { db } from '../db';
import { softwareLicenses, licenseAllocations } from '../db/schema/licenses';
import { vendors } from '../db/schema/vendors';
import { employees } from '../db/schema/employees';
import { assets } from '../db/schema/assets';
import { eq, ilike, or, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// --- Zod Schemas ---
const createLicenseSchema = z.object({
  name: z.string().min(1, 'Software name is required').max(150),
  licenseKey: z.string().max(255).optional().nullable(),
  licenseType: z.string().max(50).optional().nullable(),
  vendorId: z.number().optional().nullable(),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1').default(1),
  purchaseDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  expirationDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  cost: z.union([z.number(), z.string()]).optional().nullable().transform((val) => (val !== undefined && val !== null ? String(val) : null)),
  status: z.string().max(30).optional().default('Active'),
  notes: z.string().optional().nullable(),
});

const updateLicenseSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  licenseKey: z.string().max(255).optional().nullable(),
  licenseType: z.string().max(50).optional().nullable(),
  vendorId: z.number().optional().nullable(),
  totalSeats: z.number().int().min(1).optional(),
  purchaseDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : val === null ? null : undefined)),
  expirationDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : val === null ? null : undefined)),
  cost: z.union([z.number(), z.string()]).optional().nullable().transform((val) => (val !== undefined && val !== null ? String(val) : val === null ? null : undefined)),
  status: z.string().max(30).optional(),
  notes: z.string().optional().nullable(),
});

const allocateSeatSchema = z.object({
  employeeId: z.number().optional().nullable(),
  assetId: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => data.employeeId || data.assetId, {
  message: 'Either employeeId or assetId must be provided for seat allocation',
});

// --- Controller Handlers ---

/**
 * GET /api/v1/licenses
 * List software licenses with query filters (search, licenseType, status, vendorId), joined with vendors.
 */
export async function getLicenses(req: Request, res: Response) {
  try {
    const { search, licenseType, status, vendorId } = req.query;

    const conditions = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(softwareLicenses.name, pattern),
          ilike(softwareLicenses.licenseKey, pattern)
        )
      );
    }

    if (licenseType && typeof licenseType === 'string' && licenseType.trim() !== '') {
      conditions.push(eq(softwareLicenses.licenseType, licenseType.trim()));
    }

    if (status && typeof status === 'string' && status.trim() !== '') {
      conditions.push(eq(softwareLicenses.status, status.trim()));
    }

    if (vendorId) {
      const vId = Number(vendorId);
      if (!isNaN(vId)) {
        conditions.push(eq(softwareLicenses.vendorId, vId));
      }
    }

    const query = db
      .select({
        id: softwareLicenses.id,
        name: softwareLicenses.name,
        licenseKey: softwareLicenses.licenseKey,
        licenseType: softwareLicenses.licenseType,
        vendorId: softwareLicenses.vendorId,
        vendorName: vendors.name,
        totalSeats: softwareLicenses.totalSeats,
        usedSeats: softwareLicenses.usedSeats,
        purchaseDate: softwareLicenses.purchaseDate,
        expirationDate: softwareLicenses.expirationDate,
        cost: softwareLicenses.cost,
        status: softwareLicenses.status,
        notes: softwareLicenses.notes,
        createdAt: softwareLicenses.createdAt,
      })
      .from(softwareLicenses)
      .leftJoin(vendors, eq(softwareLicenses.vendorId, vendors.id));

    const list = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(softwareLicenses.id))
      : await query.orderBy(desc(softwareLicenses.id));

    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * GET /api/v1/licenses/:id
 * Single license detail + active allocations joined with employees and assets.
 */
export async function getLicenseById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid software license ID' });
    }

    const licenseResult = await db
      .select({
        id: softwareLicenses.id,
        name: softwareLicenses.name,
        licenseKey: softwareLicenses.licenseKey,
        licenseType: softwareLicenses.licenseType,
        vendorId: softwareLicenses.vendorId,
        vendorName: vendors.name,
        totalSeats: softwareLicenses.totalSeats,
        usedSeats: softwareLicenses.usedSeats,
        purchaseDate: softwareLicenses.purchaseDate,
        expirationDate: softwareLicenses.expirationDate,
        cost: softwareLicenses.cost,
        status: softwareLicenses.status,
        notes: softwareLicenses.notes,
        createdAt: softwareLicenses.createdAt,
      })
      .from(softwareLicenses)
      .leftJoin(vendors, eq(softwareLicenses.vendorId, vendors.id))
      .where(eq(softwareLicenses.id, id))
      .limit(1);

    if (licenseResult.length === 0) {
      return res.status(404).json({ error: 'Software license not found' });
    }

    const license = licenseResult[0];

    const allocations = await db
      .select({
        id: licenseAllocations.id,
        licenseId: licenseAllocations.licenseId,
        employeeId: licenseAllocations.employeeId,
        employeeName: employees.fullName,
        employeeCode: employees.employeeCode,
        employeeEmail: employees.email,
        employeePosition: employees.position,
        assetId: licenseAllocations.assetId,
        assetName: assets.name,
        assetCode: assets.assetCode,
        assetSerialNumber: assets.serialNumber,
        allocatedAt: licenseAllocations.allocatedAt,
        notes: licenseAllocations.notes,
      })
      .from(licenseAllocations)
      .leftJoin(employees, eq(licenseAllocations.employeeId, employees.id))
      .leftJoin(assets, eq(licenseAllocations.assetId, assets.id))
      .where(eq(licenseAllocations.licenseId, id))
      .orderBy(desc(licenseAllocations.id));

    return res.status(200).json({
      ...license,
      allocations,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * POST /api/v1/licenses
 * Validates payload and creates a software license.
 */
export async function createLicense(req: Request, res: Response) {
  try {
    const parsed = createLicenseSchema.parse(req.body);

    const [inserted] = await db
      .insert(softwareLicenses)
      .values({
        name: parsed.name,
        licenseKey: parsed.licenseKey ?? null,
        licenseType: parsed.licenseType ?? null,
        vendorId: parsed.vendorId ?? null,
        totalSeats: parsed.totalSeats,
        usedSeats: 0,
        purchaseDate: parsed.purchaseDate ?? null,
        expirationDate: parsed.expirationDate ?? null,
        cost: parsed.cost ?? null,
        status: parsed.status ?? 'Active',
        notes: parsed.notes ?? null,
      })
      .returning();

    return res.status(201).json(inserted);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * PUT /api/v1/licenses/:id
 * Updates license fields.
 */
export async function updateLicense(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid software license ID' });
    }

    const parsed = updateLicenseSchema.parse(req.body);

    const existing = await db
      .select()
      .from(softwareLicenses)
      .where(eq(softwareLicenses.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Software license not found' });
    }

    const updatePayload: Record<string, any> = {};
    if (parsed.name !== undefined) updatePayload.name = parsed.name;
    if (parsed.licenseKey !== undefined) updatePayload.licenseKey = parsed.licenseKey;
    if (parsed.licenseType !== undefined) updatePayload.licenseType = parsed.licenseType;
    if (parsed.vendorId !== undefined) updatePayload.vendorId = parsed.vendorId;
    if (parsed.totalSeats !== undefined) updatePayload.totalSeats = parsed.totalSeats;
    if (parsed.purchaseDate !== undefined) updatePayload.purchaseDate = parsed.purchaseDate;
    if (parsed.expirationDate !== undefined) updatePayload.expirationDate = parsed.expirationDate;
    if (parsed.cost !== undefined) updatePayload.cost = parsed.cost;
    if (parsed.status !== undefined) updatePayload.status = parsed.status;
    if (parsed.notes !== undefined) updatePayload.notes = parsed.notes;

    const [updated] = await db
      .update(softwareLicenses)
      .set(updatePayload)
      .where(eq(softwareLicenses.id, id))
      .returning();

    return res.status(200).json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * DELETE /api/v1/licenses/:id
 * Deletes software license and any associated allocations.
 */
export async function deleteLicense(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid software license ID' });
    }

    // Delete seat allocations first to prevent foreign key errors
    await db.delete(licenseAllocations).where(eq(licenseAllocations.licenseId, id));

    const deletedList = await db
      .delete(softwareLicenses)
      .where(eq(softwareLicenses.id, id))
      .returning();

    if (deletedList.length === 0) {
      return res.status(404).json({ error: 'Software license not found' });
    }

    return res.status(200).json({
      message: 'Software license deleted successfully',
      license: deletedList[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * POST /api/v1/licenses/:id/allocate
 * Inserts record in license_allocations, increments usedSeats on software_licenses.
 */
export async function allocateLicenseSeat(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid software license ID' });
    }

    const parsed = allocateSeatSchema.parse(req.body);

    const [license] = await db
      .select()
      .from(softwareLicenses)
      .where(eq(softwareLicenses.id, id))
      .limit(1);

    if (!license) {
      return res.status(404).json({ error: 'Software license not found' });
    }

    if (license.usedSeats >= license.totalSeats) {
      return res.status(400).json({ error: 'No available seats remaining for this license' });
    }

    const [allocation] = await db
      .insert(licenseAllocations)
      .values({
        licenseId: id,
        employeeId: parsed.employeeId ?? null,
        assetId: parsed.assetId ?? null,
        notes: parsed.notes ?? null,
      })
      .returning();

    const newUsedSeats = license.usedSeats + 1;
    await db
      .update(softwareLicenses)
      .set({ usedSeats: newUsedSeats })
      .where(eq(softwareLicenses.id, id));

    return res.status(201).json(allocation);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * POST /api/v1/licenses/:id/revoke
 * Deletes record from license_allocations, decrements usedSeats.
 */
export async function revokeLicenseSeat(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid software license ID' });
    }

    const { allocationId, employeeId, assetId } = req.body;

    const [license] = await db
      .select()
      .from(softwareLicenses)
      .where(eq(softwareLicenses.id, id))
      .limit(1);

    if (!license) {
      return res.status(404).json({ error: 'Software license not found' });
    }

    const conditions = [eq(licenseAllocations.licenseId, id)];

    if (allocationId) {
      const allocId = Number(allocationId);
      if (!isNaN(allocId)) {
        conditions.push(eq(licenseAllocations.id, allocId));
      }
    } else if (employeeId) {
      conditions.push(eq(licenseAllocations.employeeId, Number(employeeId)));
    } else if (assetId) {
      conditions.push(eq(licenseAllocations.assetId, Number(assetId)));
    }

    const [targetAllocation] = await db
      .select()
      .from(licenseAllocations)
      .where(and(...conditions))
      .limit(1);

    if (!targetAllocation) {
      return res.status(404).json({ error: 'License allocation record not found' });
    }

    const [deletedAllocation] = await db
      .delete(licenseAllocations)
      .where(eq(licenseAllocations.id, targetAllocation.id))
      .returning();

    const newUsedSeats = Math.max(0, license.usedSeats - 1);
    await db
      .update(softwareLicenses)
      .set({ usedSeats: newUsedSeats })
      .where(eq(softwareLicenses.id, id));

    return res.status(200).json({
      message: 'License seat allocation revoked successfully',
      allocation: deletedAllocation,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
