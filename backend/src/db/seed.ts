import { db } from './index';
import { roles, users } from './schema/users';
import { departments, locations } from './schema/master';
import { vendors } from './schema/vendors';
import { employees } from './schema/employees';
import { assetCategories, assets } from './schema/assets';
import { ticketCategories, slaPolicies, itTickets, ticketComments } from './schema/tickets';
import { softwareLicenses, licenseAllocations } from './schema/licenses';
import { accurateLicenseLogs, servers, dbBackups } from './schema/infrastructure';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const SEED_ACCURATE_LICENSE_LIST = [
  { no: 1, licenseKey: "GWIJU-QPTIH-7LI8F-I86460", date: "2026-06-05", ip: "192.168.10.70", version: "5.0.20.1868", host: "GUDANG", status: "ACTIVE" },
  { no: 2, licenseKey: "JZ1U2-YWQE1-13LUK-SCEWN", date: "2026-06-05", ip: "192.168.10.54", version: "5.0.20.1868", host: "Produksi 1", status: "ACTIVE" },
  { no: 3, licenseKey: "EZOFE-18LCU-C1CDS-GYXZR", date: "2026-06-05", ip: "192.168.10.237", version: "5.0.20.1868", host: "lilis", status: "ACTIVE" },
  { no: 4, licenseKey: "KRVJ4-HEAKB-CVH7D-PHVSB", date: "2026-06-05", ip: "192.168.10.39", version: "5.0.20.1868", host: "AGRE", status: "ACTIVE" },
  { no: 5, licenseKey: "L8GWS-3ITC0-T6DNX-WMD3X", date: "2026-06-05", ip: "192.168.10.45", version: "5.0.20.1868", host: "andi", status: "ACTIVE" },
  { no: 6, licenseKey: "RUCAO-R69X7-QG2WO-A89FO", date: "2026-06-05", ip: "192.168.10.36", version: "5.0.20.1868", host: "NIDA", status: "ACTIVE" },
  { no: 7, licenseKey: "RYNZ7-31EPT-WB9Z8-D3ARC", date: "2026-06-11", ip: "192.168.10.10", version: "5.0.20.1868", host: "CMC", status: "ACTIVE" },
  { no: 8, licenseKey: "S79FI-BMP15-CMHEK-UC21Y", date: null, ip: null, version: null, host: "Seat #8 (Idle)", status: "RELEASED" },
  { no: 9, licenseKey: "T5YSS-QC3FF-F8GDY-HJURR", date: null, ip: null, version: null, host: "Seat #9 (Idle)", status: "RELEASED" },
  { no: 10, licenseKey: "TLJR0-D0J7Z-2ZUFT-6QMK7", date: null, ip: null, version: null, host: "Seat #10 (Idle)", status: "RELEASED" },
  { no: 11, licenseKey: "UFTIC-W6GDG-1YVT1-QVP43", date: null, ip: null, version: null, host: "Seat #11 (Idle)", status: "RELEASED" },
  { no: 12, licenseKey: "UPPX0-DX6IX-FCGY9-9HXJV", date: null, ip: null, version: null, host: "Seat #12 (Idle)", status: "RELEASED" },
  { no: 13, licenseKey: "X8HGH-4W806-ME88X-TWCI2", date: null, ip: null, version: null, host: "Seat #13 (Idle)", status: "RELEASED" },
  { no: 14, licenseKey: "RZMB-0TY11-N4B41-6VE2U", date: "2026-06-04", ip: "192.168.10.5", version: "5.0.20.1868", host: "TIA", status: "ACTIVE" },
  { no: 15, licenseKey: "R5Z4-L792N-DJCV8-LC3MO", date: "2026-06-04", ip: "192.168.40.3", version: "5.0.20.1868", host: "MARIYAM", status: "ACTIVE" },
  { no: 16, licenseKey: "491NJ-JL7OH-8BCK4-WN2AW", date: "2026-06-04", ip: "192.168.40.3", version: "5.0.20.1868", host: "Bu ELISA", status: "ACTIVE" },
  { no: 17, licenseKey: "7PDNH-322N9-3WDHJ-YFG1L", date: "2026-06-04", ip: "192.168.10.160", version: "5.0.20.1868", host: "Server", status: "ACTIVE" },
  { no: 18, licenseKey: "APFR9-YY05X-1A8PV-V4NS4", date: "2026-06-05", ip: "192.168.10.94", version: "5.0.20.1868", host: "AFNI", status: "ACTIVE" },
  { no: 19, licenseKey: "1EBCAK-D0Q4H-RPZH1-QEE4G", date: "2026-06-05", ip: "192.168.10.114", version: "5.0.20.1868", host: "AYU", status: "ACTIVE" },
  { no: 20, licenseKey: "VS98P-CAGEW-B3AZT-IPS5Z", date: "2026-06-04", ip: "192.168.10.35", version: "5.0.20.1868", host: "RISKI-AR", status: "ACTIVE" },
  { no: 21, licenseKey: "4R356N-G76EP-PENH8-BYA07", date: "2026-06-04", ip: "192.168.10.17", version: "5.0.20.1868", host: "DL", status: "ACTIVE" },
  { no: 22, licenseKey: "3KDOWE-PE9Q5-IQPFU-NKTV9", date: "2026-04-23", ip: "192.168.1.123", version: "5.0.20.1868", host: "Feli", status: "ACTIVE" },
  { no: 23, licenseKey: "29QF7-O2HJR-W6S06-11327", date: "2026-04-23", ip: "192.168.1.122", version: "5.0.20.1868", host: "Nisa", status: "ACTIVE" },
  { no: 24, licenseKey: "00A9Q-EPR68-UL37R-OH8Z3", date: "2026-04-23", ip: "192.168.1.121", version: "5.0.20.1868", host: "temp riski", status: "ACTIVE" }
];

