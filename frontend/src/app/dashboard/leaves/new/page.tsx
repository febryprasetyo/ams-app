'use client';

import React from 'react';
import Link from 'next/link';
import { LeaveRequestForm } from '@/components/leaves/LeaveRequestForm';
import { ArrowLeft, CalendarDays } from 'lucide-react';

export default function NewLeaveRequestPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/leaves"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Kembali ke daftar permohonan cuti"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Form Pengajuan Cuti Karyawan</h1>
            <p className="text-xs text-slate-500">
              Isi formulir pengajuan cuti. Dokumen format F4 akan otomatis dihasilkan setelah dikirim.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <CalendarDays className="w-4 h-4 text-red-600" />
          Kertas F4 / Folio (215 mm × 330 mm)
        </div>
      </div>

      {/* Main Form */}
      <LeaveRequestForm />
    </div>
  );
}
