import { Request, Response } from 'express';
import { db } from '../db';
import { employees } from '../db/schema/employees';
import { departments, locations } from '../db/schema/master';
import { eq, or, and, ne } from 'drizzle-orm';
import { z } from 'zod';

// --- Zod Schemas ---
const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required').max(50),
  fullName: z.string().min(1, 'Full name is required').max(150),
  email: z.string().email('Invalid email format').max(150),
  phone: z.string().max(50).optional().nullable(),
  departmentId: z.number().optional().nullable(),
  locationId: z.number().optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  status: z.string().max(30).optional().default('Active'),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

// --- Employee Controllers ---

/**
 * GET /api/v1/employees
 * Returns all employees with department and location names via LEFT JOINs.
 */
export async function getEmployees(req: Request, res: Response) {
  try {
    const list = await db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        locationId: employees.locationId,
        locationName: locations.name,
        position: employees.position,
        status: employees.status,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(locations, eq(employees.locationId, locations.id));

    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * GET /api/v1/employees/:id
 * Returns single employee by ID with department and location details.
 */
export async function getEmployeeById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const result = await db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        locationId: employees.locationId,
        locationName: locations.name,
        position: employees.position,
        status: employees.status,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(locations, eq(employees.locationId, locations.id))
      .where(eq(employees.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json(result[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * POST /api/v1/employees
 * Creates a new employee after validating input and checking unique constraints.
 */
export async function createEmployee(req: Request, res: Response) {
  try {
    const parsed = createEmployeeSchema.parse(req.body);

    // Check unique employeeCode and email
    const existing = await db
      .select()
      .from(employees)
      .where(or(eq(employees.employeeCode, parsed.employeeCode), eq(employees.email, parsed.email)))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].employeeCode === parsed.employeeCode) {
        return res.status(400).json({ error: 'Employee code already exists' });
      }
      if (existing[0].email === parsed.email) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const [inserted] = await db
      .insert(employees)
      .values({
        employeeCode: parsed.employeeCode,
        fullName: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone || null,
        departmentId: parsed.departmentId || null,
        locationId: parsed.locationId || null,
        position: parsed.position || null,
        status: parsed.status || 'Active',
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
 * PUT /api/v1/employees/:id
 * Updates an employee record after validating input and checking unique constraints.
 */
export async function updateEmployee(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const parsed = updateEmployeeSchema.parse(req.body);

    // Check uniqueness if employeeCode or email are provided
    if (parsed.employeeCode || parsed.email) {
      const uniqueConditions = [];
      if (parsed.employeeCode) uniqueConditions.push(eq(employees.employeeCode, parsed.employeeCode));
      if (parsed.email) uniqueConditions.push(eq(employees.email, parsed.email));

      const existing = await db
        .select()
        .from(employees)
        .where(and(ne(employees.id, id), or(...uniqueConditions)))
        .limit(1);

      if (existing.length > 0) {
        if (parsed.employeeCode && existing[0].employeeCode === parsed.employeeCode) {
          return res.status(400).json({ error: 'Employee code already exists' });
        }
        if (parsed.email && existing[0].email === parsed.email) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
    }

    const updatePayload: Record<string, any> = {
      ...parsed,
      updatedAt: new Date(),
    };

    const updatedList = await db
      .update(employees)
      .set(updatePayload)
      .where(eq(employees.id, id))
      .returning();

    if (updatedList.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json(updatedList[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * DELETE /api/v1/employees/:id
 * Deletes or soft-deactivates an employee record.
 */
export async function deleteEmployee(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const soft = req.query.soft === 'true' || req.body?.soft === true;

    if (soft) {
      const updatedList = await db
        .update(employees)
        .set({ status: 'Inactive', updatedAt: new Date() })
        .where(eq(employees.id, id))
        .returning();

      if (updatedList.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      return res.status(200).json({
        message: 'Employee soft-deactivated successfully',
        employee: updatedList[0],
      });
    }

    try {
      const deletedList = await db
        .delete(employees)
        .where(eq(employees.id, id))
        .returning();

      if (deletedList.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      return res.status(200).json({
        message: 'Employee deleted successfully',
        employee: deletedList[0],
      });
    } catch (dbErr: any) {
      // Fallback to soft deactivate if hard delete fails (e.g. foreign key constraint)
      const updatedList = await db
        .update(employees)
        .set({ status: 'Inactive', updatedAt: new Date() })
        .where(eq(employees.id, id))
        .returning();

      if (updatedList.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      return res.status(200).json({
        message: 'Employee referenced in external records; soft-deactivated instead of deleted',
        employee: updatedList[0],
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
