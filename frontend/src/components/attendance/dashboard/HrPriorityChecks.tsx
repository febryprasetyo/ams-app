'use client';

import Link from 'next/link';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, UserCheck } from 'lucide-react';
import type { ActionablePriorityItem } from '@/lib/attendance/overviewMetrics';

interface HrPriorityChecksProps {
  priorities: ActionablePriorityItem[];
  totalRecordsCount: number;
}

export default function HrPriorityChecks({
  priorities,
  totalRecordsCount,
}: HrPriorityChecksProps) {
  return (
    <div className="hr-panel p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Perlu Dicek Hari Ini
              </h2>
              {priorities.length > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {priorities.length} Tindak Lanjut
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Karyawan terlambat atau catatan scan yang belum lengkap untuk diverifikasi.
            </p>
          </div>
        </div>

        {priorities.length > 0 && (
          <span className="text-[11px] font-medium text-slate-400">
            Menampilkan {priorities.length} prioritas utama
          </span>
        )}
      </div>

      {priorities.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
          <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Semua Presensi Hari Ini Rapi! ✨
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {totalRecordsCount > 0
              ? 'Tidak ada keterlambatan atau catatan scan yang hilang pada tanggal ini. Seluruh data tercatat dengan tertib.'
              : 'Belum ada catatan presensi yang masuk pada tanggal ini.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100" role="list">
          {priorities.map((item) => {
            const isLate = item.type === 'LATE';
            return (
              <li
                key={`${item.employeeId}-${item.type}`}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`mt-0.5 sm:mt-0 p-2 rounded-lg shrink-0 ${
                      isLate ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isLate ? <Clock size={16} /> : <AlertCircle size={16} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {item.fullName}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({item.employeeCode})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {item.departmentName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/dashboard/attendance/employees/${item.employeeId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors shadow-2xs"
                  >
                    <UserCheck size={13} />
                    <span>Kartu Absensi</span>
                    <ChevronRight size={12} className="text-slate-400" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
