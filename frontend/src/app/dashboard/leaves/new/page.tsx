'use client';

import React from "react";
import Link from "next/link";
import { LeaveRequestForm } from "@/components/leaves/LeaveRequestForm";
import { ArrowLeft, CalendarDays } from "lucide-react";

export default function NewLeaveRequestPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header (Template Standard) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            <span>Form Pengajuan Cuti</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Isi formulir pengajuan cuti karyawan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/leaves"
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" /> Kembali ke Daftar
          </Link>
        </div>
      </div>

      {/* Main Form */}
      <LeaveRequestForm />
    </div>
  );
}