async function seed() {
  console.log('🌱 Starting Database Seed Procedure with Accurate 5 Scraper (matching licenseList.json format)...');

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

    CREATE TABLE IF NOT EXISTS accurate_license_logs (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      seat_no integer,
      license_key varchar(100),
      date varchar(50),
      ip_address varchar(45),
      version varchar(50),
      host varchar(100),
      status varchar(30) DEFAULT 'ACTIVE',
      scraped_at timestamp DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS servers (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      hostname varchar(50),
      name varchar(150),
      ip_address varchar(45),
      os varchar(100),
      storage_spec varchar(255),
      status varchar(30) DEFAULT 'Online',
      notes text,
      created_at timestamp DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS db_backups (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      server_id bigint REFERENCES servers(id),
      db_name varchar(100),
      size_mb numeric,
      status varchar(30) DEFAULT 'Success',
      backup_path varchar(255),
      completed_at timestamp DEFAULT now()
    );
  `);
  console.log('  ✓ Verified accurate_license_logs, servers, and db_backups tables in database');

  await db.execute(`
    ALTER TABLE ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_tickets_id_fk;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS type varchar(20) DEFAULT 'Incident' NOT NULL;
    ALTER TABLE it_tickets ADD COLUMN IF NOT EXISTS resolution_notes text;
    ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false NOT NULL;
    ALTER TABLE software_licenses ADD COLUMN IF NOT EXISTS vendor_id bigint REFERENCES vendors(id);
    ALTER TABLE accurate_license_logs ADD COLUMN IF NOT EXISTS seat_no integer;
    ALTER TABLE accurate_license_logs ADD COLUMN IF NOT EXISTS license_key varchar(100);
    ALTER TABLE accurate_license_logs ADD COLUMN IF NOT EXISTS date varchar(50);
    ALTER TABLE accurate_license_logs ADD COLUMN IF NOT EXISTS version varchar(50);
    ALTER TABLE accurate_license_logs ADD COLUMN IF NOT EXISTS host varchar(100);
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

  // 5. Seed Servers Topology
  const dummyServers = [
    {
      serverCode: 'SVR-2026-0001',
      name: 'Dell PowerEdge R760 (Accurate 5 & ERP Core Host)',
      ipAddress: '192.168.10.23',
      os: 'Ubuntu Server 24.04 LTS (Kernel 6.8)',
      specs: '2x Intel Xeon Gold 6430 / 256GB RAM DDR5 / 4x 1.92TB NVMe Enterprise RAID-10',
      status: 'Online',
      notes: 'Host for PostgreSQL ams_db and Accurate 5 Firebird Database Engine',
    },
    {
      serverCode: 'SVR-2026-0002',
      name: 'Accurate 5 License Manager Web Server (Port 6688)',
      ipAddress: '192.168.10.160',
      os: 'Windows Server 2022 Standard',
      specs: 'Intel Xeon E-2336 / 32GB RAM / 1TB SSD',
      status: 'Online',
      notes: 'Runs Accurate 5 License Manager Web Console on http://192.168.10.160:6688/',
    },
  ];

  for (const srvData of dummyServers) {
    const existing = await db.select().from(servers).where(eq(servers.serverCode, srvData.serverCode));
    if (existing.length === 0) {
      await db.insert(servers).values(srvData);
      console.log(`  ✓ Inserted server: ${srvData.name} (${srvData.ipAddress})`);
    }
  }

  // 6. Seed Accurate 5 License List (24 Seats matching licenseList.json format)
  await db.delete(accurateLicenseLogs);
  await db.insert(accurateLicenseLogs).values(
    SEED_ACCURATE_LICENSE_LIST.map((item) => ({
      seatNo: item.no,
      licenseKey: item.licenseKey,
      date: item.date,
      ip: item.ip,
      version: item.version,
      host: item.host,
      status: item.status,
      scrapedAt: new Date(),
    }))
  );
  console.log(`  ✓ Seeded 24 Accurate 5 License Seats matching licenseList.json format`);

  console.log('✅ Database Seed Procedure Completed Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Database Seed Failed:', err);
  process.exit(1);
});
