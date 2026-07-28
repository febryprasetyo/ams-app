import { db } from './index';
import { roles, users } from './schema/users';
import { departments, locations } from './schema/master';
import { employees } from './schema/employees';
import { assetCategories, assets } from './schema/assets';
import { ticketCategories, slaPolicies, itTickets, ticketComments } from './schema/tickets';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting Database Seed Procedure with Dummy Assets, Transfers, and Tickets...');

  // 0. Ensure asset_assignment_history, ticket_comments, and missing columns exist in PostgreSQL
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
  `);
  console.log('  ✓ Verified asset_assignment_history table in database');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      ticket_id bigint NOT NULL REFERENCES it_tickets(id) ON DELETE CASCADE,
      user_id bigint NOT NULL REFERENCES users(id),
      comment_text text NOT NULL,
      is_internal boolean DEFAULT false NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('  ✓ Verified ticket_comments table in database');

  await db.execute(`
    ALTER TABLE ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_tickets_id_fk;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS type varchar(20) DEFAULT 'Incident' NOT NULL;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS resolution_notes text;
    ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false NOT NULL;
  `);
  console.log('  ✓ Verified it_tickets table columns in database');

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

  // 7. Seed Dummy IT Assets
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
  }

  const allAssets = await db.select().from(assets);
  const astMacbook = allAssets.find((a) => a.assetCode === 'LPT-2026-0001') || allAssets[0];
  const astServer = allAssets.find((a) => a.assetCode === 'SVR-2026-0001') || allAssets[0];

  // 8. Seed Ticket Categories
  const defaultTicketCategories = [
    { code: 'HW', name: 'Hardware Problem', description: 'Physical laptop, PC, display, or peripheral failures' },
    { code: 'SW', name: 'Software & Application', description: 'OS crashes, Accurate 5 ERP issues, license activation' },
    { code: 'NET', name: 'Network & Access', description: 'VPN, Wi-Fi, firewall, or active directory credentials' },
    { code: 'REQ', name: 'Service Request', description: 'Equipment provision, monitor request, software installation' },
  ];

  for (const tcat of defaultTicketCategories) {
    const existing = await db.select().from(ticketCategories).where(eq(ticketCategories.name, tcat.name));
    if (existing.length === 0) {
      await db.insert(ticketCategories).values(tcat);
      console.log(`  ✓ Inserted ticket category: ${tcat.name}`);
    }
  }

  const allTicketCats = await db.select().from(ticketCategories);
  const tcatHw = allTicketCats.find((tc) => tc.name === 'Hardware Problem') || allTicketCats[0];
  const tcatNet = allTicketCats.find((tc) => tc.name === 'Network & Access') || allTicketCats[0];
  const tcatReq = allTicketCats.find((tc) => tc.name === 'Service Request') || allTicketCats[0];

  // 9. Seed SLA Policies
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

  // 10. Seed Dummy IT Tickets & Work Log Comments
  const dummyTicketsData = [
    {
      ticketCode: 'INC-2026-0001',
      type: 'Incident',
      subject: 'MacBook Pro Display Flickering & Overheating under Load',
      description: 'The laptop screen randomly flickers green lines during heavy Docker & Chrome execution. Fan runs at maximum speed.',
      categoryId: tcatHw.id,
      priority: 'High',
      status: 'In Progress',
      reporterId: empBudi.id,
      assigneeId: superAdminUser.id,
      assetId: astMacbook?.id || null,
      dueAt: new Date(Date.now() + 8 * 3600 * 1000), // 8 hours SLA
    },
    {
      ticketCode: 'REQ-2026-0001',
      type: 'Request',
      subject: 'Request Additional 27" 4K Monitor for Financial Analysis',
      description: 'Require secondary 4K display for multi-spreadsheet financial analysis in Surabaya office.',
      categoryId: tcatReq.id,
      priority: 'Medium',
      status: 'Open',
      reporterId: empSiti.id,
      assigneeId: null,
      assetId: null,
      dueAt: new Date(Date.now() + 24 * 3600 * 1000), // 24 hours SLA
    },
    {
      ticketCode: 'INC-2026-0002',
      type: 'Incident',
      subject: 'Accurate 5 Server Connection Timeout in Branch Office',
      description: 'Surabaya office unable to reach ERP Server Host on 192.168.10.23:5432. Port unreachable.',
      categoryId: tcatNet.id,
      priority: 'Critical',
      status: 'Resolved',
      reporterId: empAhmad.id,
      assigneeId: superAdminUser.id,
      assetId: astServer?.id || null,
      resolutionNotes: 'Restarted PostgreSQL daemon on Server Host & flushed iptables firewall rules.',
      resolvedAt: new Date(),
      dueAt: new Date(Date.now() + 2 * 3600 * 1000), // 2 hours SLA
    },
  ];

  for (const tData of dummyTicketsData) {
    const existing = await db.select().from(itTickets).where(eq(itTickets.ticketCode, tData.ticketCode));
    let ticketObj = existing[0];

    if (!ticketObj) {
      const [inserted] = await db.insert(itTickets).values(tData as any).returning();
      ticketObj = inserted;
      console.log(`  ✓ Inserted IT ticket: ${tData.ticketCode} - ${tData.subject}`);
    }

    // Seed comments for INC-2026-0001
    if (tData.ticketCode === 'INC-2026-0001') {
      const existingComments = await db.select().from(ticketComments).where(eq(ticketComments.ticketId, ticketObj.id));
      if (existingComments.length === 0) {
        await db.insert(ticketComments).values({
          ticketId: ticketObj.id,
          userId: superAdminUser.id,
          commentText: 'Technician assigned. Performing Apple Hardware Diagnostics check.',
          isInternal: false,
        });
        await db.insert(ticketComments).values({
          ticketId: ticketObj.id,
          userId: superAdminUser.id,
          commentText: 'Internal Tech Note: Thermal paste replacement scheduled if GPU stress test fails.',
          isInternal: true,
        });
        console.log('  ✓ Seeded comments for ticket INC-2026-0001');
      }
    }
  }

  console.log('✅ Database Seed Procedure Completed Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Database Seed Failed:', err);
  process.exit(1);
});
