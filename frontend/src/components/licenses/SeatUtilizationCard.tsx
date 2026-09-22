'use client';

import React from 'react';
import { UserCheck, UserPlus } from 'lucide-react';
import { SoftwareLicenseDetail } from '@/lib/licenses/types';

export interface SeatUtilizationCardProps {
  license: SoftwareLicenseDetail;
  onAllocate: () => void;
}

export default function SeatUtilizationCard({
  license,
  onAllocate,
}: SeatUtilizationCardProps) {
  const percentUsed = Math.min(
    100,
    Math.round(((license.usedSeats || 0) / (license.totalSeats || 1)) * 100)
  );
  const isFull = license.usedSeats >= license.totalSeats;
  const availableSeats = Math.max(0, license.totalSeats - license.usedSeats);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-red-600" />
            <span>Seat Utilization Gauge</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Capacity
          </span>
        </div>

        <div className="text-center py-2 space-y-1">
          <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
            {license.usedSeats}{' '}
            <span className="text-lg text-slate-400 font-normal">/ {license.totalSeats}</span>
          </div>
          <p className="text-xs font-semibold text-slate-500">Seats Allocated</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Capacity Usage</span>
            <span className={`font-bold ${isFull ? 'text-red-600' : 'text-slate-700'}`}>
              {percentUsed}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull
                  ? 'bg-red-600'
                  : percentUsed >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
            <p className="text-[10px] text-blue-600 font-semibold uppercase">Assigned</p>
            <p className="text-base font-bold text-blue-900 mt-0.5">{license.usedSeats}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-600 font-semibold uppercase">Available</p>
            <p className="text-base font-bold text-emerald-900 mt-0.5">{availableSeats}</p>
          </div>
        </div>
      </div>

      {/* Quick Action in Card Footer */}
      <button
        onClick={onAllocate}
        disabled={isFull}
        className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isFull
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
        }`}
      >
        <UserPlus className="w-4 h-4" />
        <span>{isFull ? 'All Seats Occupied' : 'Allocate New Seat'}</span>
      </button>
    </div>
  );
}
