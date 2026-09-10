'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Cpu,
  Laptop,
  HardDrive,
  Search,
  CheckCircle2,
  AlertCircle,
  Link2,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  ExternalLink,
  Layers,
  MapPin,
  User as UserIcon,
  X,
  Disc,
  Filter,
} from 'lucide-react';

interface CandidateAsset {
  id: number;
  assetCode: string;
  name: string;
  serialNumber: string | null;
  categoryName: string;
  hasComputerSpecs: boolean;
  custodianName: string | null;
}

interface HardwareAuditItem {
  id: number;
  custodianName: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  cpuName: string | null;
  ramSizeGb: number | null;
  ramSlotCount: number | null;
  disk1SizeGb: number | null;
  disk2SizeGb: number | null;
  rawSpecs: any;
  notes: string | null;
  status: 'PENDING' | 'SYNCED_AUTO' | 'SYNCED_MANUAL' | 'DISMISSED';
  matchedAssetId: number | null;
  matchedAsset?: {
    id: number;
    assetCode: string;
    name: string;
    serialNumber?: string | null;
  } | null;
  candidateAssets?: CandidateAsset[];
  scannedAt: string;
  createdAt: string;
}

interface CategoryOption {
  id: number;
  name: string;
  codePrefix?: string;
  code?: string;
}

interface LocationOption {
  id: number;
  name: string;
}

interface AllAssetOption {
  id: number;
  assetCode: string;
  name: string;
  serialNumber: string | null;
  currentCustodianId: number | null;
  assignedEmployeeName?: string | null;
  custodianName?: string | null;
  categoryName?: string;
  computerSpecs?: any;
}

