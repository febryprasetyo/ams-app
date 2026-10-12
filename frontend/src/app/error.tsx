'use client';

import Link from 'next/link';
import { BRAND_NAME } from '@/lib/gajianichBrand';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-bold text-emerald-700">{BRAND_NAME}</p>
      <h1 className="text-2xl font-bold">Halaman belum bisa dimuat</h1>
      <p className="text-slate-600" role="alert">Coba lagi. Jika masalah berlanjut, hubungi administrator.</p>
      <button onClick={reset} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Coba lagi</button>
      <Link href="/" className="text-emerald-700 underline">Kembali ke beranda</Link>
    </main>
  );
}
