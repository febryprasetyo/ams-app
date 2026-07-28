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

async function seed() {
  console.log('🌱 Starting Database Seed Procedure with Single-Device (1 License = 1 Device) Software Licenses...');

  // 0. Ensure custom tables exist in PostgreSQL
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
  console.log('  ✓ Verified software_licenses & license_allocations tables in database');

  await db.execute(`
    ALTER TABLE ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_tickets_id_fk;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS type varchar(20) DEFAULT 'Incident' NOT NULL;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS resolution_notes text;
    ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false NOT NULL;
    ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS vendor_id bigint REFERENCES vendors(id);
  `);
  console.log('  ✓ Verified it_tickets & comments table columns in database');

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

  const allVendors = await db.select().from(vendors);
  const vendorSchneider = allVendors.find((v) => v.name.includes('Schneider')) || allVendors[0];
  const vendorMicrosoft = allVendors.find((v) => v.name.includes('Microsoft')) || allVendors[0];

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
  ];

  for (const astData of dummyAssetsData) {
    const existing = await db.select().from(assets).where(eq(assets.assetCode, astData.assetCode));
    if (existing.length === 0) {
      await db.insert(assets).values(astData);
      console.log(`  ✓ Inserted asset: ${astData.name} (${astData.assetCode})`);
    }
  }

  const allAssets = await db.select().from(assets);
  const astMacbook = allAssets.find((a) => a.assetCode === 'LPT-2026-0001') || allAssets[0];
  const astDellXps = allAssets.find((a) => a.assetCode === 'LPT-2026-0002') || allAssets[0];
  const astAiWorkstation = allAssets.find((a) => a.assetCode === 'PC-2026-0001') || allAssets[0];

  // Clear existing allocations and licenses to re-seed strictly 1 license = 1 device
  await db.delete(licenseAllocations);
  await db.delete(softwareLicenses);
  console.log('  ✓ Reset software_licenses & allocations for 1 License = 1 Device rule enforcement');

  // 8. Seed Software Licenses STRICTLY 1 License = 1 Device (totalSeats: 1)
  const singleDeviceLicenses = [
    {
      name: 'AVEVA System Platform 2023 R2 (CD License #1)',
      licenseKey: 'AVEVA-CD-2023R2-SN-001',
      licenseType: 'CD / Dongle',
      vendorId: vendorSchneider.id,
      totalSeats: 1,
      usedSeats: 1,
      purchaseDate: new Date('2025-01-15'),
      expirationDate: new Date('2028-01-15'),
      cost: '30000000',
      status: 'Active',
      notes: 'CD Media & USB Hardware Dongle #1 dedicated to MacBook Pro M3 Max',
      targetAsset: astMacbook,
      targetEmp: empBudi,
    },
    {
      name: 'AVEVA System Platform 2023 R2 (CD License #2)',
      licenseKey: 'AVEVA-CD-2023R2-SN-002',
      licenseType: 'CD / Dongle',
      vendorId: vendorSchneider.id,
      totalSeats: 1,
      usedSeats: 1,
      purchaseDate: new Date('2025-01-15'),
      expirationDate: new Date('2028-01-15'),
      cost: '30000000',
      status: 'Active',
      notes: 'CD Media & USB Hardware Dongle #2 dedicated to Custom AI Workstation',
      targetAsset: astAiWorkstation,
      targetEmp: null,
    },
    {
      name: 'Schneider EcoStruxure Machine Expert v2.1 (Dongle Key #1)',
      licenseKey: 'SCH-EMEX-V21-USB-001',
      licenseType: 'CD / Dongle',
      vendorId: vendorSchneider.id,
      totalSeats: 1,
      usedSeats: 1,
      purchaseDate: new Date('2025-03-10'),
      expirationDate: new Date('2027-03-10'),
      cost: '28000000',
      status: 'Active',
      notes: 'PLC Machine Expert Software Dongle Key dedicated to Dell XPS 15 Laptop',
      targetAsset: astDellXps,
      targetEmp: empSiti,
    },
    {
      name: 'Windows 10 Pro OEM Digital License (Laptop LPT-2026-0001)',
      licenseKey: 'OEM-WIN10PRO-DL-9901-MAC',
      licenseType: 'OEM Bundled',
      vendorId: vendorMicrosoft.id,
      totalSeats: 1,
      usedSeats: 1,
      purchaseDate: new Date('2024-06-01'),
      expirationDate: null, // Perpetual OEM
      cost: '2500000',
      status: 'Active',
      notes: 'OEM Digital Activation Key pre-bundled with MacBook Pro Bootcamp / VM',
      targetAsset: astMacbook,
      targetEmp: empBudi,
    },
    {
      name: 'Windows 10 Pro OEM Digital License (Laptop LPT-2026-0002)',
      licenseKey: 'OEM-WIN10PRO-DL-9902-XPS',
      licenseType: 'OEM Bundled',
      vendorId: vendorMicrosoft.id,
      totalSeats: 1,
      usedSeats: 1,
      purchaseDate: new Date('2024-06-01'),
      expirationDate: null, // Perpetual OEM
      cost: '2500000',
      status: 'Active',
      notes: 'OEM Digital Key factory-embedded in Dell XPS 15 Laptop motherboard',
      targetAsset: astDellXps,
      targetEmp: empSiti,
    },
    {
      name: 'Microsoft Office 365 Home & Business (Laptop Bundling LPT-2026-0002)',
      licenseKey: 'M365-OEM-BUNDLE-DL-002',
      licenseType: 'OEM Bundled',
      vendorId: vendorMicrosoft.id,
      totalSeats: 1,
      usedSeats: 1,
      purchaseDate: new Date('2025-02-01'),
      expirationDate: new Date('2027-02-01'),
      cost: '3500000',
      status: 'Active',
      notes: 'Microsoft Account subscription bundled directly with Dell XPS Laptop purchase',
      targetAsset: astDellXps,
      targetEmp: empSiti,
    },
  ];

  for (const item of singleDeviceLicenses) {
    const { targetAsset, targetEmp, ...lData } = item;
    const [licObj] = await db.insert(softwareLicenses).values(lData as any).returning();
    console.log(`  ✓ Created single-device license: ${lData.name} (1 License = 1 Device)`);

    if (targetAsset) {
      await db.insert(licenseAllocations).values({
        licenseId: licObj.id,
        employeeId: targetEmp ? targetEmp.id : null,
        assetId: targetAsset.id,
        notes: `Exclusive 1-to-1 single device license allocated to ${targetAsset.name} (${targetAsset.assetCode})`,
      });
      console.log(`    ↳ Seat allocated exclusively to device ${targetAsset.assetCode}`);
    }
  }

  console.log('✅ Database Seed Procedure Completed Successfully with 1 License = 1 Device Rule!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Database Seed Failed:', err);
  process.exit(1);
});
