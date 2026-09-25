export interface PermissionSeed {
  code: string;
  name: string;
  module: string;
  description: string;
}

export const DEFAULT_PERMISSIONS: PermissionSeed[] = [
  // Assets
  { code: 'assets.view', name: 'View Assets', module: 'assets', description: 'Melihat inventaris aset dan detail' },
  { code: 'assets.create', name: 'Create Asset', module: 'assets', description: 'Menambahkan aset baru & impor' },
  { code: 'assets.edit', name: 'Edit Asset', module: 'assets', description: 'Memperbarui spesifikasi & detail aset' },
  { code: 'assets.delete', name: 'Delete Asset', module: 'assets', description: 'Menghapus atau mendisposisi aset' },
  { code: 'assets.assign', name: 'Assign & Return Asset', module: 'assets', description: 'Serah terima dan pengembalian aset' },

  // Tickets
  { code: 'tickets.view', name: 'View Tickets', module: 'tickets', description: 'Melihat tiket helpdesk IT' },
  { code: 'tickets.create', name: 'Create Ticket', module: 'tickets', description: 'Membuat permohonan tiket baru' },
  { code: 'tickets.manage', name: 'Manage & Resolve Tickets', module: 'tickets', description: 'Mengubah status, teknisi, & resolusi' },

  // Licenses
  { code: 'licenses.view', name: 'View Licenses', module: 'licenses', description: 'Melihat lisensi software' },
  { code: 'licenses.manage', name: 'Manage Licenses', module: 'licenses', description: 'Menambah, mengedit, & alokasi lisensi' },

  // Infrastructure
  { code: 'infrastructure.view', name: 'View Infrastructure', module: 'infrastructure', description: 'Melihat status server & database' },
  { code: 'infrastructure.manage', name: 'Manage Infrastructure', module: 'infrastructure', description: 'Konfigurasi node server' },

  // Hardware Audits
  { code: 'hardware_audits.view', name: 'View Hardware Audits', module: 'hardware_audits', description: 'Melihat log audit hardware agen' },
  { code: 'hardware_audits.manage', name: 'Manage Hardware Audits', module: 'hardware_audits', description: 'Konversi dan tautkan audit ke aset' },

  // Attendance
  { code: 'attendance.view', name: 'View Attendance', module: 'attendance', description: 'Melihat rekap & kartu absensi' },
  { code: 'attendance.import', name: 'Import Attendance', module: 'attendance', description: 'Mengunggah file log absensi mesin' },
  { code: 'attendance.manage', name: 'Manage Attendance', module: 'attendance', description: 'Koreksi log & pengaturan absensi' },

  // Master Data
  { code: 'master.view', name: 'View Master Data', module: 'master', description: 'Melihat master data organisasi' },
  { code: 'master.manage', name: 'Manage Master Data', module: 'master', description: 'Menambah dan mengubah master data' },

  // Access Control
  { code: 'access.users.view', name: 'View Users', module: 'access', description: 'Melihat daftar pengguna sistem' },
  { code: 'access.users.manage', name: 'Manage Users', module: 'access', description: 'Tambah, edit user, reset password' },
  { code: 'access.roles.manage', name: 'Manage Roles & Permissions', module: 'access', description: 'Mengatur peran & matriks hak akses' },
];
