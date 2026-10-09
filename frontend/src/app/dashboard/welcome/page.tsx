'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleWelcomeWorkspace from '@/components/dashboard/RoleWelcomeWorkspace';
import {
  Ticket,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';

export default function WelcomeFallbackPage() {
  const shortcuts = [
    {
      title: 'Pusat Bantuan & Tiket',
      description: 'Hubungi administrator sistem atau tim IT bila peran akun Anda memerlukan pembaruan hak akses.',
      href: '/dashboard/tickets',
      icon: Ticket,
      badge: 'Bantuan',
    },
  ];

  const futureModules = [
    {
      title: 'Konfigurasi Hak Akses',
      description: 'Hubungi IT Administrator untuk mengaktifkan modul kerja spesifik pada profil pengguna ini.',
      icon: HelpCircle,
      statusText: 'Hubungi Admin',
    },
    {
      title: 'Panduan Penggunaan Sistem',
      description: 'Dokumentasi fitur standar, FAQ, dan alur perizinan operasional terintegrasi.',
      icon: FileQuestion,
      statusText: 'Dokumentasi',
    },
  ];

  return (
    <DashboardLayout>
      <RoleWelcomeWorkspace
        roleTitle="Selamat Datang"
        roleBadge="Pengguna Terdaftar"
        description="Akun Anda telah berhasil terotentikasi. Sistem sedang mengalokasikan akses modul kerja yang sesuai dengan profil jabatan Anda."
        shortcuts={shortcuts}
        futureModules={futureModules}
      />
    </DashboardLayout>
  );
}
