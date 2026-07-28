import { pgTable, bigint, varchar, timestamp } from 'drizzle-orm/pg-core';

export const departments = pgTable('departments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const locations = pgTable('locations', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull(),
  address: varchar('address', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
