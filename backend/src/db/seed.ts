import { db } from './index';
import { roles, users, permissions, rolePermissions } from './schema/users';
import { departments, locations } from './schema/master';
import { vendors } from './schema/vendors';
import { employees } from './schema/employees';
import { assetCategories, assets } from './schema/assets';
import { ticketCategories, slaPolicies, itTickets, ticketComments } from './schema/tickets';
import { softwareLicenses, licenseAllocations } from './schema/licenses';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DEFAULT_IT_EQUIPMENT_TYPES, shouldSeedDefaultEquipmentTypes } from '../domain/equipmentTypes';
import {
  DEFAULT_TICKET_CATEGORIES,
  DEFAULT_SLA_POLICIES,
  shouldSeedDefaultTicketCategories,
  shouldSeedDefaultSlaPolicies,
} from '../domain/ticketCategories';
import { DEFAULT_PERMISSIONS } from '../domain/rbac';

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

    CREATE TABLE IF NOT EXISTS permissions (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      code varchar(100) NOT NULL UNIQUE,
      name varchar(150) NOT NULL,
      module varchar(50) NOT NULL,
      description varchar(255),
      created_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id bigint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id bigint NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      assigned_at timestamp DEFAULT now() NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    );
  `);

  await db.execute(`
    ALTER TABLE ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_tickets_id_fk;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS type varchar(20) DEFAULT 'Incident' NOT NULL;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS resolution_notes text;
    ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false NOT NULL;
    ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS vendor_id bigint REFERENCES vendors(id);
    ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id bigint REFERENCES roles(id);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id bigint REFERENCES employees(id) ON DELETE SET NULL;
  `);
  console.log('  ✓ Verified table columns in database');

  // 1. Seed Roles
  const defaultRoles = [
    { code: 'super_admin', name: 'SuperAdmin', description: 'Full system access and security administration', isSystem: true },
    { code: 'it_admin', name: 'ITAdmin', description: 'IT asset, ticket, and infrastructure management', isSystem: true },
    { code: 'it_staff', name: 'ITStaff', description: 'IT service desk technician and maintenance staff', isSystem: true },
    { code: 'employee', name: 'Employee', description: 'Standard employee user for submitting IT tickets', isSystem: true },
    { code: 'management', name: 'Management', description: 'Read-only executive dashboard and reporting access', isSystem: true },
  ];

  for (const role of defaultRoles) {
    const existing = await db.select().from(roles).where(eq(roles.code, role.code));
    if (existing.length === 0) {
      await db.insert(roles).values(role);
      console.log(`  ✓ Inserted role: ${role.name}`);
    } else {
      await db.update(roles).set({ isSystem: role.isSystem }).where(eq(roles.id, existing[0].id));
    }
  }

  // 1b. Seed Permissions Catalog
  for (const perm of DEFAULT_PERMISSIONS) {
    const existing = await db.select().from(permissions).where(eq(permissions.code, perm.code));
    if (existing.length === 0) {
      await db.insert(permissions).values(perm);
    }
  }
  console.log('  ✓ Verified permissions catalog');

  // 1c. Seed Role Permissions for SuperAdmin
  const superAdminRole = (await db.select().from(roles).where(eq(roles.code, 'super_admin')))[0];
  if (superAdminRole) {
    const allPerms = await db.select().from(permissions);
    for (const p of allPerms) {
      await db.execute(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${superAdminRole.id}, ${p.id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
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
      roleId: superAdminRole?.id,
      status: 'active',
    }).returning();
    superAdminUser = inserted;
    console.log('  ✓ Created SuperAdmin User (admin@company.com / Admin123!)');
  } else if (superAdminRole && !superAdminUser.roleId) {
    await db.update(users).set({ roleId: superAdminRole.id }).where(eq(users.id, superAdminUser.id));
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
    { code: 'CMC', name: 'Cahaya Mas Cemerlang', address: '' },
    { code: 'ARV', name: 'Arvirotech', address: '' },
    { code: 'MGM', name: 'Multi Gas medika', address: '' },
  ];

  for (const loc of defaultLocations) {
    const existing = await db.select().from(locations).where(eq(locations.code, loc.code));
    if (existing.length === 0) {
      await db.insert(locations).values(loc);
      console.log(`  ✓ Inserted location: ${loc.name}`);
    }
  }

  // 4a. Seed IT Equipment Types
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
  ];

  for (const vnd of defaultVendors) {
    const existing = await db.select().from(vendors).where(eq(vendors.name, vnd.name));
    if (existing.length === 0) {
      await db.insert(vendors).values(vnd);
      console.log(`  ✓ Inserted vendor: ${vnd.name}`);
    }
  }

  // 4c. Seed Ticket Categories
  const insertedTicketCategories = await db.transaction(async (tx) => {
    const existingCats = await tx
      .select({ id: ticketCategories.id })
      .from(ticketCategories)
      .limit(1);
    if (!shouldSeedDefaultTicketCategories(existingCats.length)) return [];

    return tx.insert(ticketCategories).values([...DEFAULT_TICKET_CATEGORIES]).returning();
  });
  for (const cat of insertedTicketCategories) {
    console.log(`  ✓ Inserted ticket category: ${cat.name}`);
  }

  // 4d. Seed SLA Policies
  const insertedSlaPolicies = await db.transaction(async (tx) => {
    const existingPolicies = await tx
      .select({ id: slaPolicies.id })
      .from(slaPolicies)
      .limit(1);
    if (!shouldSeedDefaultSlaPolicies(existingPolicies.length)) return [];

    return tx.insert(slaPolicies).values([...DEFAULT_SLA_POLICIES]).returning();
  });
  for (const sla of insertedSlaPolicies) {
    console.log(`  ✓ Inserted SLA policy: ${sla.priority}`);
  }

  console.log('✅ Database Seed Procedure Completed Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Database Seed Failed:', err);
  process.exit(1);
});