export default function HardwareAuditsPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<HardwareAuditItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [allAssets, setAllAssets] = useState<AllAssetOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SYNCED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [linkModalAudit, setLinkModalAudit] = useState<HardwareAuditItem | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [updateSerial, setUpdateSerial] = useState(true);
  const [updateSpecs, setUpdateSpecs] = useState(true);

  const [createModalAudit, setCreateModalAudit] = useState<HardwareAuditItem | null>(null);
  const [createCategoryId, setCreateCategoryId] = useState<number | null>(null);
  const [createLocationId, setCreateLocationId] = useState<number | null>(null);
  const [createAssetName, setCreateAssetName] = useState('');
  const [createCustodianName, setCreateCustodianName] = useState('');
  const [createStatus, setCreateStatus] = useState<'Assigned' | 'Available'>('Assigned');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAudits = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: HardwareAuditItem[]; total: number }>('/hardware-audits');
      setAudits(res.data || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat daftar audit hardware' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [cats, locs, assetsRes] = await Promise.all([
        api.get<CategoryOption[]>('/assets/categories').catch(() => []),
        api.get<LocationOption[]>('/master/locations').catch(() => []),
        api.get<any>('/assets?limit=500').catch(() => []),
      ]);
      setCategories(cats || []);
      setLocations(locs || []);
      
      // Backend /assets returns an array directly: AssetItem[]
      const assetList = Array.isArray(assetsRes) ? assetsRes : (assetsRes?.data || []);
      setAllAssets(assetList);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchAudits();
    fetchReferenceData();
  }, [fetchAudits, fetchReferenceData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action: Tautkan ke Aset
  const handleLinkSubmit = async () => {
    if (!linkModalAudit || !selectedAssetId) return;
    try {
      setIsActionLoading(true);
      const res = await api.post(`/hardware-audits/${linkModalAudit.id}/link`, {
        assetId: selectedAssetId,
        updateSerialNumber: updateSerial,
        updateSpecs: updateSpecs,
      });

      setFeedback({ type: 'success', message: res.message || 'Spesifikasi berhasil ditautkan ke aset!' });
      setLinkModalAudit(null);
      setSelectedAssetId(null);
      fetchAudits();
      fetchReferenceData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menautkan spesifikasi' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Buat Aset Baru
  const handleCreateSubmit = async () => {
    if (!createModalAudit || !createCategoryId) return;
    try {
      setIsActionLoading(true);
      const res = await api.post(`/hardware-audits/${createModalAudit.id}/create-asset`, {
        name: createAssetName.trim(),
        categoryId: createCategoryId,
        locationId: createLocationId,
        custodianName: createCustodianName.trim(),
        status: createStatus,
        notes: `Created from Hardware Audit (${createCustodianName.trim() || createModalAudit.custodianName})`,
      });

      setFeedback({
        type: 'success',
        message: res.message || `Aset baru ${res.assetCode} berhasil didaftarkan ke inventaris!`,
      });
      setCreateModalAudit(null);
      fetchAudits();
      fetchReferenceData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal membuat aset baru' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Hapus Audit
  const handleDeleteAudit = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data audit ini dari daftar? (Data aset di inventaris tetap aman).')) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/hardware-audits/${id}`);
      setFeedback({ type: 'success', message: 'Data audit berhasil dihapus dari daftar' });
      fetchAudits();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus audit' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Bersihkan Semua Audit yang Sudah Synced
  const handleClearSynced = async () => {
    if (!confirm('Apakah Anda yakin ingin membersihkan semua riwayat audit yang sudah disinkronkan? (Data aset di inventaris tetap aman).')) return;
    try {
      setIsActionLoading(true);
      const res = await api.delete<{ success: boolean; message: string }>('/hardware-audits/clear-synced');
      setFeedback({ type: 'success', message: res.message || 'Riwayat audit yang sudah disinkronkan berhasil dibersihkan' });
      fetchAudits();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal membersihkan data audit yang sudah disinkronkan' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Link Modal
  const openLinkModal = (audit: HardwareAuditItem) => {
    setLinkModalAudit(audit);
    // Jika ada kandidat aset pertama, pilih otomatis
    if (audit.candidateAssets && audit.candidateAssets.length > 0) {
      setSelectedAssetId(audit.candidateAssets[0].id);
    } else {
      setSelectedAssetId(null);
    }
    setUpdateSerial(true);
    setUpdateSpecs(true);
  };

  // Open Create Modal
  const openCreateModal = (audit: HardwareAuditItem) => {
    setCreateModalAudit(audit);
    const defaultCat = categories.find((c) =>
      c.name.toLowerCase().includes('laptop') || c.name.toLowerCase().includes('pc')
    );
    setCreateCategoryId(defaultCat ? defaultCat.id : (categories[0]?.id || null));
    setCreateLocationId(locations[0]?.id || null);
    setCreateAssetName([audit.manufacturer, audit.model].filter(Boolean).join(' ') || 'Laptop');
    setCreateCustodianName(audit.custodianName || '');
    setCreateStatus('Assigned');
  };

  // Filtered Audits
  const filteredAudits = audits.filter((item) => {
    if (activeTab === 'PENDING' && item.status !== 'PENDING') return false;
    if (activeTab === 'SYNCED' && !item.status.startsWith('SYNCED')) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.custodianName.toLowerCase().includes(q) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
      (item.model && item.model.toLowerCase().includes(q)) ||
      (item.cpuName && item.cpuName.toLowerCase().includes(q))
    );
  });

  const pendingCount = audits.filter((a) => a.status === 'PENDING').length;
  const syncedCount = audits.filter((a) => a.status.startsWith('SYNCED')).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header (Matching IT Inventory Style) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-red-600" />
              <span>Hardware Audits &amp; Collector Sync</span>
              {pendingCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                  {pendingCount} Pending
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Antrean hasil scan laptop/PC dari portable tool flashdisk. Tautkan spesifikasi ke aset terdaftar, atau buat aset baru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchAudits}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-600' : 'text-slate-500'}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/dashboard/assets"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-slate-300" />
              <span>Kembali ke IT Inventory</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-medium">{feedback.message}</div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Hasil Scan</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{audits.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('PENDING')}
            className={`glass-panel cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'PENDING'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300'
            } flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider font-mono">Menunggu Review / Tindakan</p>
              <p className="text-2xl font-extrabold text-amber-800 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('SYNCED')}
            className={`glass-panel cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'SYNCED'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300'
            } flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Sudah Ditautkan / Selesai</p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">{syncedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/60 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({audits.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-700 hover:bg-amber-100/50'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('SYNCED')}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                activeTab === 'SYNCED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-100/50'
              }`}
            >
              Synced ({syncedCount})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {syncedCount > 0 && (
              <button
                onClick={handleClearSynced}
                disabled={isActionLoading}
                className="px-3 py-2 text-xs font-mono font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                title="Hapus semua log audit yang sudah ditautkan ke inventaris"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Riwayat Synced ({syncedCount})</span>
              </button>
            )}

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari User, Serial Number, Model..."
                className="w-full pl-9 pr-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Audit List Table / Cards */}
        <div className="glass-panel rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-red-600" />
              <p className="text-xs font-mono font-medium text-slate-600">Memuat data hasil audit hardware...</p>
            </div>
          ) : filteredAudits.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Cpu className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum ada data audit hardware</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
                Colokkan flashdisk berisi tool collector ke laptop user, masukkan nama dan klik Scan &amp; Sync.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAudits.map((item) => (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Device & Custodian info */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-red-600" />
                        {[item.manufacturer, item.model].filter(Boolean).join(' ') || 'Komputer / Laptop'}
                      </span>

                      {/* Status Badge */}
                      {item.status === 'PENDING' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                      {item.status === 'SYNCED_AUTO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Auto Synced
                        </span>
                      )}
                      {item.status === 'SYNCED_MANUAL' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> Manually Linked
                        </span>
                      )}
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
                            onClick={() => copyToClipboard(item.serialNumber!, `sn-${item.id}`)}
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
                    </div>

                    {/* Recommendation Box if candidate assets detected */}
                    {item.status === 'PENDING' && item.candidateAssets && item.candidateAssets.length > 0 && (
                      <div className="mt-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs font-mono text-amber-900 flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Ditemukan <strong>{item.candidateAssets.length} aset</strong> atas nama <em>{item.custodianName}</em> (misal: <strong>{item.candidateAssets[0].assetCode}</strong>). Klik &ldquo;Tautkan ke Aset&rdquo; untuk menyatukan spesifikasi.
                        </span>
                      </div>
                    )}

                    {/* Matched Asset Notice */}
                    {item.matchedAsset && (
                      <div className="mt-1.5 text-xs font-mono text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Telah terhubung ke Aset:</span>
                        <Link
                          href={`/dashboard/assets/${item.matchedAsset.id}`}
                          className="font-bold underline text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          {item.matchedAsset.assetCode} — {item.matchedAsset.name}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {item.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => openLinkModal(item)}
                          className="px-4 py-2 text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Link2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Tautkan ke Aset</span>
                        </button>

                        <button
                          onClick={() => openCreateModal(item)}
                          className="px-4 py-2 text-xs font-mono font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer shadow-red-600/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Buat Aset Baru</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAudit(item.id)}
                          title="Hapus Data Audit"
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
                          onClick={() => handleDeleteAudit(item.id)}
                          title="Hapus dari Riwayat Audit"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: TAUTKAN KE ASET (LIGHT THEME MATCHING DASHBOARD) */}
      {linkModalAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200 my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tautkan Spesifikasi ke Aset Terdaftar
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Pilih aset di database AMS untuk diisikan spesifikasi hardware hasil scan ini.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLinkModalAudit(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scanned specs preview pill */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Perangkat: {[linkModalAudit.manufacturer, linkModalAudit.model].filter(Boolean).join(' ') || 'Laptop'}</span>
                <span className="text-slate-500 font-normal">User: <strong>{linkModalAudit.custodianName}</strong></span>
              </div>
              <div className="text-slate-600">
                Serial Number: <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{linkModalAudit.serialNumber || '(Kosong)'}</span>
              </div>
              <div className="text-slate-600">
                Spesifikasi: {linkModalAudit.cpuName} | RAM {linkModalAudit.ramSizeGb} GB | Disk {linkModalAudit.disk1SizeGb} GB {linkModalAudit.disk2SizeGb ? `+ ${linkModalAudit.disk2SizeGb} GB` : ''}
              </div>
            </div>

            {/* Candidate Asset Selector */}
            <div className="space-y-3">
              {/* Kandidat rekomendasi jika ada */}
              {linkModalAudit.candidateAssets && linkModalAudit.candidateAssets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                    ★ Rekomendasi Aset Milik {linkModalAudit.custodianName}:
                  </p>
                  <div className="space-y-2">
                    {linkModalAudit.candidateAssets.map((cand) => (
                      <label
                        key={cand.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedAssetId === cand.id
                            ? 'bg-red-50/60 border-red-500 ring-2 ring-red-500/20 text-slate-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedAsset"
                            checked={selectedAssetId === cand.id}
                            onChange={() => setSelectedAssetId(cand.id)}
                            className="text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-xs font-mono text-slate-900 flex items-center gap-2">
                              <span>{cand.assetCode}</span>
                              <span className="text-slate-500 font-normal">— {cand.name}</span>
                              {!cand.hasComputerSpecs && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                  Belum ada spek
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              Holder: {cand.custodianName || 'Belum ditugaskan'} {cand.serialNumber ? `(S/N: ${cand.serialNumber})` : '(Tanpa S/N)'}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Atau pilih dari seluruh aset */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider block">
                  Pilih Aset dari Database ({allAssets.length} Aset Terdaftar):
                </label>
                <select
                  value={selectedAssetId || ''}
                  onChange={(e) => setSelectedAssetId(Number(e.target.value) || null)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">-- Pilih Aset dari Daftar --</option>
                  {allAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assetCode} — {a.name} {a.serialNumber ? `(S/N: ${a.serialNumber})` : '(Tanpa S/N)'} {a.assignedEmployeeName || a.custodianName ? `[${a.assignedEmployeeName || a.custodianName}]` : ''} {!a.computerSpecs ? '★ Belum ada spek' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-mono text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateSerial}
                  onChange={(e) => setUpdateSerial(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span>Perbarui Serial Number pada aset terpilih ({linkModalAudit.serialNumber || 'N/A'})</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateSpecs}
                  onChange={(e) => setUpdateSpecs(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span>Perbarui Spesifikasi Hardware (CPU, RAM, Disks)</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLinkModalAudit(null)}
                disabled={isActionLoading}
                className="px-4 py-2.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!selectedAssetId || isActionLoading}
                className="px-5 py-2.5 text-xs font-mono font-bold bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition flex items-center gap-2 shadow-md shadow-red-600/20 cursor-pointer"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Konfirmasi Tautkan Spesifikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BUAT ASET BARU (LIGHT THEME MATCHING DASHBOARD) */}
      {createModalAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200 my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daftarkan Sebagai Aset Inventaris Baru
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Nomor tag aset dan spesifikasi hardware akan otomatis dibuat.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalAudit(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Kategori Aset */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Kategori Aset *
                </label>
                <select
                  value={createCategoryId || ''}
                  onChange={(e) => setCreateCategoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.codePrefix || c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand & Model */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Nama Perangkat / Brand *
                </label>
                <input
                  type="text"
                  value={createAssetName}
                  onChange={(e) => setCreateAssetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
                />
              </div>

              {/* Serial Number & Custodian (Readonly preview) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">Serial Number</label>
                  <input
                    type="text"
                    readOnly
                    value={createModalAudit.serialNumber || '(Tidak terdeteksi)'}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Pengguna (Custodian) *</label>
                  <input
                    type="text"
                    value={createCustodianName}
                    onChange={(e) => setCreateCustodianName(e.target.value)}
                    placeholder="Nama Pengguna"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-red-600 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Lokasi Penempatan
                </label>
                <select
                  value={createLocationId || ''}
                  onChange={(e) => setCreateLocationId(Number(e.target.value) || null)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Aset */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Status Aset</label>
                <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="createStatus"
                      checked={createStatus === 'Assigned'}
                      onChange={() => setCreateStatus('Assigned')}
                      className="text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <span>Assigned (Diberikan ke {createCustodianName || createModalAudit.custodianName})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="createStatus"
                      checked={createStatus === 'Available'}
                      onChange={() => setCreateStatus('Available')}
                      className="text-slate-700 focus:ring-slate-500 cursor-pointer"
                    />
                    <span>Available (Gudang)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateModalAudit(null)}
                disabled={isActionLoading}
                className="px-4 py-2.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={!createCategoryId || isActionLoading}
                className="px-5 py-2.5 text-xs font-mono font-bold bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition flex items-center gap-2 shadow-md shadow-red-600/20 cursor-pointer"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Daftarkan ke Inventaris</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
