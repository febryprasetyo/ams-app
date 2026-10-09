'use client';

import React from 'react';
import { HardDrive } from 'lucide-react';
import { getAssetStatusBadge, getAssetConditionBadge } from '@/components/assets/AssetTable';
import { AssetDetail } from '@/lib/assets/types';

export interface AssetInformationCardProps {
  asset: AssetDetail;
}

export default function AssetInformationCard({ asset }: AssetInformationCardProps) {
  return (
    <div className="glass-panel p-6 rounded-3xl bg-white space-y-4 md:col-span-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-600" />
          <span>Asset Information</span>
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getAssetStatusBadge(
              asset.status
            )}`}
          >
            {asset.status}
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getAssetConditionBadge(
              asset.condition
            )}`}
          >
            Condition: {asset.condition}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-1">Asset Tag Code</span>
          <span className="font-bold text-slate-900 text-sm">{asset.assetCode}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-1">Category</span>
          <span className="font-bold text-slate-800">{asset.categoryName || 'General IT'}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-1">Serial Number</span>
          <span className="font-bold text-slate-800">{asset.serialNumber || 'SN-UNKNOWN'}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-1">Primary Location</span>
          <span className="font-bold text-slate-800">
            {asset.locationName || 'Unassigned Facility'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-1">Assigned User</span>
          <span className="font-bold text-emerald-600">
            {asset.assignedEmployeeName
              ? `${asset.assignedEmployeeName} (${asset.assignedEmployeeCode || ''})`
              : 'Stock / Pool'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase block mb-1">Registered Date</span>
          <span className="font-bold text-slate-800">
            {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {asset.notes && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <span className="font-mono text-[10px] text-slate-400 uppercase block mb-1 font-bold">
            Notes / Complaints
          </span>
          <p className="text-slate-700 whitespace-pre-wrap">{asset.notes}</p>
        </div>
      )}
    </div>
  );
}
