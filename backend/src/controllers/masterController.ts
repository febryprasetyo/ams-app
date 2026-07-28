import { Request, Response } from 'express';
import { db } from '../db';
import { departments, locations } from '../db/schema/master';
import { vendors } from '../db/schema/vendors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// --- Zod Schemas ---
const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  code: z.string().min(1, 'Department code is required').max(20),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  address: z.string().max(255).optional().nullable(),
});

const updateLocationSchema = createLocationSchema.partial();

const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(150),
  contactName: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
});

const updateVendorSchema = createVendorSchema.partial();

// --- Department Controllers ---
export async function getDepartments(req: Request, res: Response) {
  try {
    const list = await db.select().from(departments);
    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function createDepartment(req: Request, res: Response) {
  try {
    const parsed = createDepartmentSchema.parse(req.body);
    const [inserted] = await db.insert(departments).values(parsed).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function updateDepartment(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const parsed = updateDepartmentSchema.parse(req.body);
    const updatedList = await db
      .update(departments)
      .set(parsed)
      .where(eq(departments.id, id))
      .returning();

    if (updatedList.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    return res.status(200).json(updatedList[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function deleteDepartment(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const deletedList = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    if (deletedList.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    return res.status(200).json({ message: 'Department deleted successfully', department: deletedList[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

// --- Location Controllers ---
export async function getLocations(req: Request, res: Response) {
  try {
    const list = await db.select().from(locations);
    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function createLocation(req: Request, res: Response) {
  try {
    const parsed = createLocationSchema.parse(req.body);
    const [inserted] = await db.insert(locations).values(parsed).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function updateLocation(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const parsed = updateLocationSchema.parse(req.body);
    const updatedList = await db
      .update(locations)
      .set(parsed)
      .where(eq(locations.id, id))
      .returning();

    if (updatedList.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    return res.status(200).json(updatedList[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function deleteLocation(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const deletedList = await db
      .delete(locations)
      .where(eq(locations.id, id))
      .returning();

    if (deletedList.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    return res.status(200).json({ message: 'Location deleted successfully', location: deletedList[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

// --- Vendor Controllers ---
export async function getVendors(req: Request, res: Response) {
  try {
    const list = await db.select().from(vendors);
    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function createVendor(req: Request, res: Response) {
  try {
    const parsed = createVendorSchema.parse(req.body);
    const [inserted] = await db.insert(vendors).values(parsed).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function updateVendor(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vendor ID' });
    }

    const parsed = updateVendorSchema.parse(req.body);
    const updatedList = await db
      .update(vendors)
      .set(parsed)
      .where(eq(vendors.id, id))
      .returning();

    if (updatedList.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    return res.status(200).json(updatedList[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function deleteVendor(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vendor ID' });
    }

    const deletedList = await db
      .delete(vendors)
      .where(eq(vendors.id, id))
      .returning();

    if (deletedList.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    return res.status(200).json({ message: 'Vendor deleted successfully', vendor: deletedList[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
