import Link from 'next/link';
import { BRAND_NAME } from '@/lib/gajianichBrand';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-bold text-emerald-700">{BRAND_NAME}</p>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="text-slate-600">Periksa alamat halaman atau kembali ke beranda.</p>
      <Link href="/" className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Kembali ke beranda</Link>
    </main>
  );
}
