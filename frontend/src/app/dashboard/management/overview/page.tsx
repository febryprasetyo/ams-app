'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleWelcomeWorkspace from '@/components/dashboard/RoleWelcomeWorkspace';
import {
  LayoutDashboard,
  FileBarChart,
  Ticket,
  Calendar,
  Users,
  TrendingUp,
} from 'lucide-react';

export default function ManagementOverviewPage() {
  const shortcuts = [
    {
      title: 'Ringkasan Aset Perusahaan',
      description: 'Pantau metrik inventaris perangkat, tingkat utilisasi, dan sebaran unit menurut departemen.',
      href: '/dashboard/assets/overview',
      icon: LayoutDashboard,
      badge: 'Eksekutif',
    },
    {
      title: 'Laporan Kehadiran Karyawan',
      description: 'Audit rekapitulasi absensi bulanan seluruh unit divisi kerja.',
      href: '/dashboard/attendance/reports',
      icon: FileBarChart,
      badge: 'HR & Waktu',
    },
    {
      title: 'Status Tiket & Dukungan IT',
      description: 'Tinjau performa SLA penanganan kendala teknis dan keluhan staf operasional.',
      href: '/dashboard/tickets',
      icon: Ticket,
      badge: 'Service Desk',
    },
  ];

  const futureModules = [
    {
      title: 'Persetujuan Cuti & Delegasi',
      description: 'Pusat persetujuan satu pintu permohonan cuti tahunan tim di bawah supervisi Anda.',
      icon: Calendar,
      statusText: 'Prioritas 3',
    },
    {
      title: 'Evaluasi & Headcount Divisi',
      description: 'Laporan analitik pertumbuhan jumlah pegawai, turnover, dan alokasi headcount.',
      icon: Users,
      statusText: 'Roadmap',
    },
    {
      title: 'Anggaran Pengadaan IT',
      description: 'Proyeksi siklus penggantian perangkat kerja (refresh cycle) dan alokasi belanja modal.',
      icon: TrendingUp,
      statusText: 'Roadmap',
    },
  ];

  return (
    <DashboardLayout>
      <RoleWelcomeWorkspace
        roleTitle="Workspace Manajemen"
        roleBadge="Manajemen & Pimpinan"
        description="Selamat datang di dasbor kepemimpinan eksekutif. Akses laporan strategis, ringkasan operasional lintas divisi, serta indikator utama kesehatan organisasi di satu tempat."
        shortcuts={shortcuts}
        futureModules={futureModules}
      />
    </DashboardLayout>
  );
}
