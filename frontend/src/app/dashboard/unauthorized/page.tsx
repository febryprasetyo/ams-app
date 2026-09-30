'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from') || 'Halaman tersebut';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold tracking-wide uppercase mb-3">
          403 Forbidden
        </span>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Akun Anda dengan peran <span className="font-semibold text-slate-700">{user?.roleName || 'User'}</span> tidak memiliki izin untuk mengakses rute <code className="px-1.5 py-0.5 bg-slate-100 text-rose-600 rounded text-[11px] font-mono">{fromPath}</code>.
        </p>
        <div className="space-y-3">
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-600/20 hover:from-red-700 hover:to-rose-700 transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Modul Anda</span>
          </Link>
          <button onClick={logout} className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            <span>Ganti Akun / Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
