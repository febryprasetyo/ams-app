'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getDefaultRedirectForUser } from '@/lib/access/routes';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace(getDefaultRedirectForUser(user));
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="flex flex-col items-center gap-4 bg-white/90 p-8 rounded-3xl border border-slate-200 shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <Image src="/branding/gajianich-cat-favicon.png" alt="" width={48} height={48} className="w-12 h-12 object-contain" />
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-mono text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Lagi siapin GAJIANICH...</span>
        </div>
      </div>
    </main>
  );
}
