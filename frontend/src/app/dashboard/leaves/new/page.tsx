'use client';

import React from 'react';
import Link from 'next/link';
import { LeaveRequestForm } from '@/components/leaves/LeaveRequestForm';
import { ArrowLeft, CalendarDays } from 'lucide-react';

export default function NewLeaveRequestPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/leaves"
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Kembali ke daftar permohonan cuti"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Form Pengajuan Cuti Karyawan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Isi formulir pengajuan cuti. Dokumen format F4 akan otomatis dihasilkan setelah dikirim.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-xl">
          <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Kertas F4 / Folio (215 mm × 330 mm)
        </div>
      </div>

      {/* Main Form */}
      <LeaveRequestForm />
    </div>
  );
}
