'use client';

import React from 'react';
import Link from 'next/link';
import {
  Laptop,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Copy,
  Check,
  Cpu,
  Layers,
  HardDrive,
  Printer,
  Link2,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { HardwareAuditItem } from '@/lib/hardware-audits/types';
import PeripheralSummary from './PeripheralSummary';

interface HardwareAuditCardProps {
  item: HardwareAuditItem;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onOpenLink: (item: HardwareAuditItem) => void;
  onOpenCreate: (item: HardwareAuditItem) => void;
  onDelete: (item: HardwareAuditItem) => void;
}

export default function HardwareAuditCard({
  item,
  copiedId,
  onCopy,
  onOpenLink,
  onOpenCreate,
  onDelete,
}: HardwareAuditCardProps) {
  const isPending = item.status === 'PENDING';
  const isSynced = item.status.startsWith('SYNCED');

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border transition-all ${
        isPending
          ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
          : 'bg-slate-50/50 border-slate-200/80 opacity-90'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {/* Left Info Column */}
        <div className="space-y-3 flex-1">
          {/* Header row: Device Name & Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Laptop className="w-4 h-4 text-slate-300" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  {[item.manufacturer, item.model].filter(Boolean).join(' ') || 'Komputer / Laptop'}
                </h3>
                {isPending ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Perlu Tindakan</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Tersinkron ({item.status})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Custodian & Serial Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-700">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Pengguna:</span>
              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                {item.custodianName}
              </span>
            </div>

            {item.serialNumber && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 text-slate-800">
                <span className="text-slate-400">S/N:</span>
                <span className="font-bold text-slate-900">{item.serialNumber}</span>
                <button
                  onClick={() => onCopy(item.serialNumber!, `sn-${item.id}`)}
                  title="Salin Serial Number"
                  className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                >
                  {copiedId === `sn-${item.id}` ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            <div className="text-slate-400">
              Discan: {new Date(item.scannedAt || item.createdAt).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Specifications Pill Grid */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-mono">
            {item.cpuName && (
              <span className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.cpuName}</span>
              </span>
            )}

            {item.ramSizeGb && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 flex items-center gap-1.5 font-bold">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>RAM {item.ramSizeGb} GB {item.ramSlotCount ? `(${item.ramSlotCount} slot)` : ''}</span>
              </span>
            )}

            {(item.disk1SizeGb || item.disk2SizeGb) && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-bold">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Disk: {item.disk1SizeGb ? `${item.disk1SizeGb} GB` : ''}
                  {item.disk2SizeGb ? ` + ${item.disk2SizeGb} GB` : ''}
                </span>
              </span>
            )}

            {item.peripherals && item.peripherals.length > 0 && (
              <span className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg border border-sky-200 flex items-center gap-1.5 font-bold">
                <Printer className="w-3.5 h-3.5 text-sky-600" />
                <span>{item.peripherals.length} Periferal Terhubung</span>
              </span>
            )}
          </div>

          {/* Peripherals Detail Grid */}
          {item.peripherals && item.peripherals.length > 0 && (
            <PeripheralSummary
              peripherals={item.peripherals}
              copiedId={copiedId}
              onCopy={onCopy}
              prefixId={`sn-p-${item.id}`}
            />
          )}

          {/* Recommendation Candidate Banner (if pending and has candidates) */}
          {isPending && item.candidateAssets && item.candidateAssets.length > 0 && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-800">
                <span>★ Rekomendasi Aset Terdaftar untuk {item.custodianName}:</span>
                <span className="text-[10px] font-normal text-amber-600">
                  {item.candidateAssets.length} aset cocok
                </span>
              </div>
              <div className="space-y-1.5">
                {item.candidateAssets.slice(0, 2).map((cand) => (
                  <div
                    key={cand.id}
                    className="p-2.5 bg-white rounded-lg border border-amber-200/60 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{cand.assetCode}</span>
                        <span className="text-slate-600 font-normal">— {cand.name}</span>
                        {!cand.hasComputerSpecs && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-50 text-red-600 border border-red-100 font-bold">
                            Belum ada spek
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Holder: {cand.custodianName || 'Belum ditugaskan'} {cand.serialNumber ? `(S/N: ${cand.serialNumber})` : '(Tanpa S/N)'}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenLink(item)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg text-[11px] transition cursor-pointer shrink-0"
                    >
                      Tautkan ke Aset Ini
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Asset Info (if synced) */}
          {item.matchedAsset && (
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-semibold">Tertaut ke Aset:</span>
                <Link
                  href={`/dashboard/assets/${item.matchedAsset.id}`}
                  className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <span>{item.matchedAsset.assetCode}</span>
                  <span className="font-normal text-slate-600">({item.matchedAsset.name})</span>
                </Link>
              </div>
              {item.matchedAsset.serialNumber && (
                <span className="text-slate-500">S/N: {item.matchedAsset.serialNumber}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Column */}
        <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
          {isPending ? (
            <>
              <button
                onClick={() => onOpenLink(item)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Tautkan Spesifikasi</span>
              </button>

              <button
                onClick={() => onOpenCreate(item)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Aset Baru</span>
              </button>

              <button
                onClick={() => onDelete(item)}
                title="Hapus dari Riwayat Audit"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {item.matchedAsset && (
                <Link
                  href={`/dashboard/assets/${item.matchedAsset.id}`}
                  className="px-4 py-2 text-xs font-mono font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl transition flex items-center gap-2 shadow-2xs"
                >
                  <span>Lihat Detail di Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                onClick={() => onDelete(item)}
                title="Hapus dari Riwayat Audit"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
