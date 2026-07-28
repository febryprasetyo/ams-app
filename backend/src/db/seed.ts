import { db } from './index';
import { roles, users } from './schema/users';
import { departments, locations } from './schema/master';
import { employees } from './schema/employees';
import { assetCategories, assets, assetAssignmentHistory } from './schema/assets';
import { ticketCategories, slaPolicies } from './schema/tickets';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting Database Seed Procedure with Dummy Assets & Transfer Tracking...');

  // 0. Ensure asset_assignment_history table exists in PostgreSQL
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
      handover_notes text,
      return_notes text
    );
  `);
  console.log('  ✓ Verified asset_assignment_history table in database');

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
  const adminRole = await db.select().from(roles).where(eq(roles.code, 'super_admin')).limit(1);
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

  // Fetch created departments and locations for FK referencing
  const allDepts = await db.select().from(departments);
  const allLocs = await db.select().from(locations);
  const itDept = allDepts.find((d) => d.code === 'IT') || allDepts[0];
  const finDept = allDepts.find((d) => d.code === 'FIN') || allDepts[0];
  const hrDept = allDepts.find((d) => d.code === 'HR') || allDepts[0];
  const opsDept = allDepts.find((d) => d.code === 'OPS') || allDepts[0];
  const jktLoc = allLocs.find((l) => l.code === 'JKT-HO') || allLocs[0];
  const subLoc = allLocs.find((l) => l.code === 'SUB-BO') || allLocs[0];

  // 5. Seed Dummy Employees
  const dummyEmployeesData = [
    { employeeCode: 'EMP-001', fullName: 'Budi Santoso', email: 'budi.santoso@company.com', phone: '+628123456781', departmentId: itDept.id, locationId: jktLoc.id, position: 'Senior Software Engineer', status: 'Active' },
    { employeeCode: 'EMP-002', fullName: 'Ahmad Hidayat', email: 'ahmad.hidayat@company.com', phone: '+628123456782', departmentId: opsDept.id, locationId: jktLoc.id, position: 'Operations Manager', status: 'Active' },
    { employeeCode: 'EMP-003', fullName: 'Siti Rahma', email: 'siti.rahma@company.com', phone: '+628123456783', departmentId: finDept.id, locationId: subLoc.id, position: 'Financial Analyst', status: 'Active' },
    { employeeCode: 'EMP-004', fullName: 'Dewi Lestari', email: 'dewi.lestari@company.com', phone: '+628123456784', departmentId: hrDept.id, locationId: jktLoc.id, position: 'HR Specialist', status: 'Active' },
    { employeeCode: 'EMP-005', fullName: 'Eko Prasetyo', email: 'eko.prasetyo@company.com', phone: '+628123456785', departmentId: itDept.id, locationId: jktLoc.id, position: 'System Architect', status: 'Active' },
  ];

  for (const empData of dummyEmployeesData) {
    const existing = await db.select().from(employees).where(eq(employees.employeeCode, empData.employeeCode));
    if (existing.length === 0) {
      await db.insert(employees).values(empData);
      console.log(`  ✓ Inserted employee: ${empData.fullName} (${empData.employeeCode})`);
    }
  }

  const allEmps = await db.select().from(employees);
  const empBudi = allEmps.find((e) => e.employeeCode === 'EMP-001') || allEmps[0];
  const empAhmad = allEmps.find((e) => e.employeeCode === 'EMP-002') || allEmps[0];
  const empSiti = allEmps.find((e) => e.employeeCode === 'EMP-003') || allEmps[0];
  const empDewi = allEmps.find((e) => e.employeeCode === 'EMP-004') || allEmps[0];
  const empEko = allEmps.find((e) => e.employeeCode === 'EMP-005') || allEmps[0];

  // 6. Seed Asset Categories
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

  const allCats = await db.select().from(assetCategories);
  const catLaptop = allCats.find((c) => c.codePrefix === 'LPT') || allCats[0];
  const catPC = allCats.find((c) => c.codePrefix === 'PC') || allCats[0];
  const catMonitor = allCats.find((c) => c.codePrefix === 'MON') || allCats[0];
  const catServer = allCats.find((c) => c.codePrefix === 'SVR') || allCats[0];

  // 7. Seed Dummy IT Assets & Device Tracking Transfers
  const dummyAssetsData = [
    {
      assetCode: 'LPT-2026-0001',
      name: 'MacBook Pro 16" M3 Max (36GB RAM / 1TB SSD)',
      categoryId: catLaptop.id,
      locationId: jktLoc.id,
      assignedToEmployeeId: empBudi.id,
      serialNumber: 'C02G1234MD6R',
      status: 'Assigned',
      condition: 'Good',
      notes: 'High-performance engineering laptop for Senior Software Engineer',
    },
    {
      assetCode: 'LPT-2026-0002',
      name: 'Dell XPS 15 9530 (i7-13700H / 32GB RAM / RTX 4060)',
      categoryId: catLaptop.id,
      locationId: subLoc.id,
      assignedToEmployeeId: empSiti.id,
      serialNumber: 'DL-XPS-998811',
      status: 'Assigned',
      condition: 'Good',
      notes: 'Financial workstation assigned to Branch Office Analyst',
    },
    {
      assetCode: 'PC-2026-0001',
      name: 'Custom AI Workstation (i9-14900K / 64GB DDR5 / RTX 4090)',
      categoryId: catPC.id,
      locationId: jktLoc.id,
      assignedToEmployeeId: null,
      serialNumber: 'WS-2026-RTX4090',
      status: 'Available',
      condition: 'Good',
      notes: 'AI Model training workstation returned to IT pool after project completion',
    },
    {
      assetCode: 'MON-2026-0001',
      name: 'Dell UltraSharp 27" 4K USB-C Monitor (U2723QE)',
      categoryId: catMonitor.id,
      locationId: jktLoc.id,
      assignedToEmployeeId: empBudi.id,
      serialNumber: 'CN-0V8N12-74261',
      status: 'Assigned',
      condition: 'Good',
      notes: 'Paired with MacBook Pro workstation',
    },
    {
      assetCode: 'SVR-2026-0001',
      name: 'Dell PowerEdge R760 Rack Server (2x Xeon Gold / 256GB RAM)',
      categoryId: catServer.id,
      locationId: jktLoc.id,
      assignedToEmployeeId: null,
      serialNumber: 'PE-R760-JAK-01',
      status: 'Assigned',
      condition: 'Good',
      notes: 'Core ERP & Accurate 5 Database Server Host',
    },
  ];

  for (const astData of dummyAssetsData) {
    const existing = await db.select().from(assets).where(eq(assets.assetCode, astData.assetCode));
    let assetObj = existing[0];

    if (!assetObj) {
      const [inserted] = await db.insert(assets).values(astData).returning();
      assetObj = inserted;
      console.log(`  ✓ Inserted asset: ${astData.name} (${astData.assetCode})`);
    }

    // Insert Device Tracking History for MacBook Pro (LPT-2026-0001)
    if (astData.assetCode === 'LPT-2026-0001') {
      const existingHistory = await db
        .select()
        .from(assetAssignmentHistory)
        .where(eq(assetAssignmentHistory.assetId, assetObj.id));

      if (existingHistory.length === 0) {
        // Historical Transfer 1: Used by Ahmad Hidayat (OPS Dept) then returned
        await db.insert(assetAssignmentHistory).values({
          assetId: assetObj.id,
          employeeId: empAhmad.id,
          assignedByUserId: superAdminUser.id,
          assignedAt: new Date('2025-01-15T09:00:00Z'),
          returnedAt: new Date('2025-08-20T17:00:00Z'),
          conditionOnAssign: 'New / Sealed',
          conditionOnReturn: 'Good (Minor sticker residue on lid)',
          handoverNotes: 'Initial device provision for Operations Manager onboarding',
          returnNotes: 'Returned to IT upon department role reallocation',
        });

        // Historical Transfer 2: Reassigned to Budi Santoso (Current Active Owner)
        await db.insert(assetAssignmentHistory).values({
          assetId: assetObj.id,
          employeeId: empBudi.id,
          assignedByUserId: superAdminUser.id,
          assignedAt: new Date('2025-08-25T10:00:00Z'),
          returnedAt: null,
          conditionOnAssign: 'Good',
          conditionOnReturn: null,
          handoverNotes: 'Reassigned to Budi Santoso for Senior Software Engineer workload',
          returnNotes: null,
        });

        console.log('  ✓ Seeded Device Transfer Tracking History for LPT-2026-0001 (Ahmad Hidayat -> Budi Santoso)');
      }
    }

    // Insert Device Tracking History for Dell XPS (LPT-2026-0002)
    if (astData.assetCode === 'LPT-2026-0002') {
      const existingHistory = await db
        .select()
        .from(assetAssignmentHistory)
        .where(eq(assetAssignmentHistory.assetId, assetObj.id));

      if (existingHistory.length === 0) {
        // Historical Transfer 1: Used by Dewi Lestari (HR) then returned
        await db.insert(assetAssignmentHistory).values({
          assetId: assetObj.id,
          employeeId: empDewi.id,
          assignedByUserId: superAdminUser.id,
          assignedAt: new Date('2024-11-01T08:30:00Z'),
          returnedAt: new Date('2025-05-10T16:00:00Z'),
          conditionOnAssign: 'New',
          conditionOnReturn: 'Fair (Spacebar key sticky)',
          handoverNotes: 'Assigned for HR Payroll & Recruiting tasks',
          returnNotes: 'Returned for IT keyboard replacement',
        });

        // Historical Transfer 2: Reassigned to Siti Rahma (Current Active Owner)
        await db.insert(assetAssignmentHistory).values({
          assetId: assetObj.id,
          employeeId: empSiti.id,
          assignedByUserId: superAdminUser.id,
          assignedAt: new Date('2025-06-01T09:15:00Z'),
          returnedAt: null,
          conditionOnAssign: 'Good (Key replacement completed)',
          handoverNotes: 'Reassigned for Branch Office Financial Analyst workstation',
          returnNotes: null,
        });

        console.log('  ✓ Seeded Device Transfer Tracking History for LPT-2026-0002 (Dewi Lestari -> Siti Rahma)');
      }
    }

    // Insert Device Tracking History for Custom PC (PC-2026-0001)
    if (astData.assetCode === 'PC-2026-0001') {
      const existingHistory = await db
        .select()
        .from(assetAssignmentHistory)
        .where(eq(assetAssignmentHistory.assetId, assetObj.id));

      if (existingHistory.length === 0) {
        await db.insert(assetAssignmentHistory).values({
          assetId: assetObj.id,
          employeeId: empEko.id,
          assignedByUserId: superAdminUser.id,
          assignedAt: new Date('2025-02-01T10:00:00Z'),
          returnedAt: new Date('2026-07-01T17:00:00Z'),
          conditionOnAssign: 'New',
          conditionOnReturn: 'Good',
          handoverNotes: 'Assigned to System Architect for AI Model training cluster testing',
          returnNotes: 'Returned to IT available stock after project delivery',
        });

        console.log('  ✓ Seeded Device Transfer Tracking History for PC-2026-0001 (Eko Prasetyo -> Stock)');
      }
    }
  }

  // 8. Seed SLA Policies
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
