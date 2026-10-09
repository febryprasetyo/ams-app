'use client';

import React from 'react';
import { Headphones } from 'lucide-react';
import { getAssetConditionBadge } from '@/components/assets/AssetTable';
import { AssetDetail } from '@/lib/assets/types';

export interface AssetAccessoriesCardProps {
  asset: AssetDetail;
}

export default function AssetAccessoriesCard({ asset }: AssetAccessoriesCardProps) {
  return (
    <div className="glass-panel p-6 rounded-3xl bg-white space-y-4 border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Headphones className="w-4 h-4 text-amber-600" />
          <span>Attached Accessories</span>
        </h3>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {asset.accessories?.length || 0} ITEMS
        </span>
      </div>

      {asset.accessories && asset.accessories.length > 0 ? (
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {asset.accessories.map((acc, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors text-xs font-mono"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{acc.accessoryType}</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-200 text-slate-700">
                    Qty: {acc.quantity}
                  </span>
                </div>
                {acc.description && (
                  <p className="text-[11px] text-slate-600 font-sans">{acc.description}</p>
                )}
                {acc.notes && (
                  <p className="text-[10px] text-slate-400 italic font-sans">{acc.notes}</p>
                )}
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getAssetConditionBadge(
                  acc.condition
                )}`}
              >
                {acc.condition}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-xs font-mono">
          No accessories registered for this computer.
        </div>
      )}
    </div>
  );
}
