import { Request, Response } from 'express';
import { db } from '../db';
import { assets, assetCategories } from '../db/schema/assets';
import { locations } from '../db/schema/master';
import { employees } from '../db/schema/employees';
import { eq, ilike, or, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// --- Zod Schemas ---
const createCategorySchema = z
  .object({
    name: z.string().min(1, 'Category name is required').max(100),
    codePrefix: z.string().min(1, 'Code prefix is required').max(20).optional(),
    code: z.string().min(1).max(20).optional(),
  })
  .refine((data) => !!(data.codePrefix || data.code), {
    message: 'Code prefix is required',
    path: ['codePrefix'],
  });

const createAssetSchema = z.object({
  assetCode: z.string().max(50).optional().nullable(),
  name: z.string().min(1, 'Asset name is required').max(150),
  categoryId: z.number({ message: 'Category ID is required' }),
  locationId: z.number().optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  status: z.enum(['Available', 'Assigned', 'Maintenance', 'Disposed', 'Lost']).default('Available'),
  condition: z.enum(['Good', 'Fair', 'Poor', 'Damaged']).default('Good'),
  notes: z.string().optional().nullable(),
});

const updateAssetSchema = z.object({
  assetCode: z.string().max(50).optional(),
  name: z.string().min(1).max(150).optional(),
  categoryId: z.number().optional(),
  locationId: z.number().optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  status: z.enum(['Available', 'Assigned', 'Maintenance', 'Disposed', 'Lost']).optional(),
  condition: z.enum(['Good', 'Fair', 'Poor', 'Damaged']).optional(),
  notes: z.string().optional().nullable(),
});

// --- Auto Code Generator Helper ---
async function generateAssetCode(categoryId: number): Promise<string> {
  const [category] = await db
    .select()
    .from(assetCategories)
    .where(eq(assetCategories.id, categoryId));

  if (!category) {
    throw new Error('Category not found');
  }

  const prefix = (category.codePrefix || 'AST').toUpperCase();
  const year = new Date().getFullYear().toString();
  const pattern = `${prefix}-${year}-%`;

  const existingAssets = await db
    .select({ assetCode: assets.assetCode })
    .from(assets)
    .where(ilike(assets.assetCode, pattern));

  let maxSeq = 0;
  const regex = new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i');

  for (const item of existingAssets) {
    const match = item.assetCode.match(regex);
    if (match) {
      const seqNum = parseInt(match[1], 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqFormatted = String(nextSeq).padStart(4, '0');
  return `${prefix}-${year}-${seqFormatted}`;
}

// --- Category Controllers ---
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await db.select().from(assetCategories).orderBy(assetCategories.id);
    return res.status(200).json(categories);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const parsed = createCategorySchema.parse(req.body);
    const prefix = (parsed.codePrefix || parsed.code || '').toUpperCase();

    const [inserted] = await db
      .insert(assetCategories)
      .values({
        name: parsed.name,
        codePrefix: prefix,
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

// --- Asset Controllers ---
export async function getAssets(req: Request, res: Response) {
  try {
    const { search, categoryId, locationId, status } = req.query;

    const conditions = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(assets.name, searchPattern),
          ilike(assets.assetCode, searchPattern),
          ilike(assets.serialNumber, searchPattern)
        )
      );
    }

    if (categoryId) {
      const catId = Number(categoryId);
      if (!isNaN(catId)) {
        conditions.push(eq(assets.categoryId, catId));
      }
    }

    if (locationId) {
      const locId = Number(locationId);
      if (!isNaN(locId)) {
        conditions.push(eq(assets.locationId, locId));
      }
    }

    if (status && typeof status === 'string' && status.trim() !== '') {
      conditions.push(eq(assets.status, status.trim()));
    }

    const query = db
      .select({
        id: assets.id,
        assetCode: assets.assetCode,
        name: assets.name,
        categoryId: assets.categoryId,
        categoryName: assetCategories.name,
        categoryCodePrefix: assetCategories.codePrefix,
        locationId: assets.locationId,
        locationName: locations.name,
        assignedToEmployeeId: assets.assignedToEmployeeId,
        assignedEmployeeName: employees.fullName,
        assignedEmployeeCode: employees.employeeCode,
        serialNumber: assets.serialNumber,
        status: assets.status,
        condition: assets.condition,
        notes: assets.notes,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(locations, eq(assets.locationId, locations.id))
      .leftJoin(employees, eq(assets.assignedToEmployeeId, employees.id));

    const result = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(assets.id))
      : await query.orderBy(desc(assets.id));

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function getAssetById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid asset ID' });
    }

    const result = await db
      .select({
        id: assets.id,
        assetCode: assets.assetCode,
        name: assets.name,
        categoryId: assets.categoryId,
        categoryName: assetCategories.name,
        categoryCodePrefix: assetCategories.codePrefix,
        locationId: assets.locationId,
        locationName: locations.name,
        assignedToEmployeeId: assets.assignedToEmployeeId,
        assignedEmployeeName: employees.fullName,
        assignedEmployeeCode: employees.employeeCode,
        serialNumber: assets.serialNumber,
        status: assets.status,
        condition: assets.condition,
        notes: assets.notes,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(locations, eq(assets.locationId, locations.id))
      .leftJoin(employees, eq(assets.assignedToEmployeeId, employees.id))
      .where(eq(assets.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.status(200).json(result[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function createAsset(req: Request, res: Response) {
  try {
    const parsed = createAssetSchema.parse(req.body);

    let code = parsed.assetCode;
    if (!code || code.trim() === '') {
      code = await generateAssetCode(parsed.categoryId);
    }

    const [inserted] = await db
      .insert(assets)
      .values({
        assetCode: code,
        name: parsed.name,
        categoryId: parsed.categoryId,
        locationId: parsed.locationId ?? null,
        serialNumber: parsed.serialNumber ?? null,
        status: parsed.status,
        condition: parsed.condition,
        notes: parsed.notes ?? null,
      })
      .returning();

    return res.status(201).json(inserted);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    if (err.message === 'Category not found') {
      return res.status(400).json({ error: 'Invalid categoryId: Category not found' });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function updateAsset(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid asset ID' });
    }

    const parsed = updateAssetSchema.parse(req.body);
    const updatedList = await db
      .update(assets)
      .set({
        ...parsed,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();

    if (updatedList.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.status(200).json(updatedList[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function deleteAsset(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid asset ID' });
    }

    const deletedList = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning();

    if (deletedList.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.status(200).json({ message: 'Asset deleted successfully', asset: deletedList[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
