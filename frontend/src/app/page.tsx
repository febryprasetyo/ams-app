'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard/master/departments');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-red-50/40 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="flex flex-col items-center gap-4 bg-white/90 p-8 rounded-3xl border border-slate-200 shadow-2xl backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-mono text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span>Redirecting to AMS Portal...</span>
        </div>
      </div>
    </main>
  );
}
