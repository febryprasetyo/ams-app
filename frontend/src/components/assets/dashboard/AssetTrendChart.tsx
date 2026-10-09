'use client';

import React from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

export interface PurchaseTrendItem {
  month: string;
  label: string;
  count: number;
}

export interface AssetTrendChartProps {
  data: PurchaseTrendItem[];
}

export default function AssetTrendChart({ data }: AssetTrendChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 5);
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Tren Pengadaan Aset
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat penambahan aset 6 bulan terakhir (tanggal pembelian & registrasi)
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block font-mono">Total Periode</span>
          <span className="text-sm font-extrabold text-slate-900 font-mono">
            {totalCount} <span className="text-xs font-normal text-slate-500">Unit</span>
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
          <BarChart2 className="w-8 h-8 text-slate-300" />
          <p className="text-xs">Belum ada data riwayat pengadaan aset</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Chart Bars */}
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-slate-100">
            {data.map((item) => {
              const heightPercent = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
              const hasCount = item.count > 0;

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded bg-slate-800 text-white font-mono text-[10px] whitespace-nowrap z-20 pointer-events-none shadow-sm">
                    {item.label}: {item.count} unit
                  </div>

                  {/* Count indicator on top of bar */}
                  <span
                    className={`text-[11px] font-mono font-bold mb-1.5 transition-colors ${
                      hasCount ? 'text-slate-700 group-hover:text-emerald-700' : 'text-slate-300'
                    }`}
                  >
                    {item.count}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full max-h-[120px]">
                    <div
                      style={{ height: `${Math.max(heightPercent, hasCount ? 8 : 2)}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        hasCount
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-700 group-hover:to-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month Labels */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 px-2">
            {data.map((item) => (
              <div key={item.month} className="flex-1 text-center">
                <span className="text-[11px] font-mono font-medium text-slate-500 truncate block">
                  {item.label.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  {item.label.split(' ')[1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
