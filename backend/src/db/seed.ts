import { db } from './index';
import { roles, users } from './schema/users';
import { departments, locations } from './schema/master';
import { vendors } from './schema/vendors';
import { employees } from './schema/employees';
import { assetCategories, assets } from './schema/assets';
import { ticketCategories, slaPolicies, itTickets, ticketComments } from './schema/tickets';
import { softwareLicenses, licenseAllocations } from './schema/licenses';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DEFAULT_IT_EQUIPMENT_TYPES, shouldSeedDefaultEquipmentTypes } from '../domain/equipmentTypes';

async function seed() {
  console.log('🌱 Starting database seed procedure...');

  // 0. Ensure custom tables & columns exist in PostgreSQL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS asset_assignment_history (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      asset_id bigint NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      employee_id bigint REFERENCES employees(id),
      assigned_by_user_id bigint REFERENCES users(id),
      assigned_at timestamp DEFAULT now() NOT NULL,
      returned_at timestamp,
      condition_on_assign varchar(50) DEFAULT 'Good' NOT NULL,
      condition_on_return varchar(50),
      handoverNotes text,
      returnNotes text
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      ticket_id bigint NOT NULL REFERENCES it_tickets(id) ON DELETE CASCADE,
      user_id bigint NOT NULL REFERENCES users(id),
      comment_text text NOT NULL,
      is_internal boolean DEFAULT false NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS software_licenses (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      license_name varchar(150) NOT NULL,
      license_key varchar(255),
      license_type varchar(50),
      vendor_id bigint REFERENCES vendors(id),
      total_seats integer DEFAULT 1 NOT NULL,
      used_seats integer DEFAULT 0 NOT NULL,
      purchase_date timestamp,
      expiry_date timestamp,
      purchase_price numeric,
      status varchar(30) DEFAULT 'Active' NOT NULL,
      notes text,
      created_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS license_allocations (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      license_id bigint REFERENCES software_licenses(id) ON DELETE CASCADE,
      employee_id bigint REFERENCES employees(id),
      asset_id bigint REFERENCES assets(id),
      allocated_at timestamp DEFAULT now() NOT NULL,
      notes text
    );
  `);

  await db.execute(`
    ALTER TABLE ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_tickets_id_fk;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS type varchar(20) DEFAULT 'Incident' NOT NULL;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS resolution_notes text;
    ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false NOT NULL;
    ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS vendor_id bigint REFERENCES vendors(id);
  `);
  console.log('  ✓ Verified table columns in database');

  // 1. Seed Roles
  const defaultRoles = [
    { code: 'super_admin', name: 'SuperAdmin', description: 'Full system access and security administration' },
    { code: 'it_admin', name: 'ITAdmin', description: 'IT asset, ticket, and infrastructure management' },
    { code: 'it_staff', name: 'ITStaff', description: 'IT service desk technician and maintenance staff' },
    { code: 'employee', name: 'Employee', description: 'Standard employee user for submitting IT tickets' },
    { code: 'management', name: 'Management', description: 'Read-only executive dashboard and reporting access' },
  ];

  for (const role of defaultRoles) {
    const existing = await db.select().from(roles).where(eq(roles.code, role.code));
    if (existing.length === 0) {
      await db.insert(roles).values(role);
      console.log(`  ✓ Inserted role: ${role.name}`);
    }
  }

  // 2. Seed SuperAdmin User
  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@company.com'));
  let superAdminUser = existingAdmin[0];
  if (!superAdminUser) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const [inserted] = await db.insert(users).values({
      username: 'System SuperAdmin',
      email: 'admin@company.com',
      passwordHash,
      role: 'SuperAdmin',
      status: 'active',
    }).returning();
    superAdminUser = inserted;
    console.log('  ✓ Created SuperAdmin User (admin@company.com / Admin123!)');
  }

  // 3. Seed Departments
  const defaultDepartments = [
    { name: 'Information Technology', code: 'IT' },
    { name: 'Finance & Accounting', code: 'FIN' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Operations & Logistics', code: 'OPS' },
  ];

  for (const dept of defaultDepartments) {
    const existing = await db.select().from(departments).where(eq(departments.code, dept.code));
    if (existing.length === 0) {
      await db.insert(departments).values(dept);
      console.log(`  ✓ Inserted department: ${dept.name}`);
    }
  }

  // 4. Seed Locations
  const defaultLocations = [
    { code: 'JKT-HO', name: 'Head Office Jakarta', address: 'Jl. Jend. Sudirman No. 1, Jakarta' },
    { code: 'SUB-BO', name: 'Branch Office Surabaya', address: 'Jl. Pemuda No. 45, Surabaya' },
  ];

  for (const loc of defaultLocations) {
    const existing = await db.select().from(locations).where(eq(locations.code, loc.code));
    if (existing.length === 0) {
      await db.insert(locations).values(loc);
      console.log(`  ✓ Inserted location: ${loc.name}`);
    }
  }

  // 4a. Seed the initial catalog; ongoing maintenance happens in the web app.
  const insertedEquipmentTypes = await db.transaction(async (tx) => {
    const existingEquipmentTypes = await tx
      .select({ id: assetCategories.id })
      .from(assetCategories)
      .limit(1);
    if (!shouldSeedDefaultEquipmentTypes(existingEquipmentTypes.length)) return [];

    return tx.insert(assetCategories).values([...DEFAULT_IT_EQUIPMENT_TYPES]).returning();
  });
  for (const equipmentType of insertedEquipmentTypes) {
    console.log(`  ✓ Inserted IT equipment type: ${equipmentType.name}`);
  }

  // 4b. Seed Vendors
  const defaultVendors = [
    { name: 'Schneider Electric / AVEVA', contactName: 'Sales Schneider ID', email: 'sales.id@se.com', phone: '+6221500800', address: 'Jakarta' },
    { name: 'Microsoft Corporation Indonesia', contactName: 'Volume Licensing Team', email: 'ms-licensing@microsoft.com', phone: '+62215155111', address: 'Jakarta' },
    { name: 'Dell Technologies Indonesia', contactName: 'Enterprise Account Rep', email: 'sales@dell.co.id', phone: '+62211500858', address: 'Jakarta' },
  ];

  for (const vnd of defaultVendors) {
    const existing = await db.select().from(vendors).where(eq(vendors.name, vnd.name));
    if (existing.length === 0) {
      await db.insert(vendors).values(vnd);
      console.log(`  ✓ Inserted vendor: ${vnd.name}`);
    }
  }

  console.log('✅ Database Seed Procedure Completed Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Database Seed Failed:', err);
  process.exit(1);
});
