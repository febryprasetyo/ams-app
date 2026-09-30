'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const perms = user.permissions || [];
    const normRole = (user.roleName || (user as { role?: string }).role || '').toLowerCase().replace(/_/g, '');

    if (normRole === 'superadmin' || perms.includes('*') || perms.includes('master.view')) {
      router.push('/dashboard/master/departments');
    } else if (perms.includes('attendance.view') || normRole.includes('attendance') || normRole.includes('hr')) {
      router.push('/dashboard/attendance');
    } else if (perms.includes('assets.view')) {
      router.push('/dashboard/assets');
    } else if (perms.includes('tickets.view')) {
      router.push('/dashboard/tickets');
    } else if (perms.includes('licenses.view')) {
      router.push('/dashboard/licenses');
    } else if (perms.includes('infrastructure.view')) {
      router.push('/dashboard/infrastructure');
    } else if (perms.includes('access.users.view')) {
      router.push('/dashboard/access');
    } else {
      router.push('/dashboard/master/departments');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans text-slate-600">
      <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-xl">
        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
        <span className="text-sm font-medium text-slate-800">Mengarahkan ke modul Anda...</span>
      </div>
    </div>
  );
}
