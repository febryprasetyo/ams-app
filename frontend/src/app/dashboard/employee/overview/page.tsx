'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleWelcomeWorkspace from '@/components/dashboard/RoleWelcomeWorkspace';
import {
  Ticket,
  CalendarCheck,
  Calendar,
  HardDrive,
  FileText,
} from 'lucide-react';

export default function EmployeeOverviewPage() {
  const shortcuts = [
    {
      title: 'Service Desk & Tiket Dukungan',
      description: 'Laporkan kendala perangkat keras, software kantor, atau ajukan permohonan bantuan IT.',
      href: '/dashboard/tickets',
      icon: Ticket,
      badge: 'Helpdesk',
    },
    {
      title: 'Riwayat Kehadiran & Absensi',
      description: 'Pantau catatan jam kerja harian, clock-in, dan clock-out Anda secara real-time.',
      href: '/dashboard/attendance/employees',
      icon: CalendarCheck,
      badge: 'Absensi',
    },
  ];

  const futureModules = [
    {
      title: 'Pengajuan Cuti Tahunan',
      description: 'Sistem mandiri pengajuan cuti, perhitungan sisa kuota saldo, dan persetujuan terpadu.',
      icon: Calendar,
      statusText: 'Prioritas 3',
    },
    {
      title: 'Peminjaman Perangkat Kerja',
      description: 'Form permohonan peminjaman laptop cadangan, proyektor, dan aksesoris kantor.',
      icon: HardDrive,
      statusText: 'Roadmap',
    },
    {
      title: 'Slip Gaji Digital (Payroll)',
      description: 'Akses terenkripsi dan aman ke rekap kompensasi bulanan terverifikasi HR.',
      icon: FileText,
      statusText: 'Roadmap',
    },
  ];

  return (
    <DashboardLayout>
      <RoleWelcomeWorkspace
        roleTitle="Workspace Karyawan"
        roleBadge="Karyawan Aktif"
        description="Selamat datang di portal layanan mandiri Anda. Gunakan menu aksi cepat di bawah untuk membuat tiket kendala operasional atau memeriksa catatan kehadiran kerja Anda."
        shortcuts={shortcuts}
        futureModules={futureModules}
      />
    </DashboardLayout>
  );
}
