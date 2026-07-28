import { pgTable, bigint, varchar, timestamp } from 'drizzle-orm/pg-core';
import { departments, locations } from './master';

export const employees = pgTable('employees', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  employeeCode: varchar('employee_number', { length: 50 }).notNull().unique(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  departmentId: bigint('department_id', { mode: 'number' }).references(() => departments.id),
  locationId: bigint('location_id', { mode: 'number' }).references(() => locations.id),
  position: varchar('position', { length: 100 }),
  status: varchar('status', { length: 30 }).default('Active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
