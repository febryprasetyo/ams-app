'use client';

import React from 'react';
import { Shapes, Laptop, Monitor, Printer, HardDrive } from 'lucide-react';

export interface CategoryDistributionItem {
  categoryId: number;
  categoryName: string;
  count: number;
  percentage: number;
}

export interface AssetCategoryBreakdownProps {
  data: CategoryDistributionItem[];
}

function getCategoryIcon(name: string) {
  const norm = name.toLowerCase();
  if (norm.includes('laptop') || norm.includes('notebook')) return Laptop;
  if (norm.includes('pc') || norm.includes('desktop') || norm.includes('workstation') || norm.includes('monitor')) return Monitor;
  if (norm.includes('printer') || norm.includes('scanner')) return Printer;
  return HardDrive;
}

export default function AssetCategoryBreakdown({ data }: AssetCategoryBreakdownProps) {
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shapes className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Kategori & Tipe Perangkat
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proporsi pembagian jenis perangkat keras yang terdata
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {data.length} Kategori
        </span>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Shapes className="w-8 h-8 text-slate-300" />
          <p className="text-xs">Belum ada kategori aset terdata</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {data.map((item) => {
            const Icon = getCategoryIcon(item.categoryName);

            return (
              <div
                key={item.categoryName + item.categoryId}
                className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {item.categoryName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {item.count} unit
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block text-xs font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Total aset terdaftar: {totalCount} unit</span>
      </div>
    </div>
  );
}
