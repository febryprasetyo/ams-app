'use client';

import React from 'react';
import { Cpu, Layers, Disc } from 'lucide-react';
import { AssetDetail } from '@/lib/assets/types';

export interface ComputerSpecsCardProps {
  asset: AssetDetail;
}

export default function ComputerSpecsCard({ asset }: ComputerSpecsCardProps) {
  return (
    <div className="glass-panel p-6 rounded-3xl bg-white space-y-4 border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Hardware & System Specifications</span>
        </h3>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {asset.categoryName?.toUpperCase()}
        </span>
      </div>

      {asset.computerSpecs ? (
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">
              Processor (CPU)
            </span>
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              {asset.computerSpecs.cpuName}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">RAM Memory</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              {asset.computerSpecs.ramSizeGb} GB ({asset.computerSpecs.ramSlotCount} Slots)
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">
              Primary Storage (Disk 1)
            </span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-slate-500" />
              {asset.computerSpecs.disk1SizeGb} GB
            </span>
          </div>
          <div className="col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">
              Secondary Storage (Disk 2)
            </span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-slate-500" />
              {asset.computerSpecs.disk2SizeGb
                ? `${asset.computerSpecs.disk2SizeGb} GB`
                : 'None / Not installed'}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-400 text-xs font-mono">
          No detailed computer specifications registered.
        </div>
      )}
    </div>
  );
}
