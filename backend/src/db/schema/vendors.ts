import { pgTable, bigint, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const vendors = pgTable('vendors', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 150 }).notNull(),
  contactName: varchar('contact_name', { length: 100 }),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
