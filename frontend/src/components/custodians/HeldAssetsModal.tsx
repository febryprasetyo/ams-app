'use client';

import React from 'react';
import Link from 'next/link';
import { VerificationBadge } from '@/components/custodians/VerificationBadge';
import type { CustodianHeldAsset, CustodianSummary } from '@/lib/assetCustodian';
import {
  ExternalLink,
  HardDrive,
  Laptop,
  Loader2,
  Package,
  X,
} from 'lucide-react';

interface HeldAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  custodian: CustodianSummary | null;
  heldAssets: CustodianHeldAsset[];
  loading: boolean;
  error: string | null;
}

export default function HeldAssetsModal({
  isOpen,
  onClose,
  custodian,
  heldAssets,
  loading,
  error,
}: HeldAssetsModalProps) {
  if (!isOpen || !custodian) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Assets in Custody: {custodian.displayName}
                </h2>
                <VerificationBadge status={custodian.verificationStatus} />
              </div>
              <p className="text-xs text-slate-500">
                {custodian.employeeCode || `Holder #${custodian.id}`}
                {custodian.locationName ? ` · ${custodian.locationName}` : ''}
                {custodian.unitText ? ` · ${custodian.unitText}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Loading assets in custody...</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : heldAssets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No assets currently assigned</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {custodian.displayName} does not have any active assets in their custody right now.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/assets"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Go to Inventory to assign asset
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-blue-50/70 border border-blue-100 px-3.5 py-2.5 text-xs text-blue-900">
                <span className="font-bold">
                  Total {heldAssets.length} active {heldAssets.length === 1 ? 'asset' : 'assets'} assigned
                </span>
                <span className="text-[11px] text-blue-700">Assigned to {custodian.displayName}</span>
              </div>

              {heldAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                          {asset.assetCode}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{asset.name}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {asset.categoryName || 'Asset'}
                        </span>
                        {asset.serialNumber && (
                          <span className="font-mono text-[10px]">S/N: {asset.serialNumber}</span>
                        )}
                        {asset.locationName && <span>· Location: {asset.locationName}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {asset.status}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {asset.condition}
                      </span>
                    </div>
                  </div>

                  {/* Computer Hardware Specs if any */}
                  {asset.computerSpecs && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs space-y-1">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <Laptop className="h-3.5 w-3.5" /> Hardware Specifications
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700 pt-1">
                        <div>
                          <span className="text-slate-400">CPU:</span>{' '}
                          {asset.computerSpecs.cpuName || '—'}
                        </div>
                        <div>
                          <span className="text-slate-400">RAM:</span>{' '}
                          {asset.computerSpecs.ramSizeGb ? `${asset.computerSpecs.ramSizeGb} GB` : '—'}
                          {asset.computerSpecs.ramSlotCount ? ` (${asset.computerSpecs.ramSlotCount} slots)` : ''}
                        </div>
                        <div>
                          <span className="text-slate-400">Disk 1:</span>{' '}
                          {asset.computerSpecs.disk1SizeGb ? `${asset.computerSpecs.disk1SizeGb} GB` : '—'}
                        </div>
                        {asset.computerSpecs.disk2SizeGb && (
                          <div>
                            <span className="text-slate-400">Disk 2:</span>{' '}
                            {asset.computerSpecs.disk2SizeGb} GB
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Accessories if any */}
                  {asset.accessories && asset.accessories.length > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs space-y-1">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <HardDrive className="h-3.5 w-3.5" /> Accessories ({asset.accessories.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {asset.accessories.map((acc) => (
                          <span
                            key={acc.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700"
                          >
                            <span>
                              {acc.accessoryType} ({acc.quantity}x)
                            </span>
                            <span className="text-slate-400">· {acc.condition}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/dashboard/assets/${asset.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>View Full Asset Details</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
