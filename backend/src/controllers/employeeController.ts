import { Request, Response } from 'express';
import { z } from 'zod';
import { eq, ne, or, and } from 'drizzle-orm';
import { db } from '../db';
import { employees } from '../db/schema/employees';
import { departments, locations } from '../db/schema/master';
import { isLifecycleStatus, normalizeEmployeeInput } from '../domain/employeeInput';
import { assessEmployeeDeletion, getAttendanceDeletionCheck } from '../domain/employeeDeletion';

// All 33 DB fields supported
const employeeFields = {
  id: employees.id,
  employeeCode: employees.employeeCode,
  fullName: employees.fullName,
  email: employees.email,
  phone: employees.phone,
  mobilePhone: employees.mobilePhone,
  secondaryPhone: employees.secondaryPhone,
  departmentId: employees.departmentId,
  locationId: employees.locationId,
  position: employees.position,
  jobLevel: employees.jobLevel,
  status: employees.status,
  employmentStatus: employees.employmentStatus,
  joinDate: employees.joinDate,
  birthDate: employees.birthDate,
  birthPlace: employees.birthPlace,
  age: employees.age,
  gender: employees.gender,
  religion: employees.religion,
  maritalStatus: employees.maritalStatus,
  bloodType: employees.bloodType,
  nationalityCode: employees.nationalityCode,
  nikKtp: employees.nikKtp,
  citizenIdAddress: employees.citizenIdAddress,
  residentialAddress: employees.residentialAddress,
  npwp: employees.npwp,
  npwp16Digit: employees.npwp16Digit,
  ptkpStatus: employees.ptkpStatus,
  employeeTaxStatus: employees.employeeTaxStatus,
  bankName: employees.bankName,
  bankAccount: employees.bankAccount,
  bankAccountHolder: employees.bankAccountHolder,
  bpjsKetenagakerjaan: employees.bpjsKetenagakerjaan,
  bpjsKesehatan: employees.bpjsKesehatan,
  barcode: employees.barcode,
  currency: employees.currency,
  lengthOfService: employees.lengthOfService,
  createdAt: employees.createdAt,
  updatedAt: employees.updatedAt,
};

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required').max(50),
  fullName: z.string().min(1, 'Full name is required').max(150),
  email: z.string().email('Invalid email').max(150).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  mobilePhone: z.string().max(50).optional().nullable(),
  secondaryPhone: z.string().max(50).optional().nullable(),
  departmentId: z.number('Department is required'),
  locationId: z.number().optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  jobLevel: z.string().max(100).optional().nullable(),
  status: z.string().refine(isLifecycleStatus, 'Invalid lifecycle status').optional().default('Active'),
  employmentStatus: z.string().trim().min(1, 'Status Employee is required').max(50),
  joinDate: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  birthPlace: z.string().max(100).optional().nullable(),
  age: z.string().max(50).optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  religion: z.string().max(30).optional().nullable(),
  maritalStatus: z.string().max(30).optional().nullable(),
  bloodType: z.string().max(10).optional().nullable(),
  nationalityCode: z.string().max(20).optional().nullable(),
  nikKtp: z.string().max(50).optional().nullable(),
  citizenIdAddress: z.string().optional().nullable(),
  residentialAddress: z.string().optional().nullable(),
  npwp: z.string().max(50).optional().nullable(),
  npwp16Digit: z.string().max(50).optional().nullable(),
  ptkpStatus: z.string().max(20).optional().nullable(),
  employeeTaxStatus: z.string().max(50).optional().nullable(),
  bankName: z.string().max(50).optional().nullable(),
  bankAccount: z.string().max(50).optional().nullable(),
  bankAccountHolder: z.string().max(150).optional().nullable(),
  bpjsKetenagakerjaan: z.string().max(50).optional().nullable(),
  bpjsKesehatan: z.string().max(50).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  currency: z.string().max(10).optional().nullable().default('IDR'),
  lengthOfService: z.string().max(100).optional().nullable(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

export async function getEmployees(req: Request, res: Response) {
  try {
    const list = await db
      .select({ ...employeeFields, departmentName: departments.name, departmentCode: departments.code, locationName: locations.name })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(locations, eq(employees.locationId, locations.id));
    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function getEmployeeById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });
    const result = await db
      .select({ ...employeeFields, departmentName: departments.name, departmentCode: departments.code, locationName: locations.name })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(locations, eq(employees.locationId, locations.id))
      .where(eq(employees.id, id))
      .limit(1);
    if (result.length === 0) return res.status(404).json({ error: 'Employee not found' });
    return res.status(200).json(result[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const parsed = normalizeEmployeeInput(createEmployeeSchema.parse(req.body));
    const existing = await db.select().from(employees)
      .where(parsed.email ? or(eq(employees.employeeCode, parsed.employeeCode), eq(employees.email, parsed.email)) : eq(employees.employeeCode, parsed.employeeCode)).limit(1);
    if (existing.length > 0) {
      if (existing[0].employeeCode === parsed.employeeCode) return res.status(400).json({ error: 'Employee code already exists' });
      if (parsed.email && existing[0].email === parsed.email) return res.status(400).json({ error: 'Email already exists' });
    }
    const [inserted] = await db.insert(employees).values({
      employeeCode: parsed.employeeCode, fullName: parsed.fullName, email: parsed.email,
      phone: parsed.phone || null, mobilePhone: parsed.mobilePhone || null, secondaryPhone: parsed.secondaryPhone || null,
      departmentId: parsed.departmentId || null, locationId: parsed.locationId || null,
      position: parsed.position || null, jobLevel: parsed.jobLevel || null,
      status: parsed.status || 'Active', employmentStatus: parsed.employmentStatus || null,
      joinDate: parsed.joinDate || null, birthDate: parsed.birthDate || null,
      birthPlace: parsed.birthPlace || null, age: parsed.age || null,
      gender: parsed.gender || null, religion: parsed.religion || null,
      maritalStatus: parsed.maritalStatus || null, bloodType: parsed.bloodType || null,
      nationalityCode: parsed.nationalityCode || null, nikKtp: parsed.nikKtp || null,
      citizenIdAddress: parsed.citizenIdAddress || null, residentialAddress: parsed.residentialAddress || null,
      npwp: parsed.npwp || null, npwp16Digit: parsed.npwp16Digit || null,
      ptkpStatus: parsed.ptkpStatus || null, employeeTaxStatus: parsed.employeeTaxStatus || null,
      bankName: parsed.bankName || null, bankAccount: parsed.bankAccount || null,
      bankAccountHolder: parsed.bankAccountHolder || null,
      bpjsKetenagakerjaan: parsed.bpjsKetenagakerjaan || null, bpjsKesehatan: parsed.bpjsKesehatan || null,
      barcode: parsed.barcode || null, currency: parsed.currency || 'IDR', lengthOfService: parsed.lengthOfService || null,
    }).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });
    const parsed = normalizeEmployeeInput(updateEmployeeSchema.parse(req.body));
    if (parsed.employeeCode || parsed.email) {
      const uniqueConditions = [];
      if (parsed.employeeCode) uniqueConditions.push(eq(employees.employeeCode, parsed.employeeCode));
      if (parsed.email) uniqueConditions.push(eq(employees.email, parsed.email));
      const existing = await db.select().from(employees)
        .where(and(ne(employees.id, id), or(...uniqueConditions))).limit(1);
      if (existing.length > 0) {
        if (parsed.employeeCode && existing[0].employeeCode === parsed.employeeCode) return res.status(400).json({ error: 'Employee code already exists' });
        if (parsed.email && existing[0].email === parsed.email) return res.status(400).json({ error: 'Email already exists' });
      }
    }
    const updatedList = await db.update(employees)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(employees.id, id)).returning();
    if (updatedList.length === 0) return res.status(404).json({ error: 'Employee not found' });
    return res.status(200).json(updatedList[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function deleteEmployee(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });
    const decision = assessEmployeeDeletion({ attendanceCheck: await getAttendanceDeletionCheck(id) });
    if (!decision.allowed) return res.status(409).json({ error: decision.message });
    const deletedList = await db.delete(employees).where(eq(employees.id, id)).returning();
    if (deletedList.length === 0) return res.status(404).json({ error: 'Employee not found' });
    return res.status(200).json({ message: 'Employee deleted successfully', employee: deletedList[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
