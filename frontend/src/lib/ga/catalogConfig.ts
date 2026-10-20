export interface ApprovalCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  active: boolean;
  createHref?: string;
  badgeText?: string;
}

export const APPROVAL_CATEGORIES: ApprovalCategory[] = [
  {
    id: 'goods_request',
    title: 'Pembelian Barang',
    description: 'Pengadaan barang, perlengkapan kantor, dan aset baru beserta bukti perbandingan harga.',
    iconName: 'ShoppingBag',
    active: true,
    createHref: '/dashboard/ga/requests/new',
  },
  {
    id: 'asset_loan',
    title: 'Peminjaman Aset',
    description: 'Peminjaman peralatan kantor, perangkat IT, atau perlengkapan operasional sementara.',
    iconName: 'Laptop',
    active: false,
    badgeText: 'Segera Hadir',
  },
  {
    id: 'vehicle_booking',
    title: 'Kendaraan Dinas',
    description: 'Permohonan pemakaian kendaraan operasional kantor untuk perjalanan dinas.',
    iconName: 'Car',
    active: false,
    badgeText: 'Segera Hadir',
  },
  {
    id: 'room_booking',
    title: 'Booking Ruangan',
    description: 'Reservasi ruang rapat dan fasilitas bersama kantor.',
    iconName: 'Building',
    active: false,
    badgeText: 'Segera Hadir',
  },
  {
    id: 'facility_maintenance',
    title: 'Perbaikan & Servis',
    description: 'Permintaan perbaikan fasilitas fisik gedung, AC, listrik, atau plumbing kantor.',
    iconName: 'Wrench',
    active: false,
    badgeText: 'Segera Hadir',
  },
];

export interface FilterTab {
  key: string;
  label: string;
}

export const filterTabs: FilterTab[] = [
  { key: 'all', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'ready_to_print', label: 'Siap Cetak' },
  { key: 'pending_signature', label: 'Menunggu Tanda Tangan' },
  { key: 'approved_manually', label: 'Persetujuan Lengkap' },
  { key: 'processing', label: 'Diproses' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];
