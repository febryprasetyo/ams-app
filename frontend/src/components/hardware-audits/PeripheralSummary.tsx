'use client';

import React from 'react';
import { Printer, Scan, Monitor, Package, Check, Copy } from 'lucide-react';
import { HardwareAuditPeripheral } from '@/lib/hardware-audits/types';

interface PeripheralSummaryProps {
  peripherals: HardwareAuditPeripheral[];
  copiedId?: string | null;
  onCopy?: (text: string, id: string) => void;
  prefixId?: string;
}

export default function PeripheralSummary({
  peripherals,
  copiedId,
  onCopy,
  prefixId = 'p',
}: PeripheralSummaryProps) {
  if (!peripherals || peripherals.length === 0) return null;

  return (
    <div className="mt-2 p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-2">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
        <div className="flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5 text-emerald-600" />
          <span>Periferal Terlampir ({peripherals.length} unit):</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {peripherals.map((p, pIdx) => {
          const catLower = p.category.toLowerCase();
          const isPrinter = catLower.includes('printer');
          const isScanner = catLower.includes('scanner');
          const isMonitor = catLower.includes('monitor');
          const isCustom = !isPrinter && !isScanner && !isMonitor;
          const copyKey = `${prefixId}-${pIdx}`;

          return (
            <div
              key={pIdx}
              className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs font-mono flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                    isPrinter
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isScanner
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isMonitor
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {isPrinter && <Printer className="w-2.5 h-2.5" />}
                  {isScanner && <Scan className="w-2.5 h-2.5" />}
                  {isMonitor && <Monitor className="w-2.5 h-2.5" />}
                  {isCustom && <Package className="w-2.5 h-2.5" />}
                  <span>{p.category}</span>
                  {isCustom && <span className="text-[9px] font-normal text-amber-600">(Manual)</span>}
                </span>
                {p.serialNumber && onCopy && (
                  <button
                    onClick={() => onCopy(p.serialNumber!, copyKey)}
                    title="Salin S/N Periferal"
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                  >
                    {copiedId === copyKey ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
              <div className="font-semibold text-slate-800 text-[11px] truncate" title={p.brandModel}>
                {p.brandModel}
              </div>
              <div className="text-[10px] text-slate-500">
                S/N: <span className="font-semibold text-slate-700">{p.serialNumber || '-'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
