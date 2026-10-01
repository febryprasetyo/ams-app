'use client';

import React from 'react';
import { Key, UserCheck, ShieldCheck, Clock } from 'lucide-react';
import { SoftwareLicense } from '@/lib/licenses/types';

export interface LicenseStatsProps {
  licenses: SoftwareLicense[];
}

export default function LicenseStats({ licenses }: LicenseStatsProps) {
  const totalLicensesCount = licenses.length;
  const totalAllocatedSeats = licenses.reduce((sum, l) => sum + (l.usedSeats || 0), 0);
  const totalAvailableSeats = licenses.reduce(
    (sum, l) => sum + Math.max(0, (l.totalSeats || 0) - (l.usedSeats || 0)),
    0
  );

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringOrAlertsCount = licenses.filter((l) => {
    if (l.status === 'Expired') return true;
    if (!l.expirationDate) return false;
    const expDate = new Date(l.expirationDate);
    return expDate <= thirtyDaysFromNow;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Software */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 rounded-l-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Total Software
            </p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              {totalLicensesCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Key className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-red-600 font-semibold font-mono">Cataloged</span> across systems
        </div>
      </div>

      {/* Card 2: Allocated Seats */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 rounded-l-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Allocated Seats
            </p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              {totalAllocatedSeats}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-emerald-600 font-semibold font-mono">Active</span> employee & asset seats
        </div>
      </div>

      {/* Card 3: Available Seats */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 rounded-l-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Available Seats
            </p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              {totalAvailableSeats}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-emerald-600 font-semibold font-mono">Ready</span> for allocation
        </div>
      </div>

      {/* Card 4: Expiring Soon / Renewal Alerts */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Expiring / Renewal
            </p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              {expiringOrAlertsCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-amber-600 font-semibold font-mono">Action required</span> within 30 days
        </div>
      </div>
    </div>
  );
}
