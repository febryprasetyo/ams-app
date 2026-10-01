'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Upload, FileSpreadsheet, Users, Calendar } from 'lucide-react';
import { getTimeBasedGreeting, formatJakartaDate } from '@/lib/attendance/overviewMetrics';

interface HrHeroGreetingProps {
  userName?: string;
  targetDate: string;
  canWrite: boolean;
}

export default function HrHeroGreeting({
  userName,
  targetDate,
  canWrite,
}: HrHeroGreetingProps) {
  const greeting = getTimeBasedGreeting(userName);
  const formattedDate = formatJakartaDate(targetDate);

  return (
    <header className="hr-panel p-5 sm:p-6 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/40 border border-emerald-100/80 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Side: Mascot + Greeting */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0 p-1.5 bg-white rounded-2xl shadow-xs border border-emerald-100 flex items-center justify-center">
            <Image
              src="/branding/gajianich-cat-favicon.png"
              alt="Maskot Kucing Kopi GAJIANICH"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
              priority
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Operasional Aktif" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {greeting}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                <Calendar size={12} className="text-emerald-700" />
                {formattedDate}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600">
              Hari ini kantor butuh apa? Pantau kehadiran, tindak lanjuti anomali, dan kelola presensi tim Anda.
            </p>
          </div>
        </div>

        {/* Right Side: RBAC Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canWrite && (
            <Link
              href="/dashboard/attendance/imports"
              className="hr-btn-primary"
              title="Unggah file log mesin fingerprint/absensi"
            >
              <Upload size={15} />
              <span>Impor Absensi</span>
            </Link>
          )}

          <Link
            href="/dashboard/attendance/reports"
            className="hr-btn"
            title="Buka laporan rekap absensi bulanan"
          >
            <FileSpreadsheet size={15} className="text-slate-600" />
            <span>Laporan Rekap</span>
          </Link>

          <Link
            href="/dashboard/attendance/employees"
            className="hr-btn"
            title="Kelola direktori profil karyawan & kartu absensi"
          >
            <Users size={15} className="text-slate-600" />
            <span>Direktori Karyawan</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
