import { db } from './index';
import { roles, users } from './schema/users';
import { departments, locations } from './schema/master';
import { assetCategories } from './schema/assets';
import { ticketCategories, slaPolicies } from './schema/tickets';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting Database Seed Procedure...');

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
      console.log(`  ✓ Inserted role: ${role.name} (${role.code})`);
    }
  }

  // 2. Seed SuperAdmin User
  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@company.com'));
  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await db.insert(users).values({
      username: 'System SuperAdmin',
      email: 'admin@company.com',
      passwordHash,
      role: 'SuperAdmin',
      status: 'active',
    });
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

  // 5. Seed Asset Categories
  const defaultAssetCategories = [
    { name: 'Laptop', codePrefix: 'LPT' },
    { name: 'Desktop PC', codePrefix: 'PC' },
    { name: 'Monitor', codePrefix: 'MON' },
    { name: 'Printer', codePrefix: 'PRN' },
    { name: 'Server Physical/VM', codePrefix: 'SVR' },
    { name: 'Network Device', codePrefix: 'NET' },
  ];

  for (const cat of defaultAssetCategories) {
    const existing = await db.select().from(assetCategories).where(eq(assetCategories.name, cat.name));
    if (existing.length === 0) {
      await db.insert(assetCategories).values(cat);
      console.log(`  ✓ Inserted asset category: ${cat.name}`);
    }
  }

  // 6. Seed SLA Policies
  const defaultSLA = [
    { priority: 'Low', targetResponseHours: 8, targetResolutionHours: 48 },
    { priority: 'Medium', targetResponseHours: 4, targetResolutionHours: 24 },
    { priority: 'High', targetResponseHours: 2, targetResolutionHours: 8 },
    { priority: 'Critical', targetResponseHours: 1, targetResolutionHours: 2 },
  ];

  for (const sla of defaultSLA) {
    const existing = await db.select().from(slaPolicies).where(eq(slaPolicies.priority, sla.priority));
    if (existing.length === 0) {
      await db.insert(slaPolicies).values(sla as any);
      console.log(`  ✓ Inserted SLA policy: ${sla.priority}`);
    }
  }

  console.log('✅ Database Seed Procedure Completed Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Database Seed Failed:', err);
  process.exit(1);
});
