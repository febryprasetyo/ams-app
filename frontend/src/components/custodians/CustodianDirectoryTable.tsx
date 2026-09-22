'use client';

import React from 'react';
import { VerificationBadge } from '@/components/custodians/VerificationBadge';
import type { CustodianSummary } from '@/lib/assetCustodian';
import { Eye, Loader2, Package, Pencil } from 'lucide-react';

interface CustodianDirectoryTableProps {
  directory: CustodianSummary[];
  loading: boolean;
  busyId: number | null;
  onOpenHeldAssets: (custodian: CustodianSummary) => void;
  onOpenEdit: (custodian: CustodianSummary) => void;
  onOpenStatusConfirm: (custodian: CustodianSummary, recordStatus: 'ACTIVE' | 'INACTIVE') => void;
}

export default function CustodianDirectoryTable({
  directory,
  loading,
  busyId,
  onOpenHeldAssets,
  onOpenEdit,
  onOpenStatusConfirm,
}: CustodianDirectoryTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-xs text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading custodians...
      </div>
    );
  }

  if (directory.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-slate-500">
        No custodians found matching your search.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
          <tr>
            <th className="px-4 py-3">Holder</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Location / Unit</th>
            <th className="px-4 py-3 text-center">Assigned Assets</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {directory.map((custodian) => {
            const assetCount = custodian.assignedAssetCount ?? 0;
            return (
              <tr key={custodian.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{custodian.displayName}</span>
                    <VerificationBadge status={custodian.verificationStatus} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {custodian.employeeCode || `Holder #${custodian.id}`}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-slate-600">
                  {custodian.origin}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {custodian.locationName || '—'}
                  {custodian.unitText ? ` · ${custodian.unitText}` : ''}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenHeldAssets(custodian)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                      assetCount > 0
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                    title={`View ${assetCount} asset(s) held by ${custodian.displayName}`}
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>{assetCount} {assetCount === 1 ? 'asset' : 'assets'}</span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                    {custodian.recordStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenHeldAssets(custodian)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                      title="View assigned assets"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEdit(custodian)}
                      disabled={custodian.recordStatus === 'MERGED'}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-colors cursor-pointer"
                      title="Edit metadata"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {custodian.recordStatus === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => onOpenStatusConfirm(custodian, 'INACTIVE')}
                        disabled={busyId === custodian.id}
                        className="rounded-lg px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Deactivate
                      </button>
                    )}
                    {custodian.recordStatus === 'INACTIVE' && (
                      <button
                        type="button"
                        onClick={() => onOpenStatusConfirm(custodian, 'ACTIVE')}
                        disabled={busyId === custodian.id}
                        className="rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
