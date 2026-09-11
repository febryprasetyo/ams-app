'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { VerificationBadge } from '@/components/assets/CustodianPicker';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  canManageCustodians,
  type CustodianAssetsResponse,
  type CustodianHeldAsset,
  type CustodianSearchResponse,
  type CustodianSummary,
} from '@/lib/assetCustodian';
import {
  AlertCircle,
  Check,
  ExternalLink,
  Eye,
  GitMerge,
  HardDrive,
  Laptop,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  UserRoundCog,
  X,
} from 'lucide-react';

interface LocationOption {
  id: number;
  code: string;
  name: string;
}

export default function AssetCustodiansPage() {
  const { user } = useAuth();
  const canManage = canManageCustodians(user?.roleName);

  const [directory, setDirectory] = useState<CustodianSummary[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [reconciliationCount, setReconciliationCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [statusTarget, setStatusTarget] = useState<{ custodian: CustodianSummary; recordStatus: 'ACTIVE' | 'INACTIVE' } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'MERGED' | 'ALL'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Edit Metadata Modal State
  const [editing, setEditing] = useState<CustodianSummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocationId, setEditLocationId] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Create Manual Custodian Modal State
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLocationId, setCreateLocationId] = useState<number | ''>('');
  const [createUnit, setCreateUnit] = useState('');
  const [createNotes, setCreateNotes] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Viewing Held Assets Modal State
  const [viewingCustodian, setViewingCustodian] = useState<CustodianSummary | null>(null);
  const [heldAssets, setHeldAssets] = useState<CustodianHeldAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ search: search.trim(), status });
      const [directoryResult, reconciliationResult, locationResult] = await Promise.all([
        api.get<CustodianSearchResponse>(`/asset-custodians?${query.toString()}`),
        api.get<unknown[]>('/asset-custodians/reconciliation-candidates'),
        api.get<LocationOption[]>('/master/locations'),
      ]);
      setDirectory(Array.isArray(directoryResult?.custodians) ? directoryResult.custodians : []);
      setReconciliationCount(Array.isArray(reconciliationResult) ? reconciliationResult.length : 0);
      setLocations(Array.isArray(locationResult) ? locationResult : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load the custodian directory');
    } finally {
      setLoading(false);
    }
  }, [canManage, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(fetchData, 200);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  // Open Edit Modal
  const openEdit = (custodian: CustodianSummary) => {
    setEditing(custodian);
    setEditName(custodian.displayName);
    setEditLocationId(custodian.locationId || '');
    setEditUnit(custodian.unitText || '');
    setEditNotes(custodian.notes || '');
    setError(null);
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !editName.trim()) return;
    setBusyId(editing.id);
    setError(null);
    try {
      await api.patch(`/asset-custodians/${editing.id}`, {
        displayName: editName.trim(),
        locationId: editLocationId === '' ? null : Number(editLocationId),
        unitText: editUnit.trim() || null,
        notes: editNotes.trim() || null,
      });
      setEditing(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update holder metadata');
    } finally {
      setBusyId(null);
    }
  };

  // Create Manual Custodian
  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createName.trim()) return;
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await api.post('/asset-custodians', {
        displayName: createName.trim(),
        locationId: createLocationId === '' ? null : Number(createLocationId),
        unitText: createUnit.trim() || null,
        notes: createNotes.trim() || null,
        duplicateAcknowledged: true,
      });
      setCreating(false);
      setCreateName('');
      setCreateLocationId('');
      setCreateUnit('');
      setCreateNotes('');
      await fetchData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create custodian');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Held Assets Modal
  const openHeldAssets = async (custodian: CustodianSummary) => {
    setViewingCustodian(custodian);
    setHeldAssets([]);
    setLoadingAssets(true);
    setAssetsError(null);
    try {
      const response = await api.get<CustodianAssetsResponse>(`/asset-custodians/${custodian.id}/assets`);
      setHeldAssets(Array.isArray(response?.assets) ? response.assets : []);
    } catch (err: any) {
      setAssetsError(err.message || 'Failed to load assigned assets');
    } finally {
      setLoadingAssets(false);
    }
  };

  // Deactivate / Reactivate
  const handleOpenStatusConfirm = (custodian: CustodianSummary, recordStatus: 'ACTIVE' | 'INACTIVE') => {
    setStatusTarget({ custodian, recordStatus });
    setStatusError(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;
    const { custodian, recordStatus } = statusTarget;
    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      await api.patch(`/asset-custodians/${custodian.id}`, { recordStatus });
      setStatusTarget(null);
      await fetchData();
    } catch (err: any) {
      setStatusError(err.message || 'Gagal mengubah status pemegang aset');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!canManage) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-600" />
          <h1 className="text-lg font-bold text-slate-900">Administrator access required</h1>
          <p className="mt-1 text-xs text-slate-600">Custodian management requires SuperAdmin or ITAdmin role.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              <UserRoundCog className="h-6 w-6 text-red-600" /> Asset Custodians
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Manage equipment holders, track assigned assets, and review HR directory linkages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/master/asset-custodians/reconciliation"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <GitMerge className="h-4 w-4 text-emerald-600" />
              <span>HR Reconciliation</span>
              {reconciliationCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {reconciliationCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreating(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Custodian
            </button>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Directory Controls */}
        <section className="space-y-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search holder name or employee code..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-red-500 focus:outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
              <option value="MERGED">Merged Only</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>

          {/* Directory Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-xs text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading custodians...
              </div>
            ) : directory.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                No custodians found matching your search.
              </div>
            ) : (
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
                              onClick={() => openHeldAssets(custodian)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors ${
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
                                onClick={() => openHeldAssets(custodian)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                title="View assigned assets"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(custodian)}
                                disabled={custodian.recordStatus === 'MERGED'}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-colors"
                                title="Edit metadata"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {custodian.recordStatus === 'ACTIVE' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusConfirm(custodian, 'INACTIVE')}
                                  disabled={busyId === custodian.id}
                                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-50 transition-colors"
                                >
                                  Deactivate
                                </button>
                              )}
                              {custodian.recordStatus === 'INACTIVE' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusConfirm(custodian, 'ACTIVE')}
                                  disabled={busyId === custodian.id}
                                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
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
            )}
          </div>
        </section>
      </div>

      {/* Held Assets Modal */}
      {viewingCustodian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Assets in Custody: {viewingCustodian.displayName}
                    </h2>
                    <VerificationBadge status={viewingCustodian.verificationStatus} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {viewingCustodian.employeeCode || `Holder #${viewingCustodian.id}`}
                    {viewingCustodian.locationName ? ` · ${viewingCustodian.locationName}` : ''}
                    {viewingCustodian.unitText ? ` · ${viewingCustodian.unitText}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCustodian(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingAssets ? (
                <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span>Loading assets in custody...</span>
                </div>
              ) : assetsError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  {assetsError}
                </div>
              ) : heldAssets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                    <Package className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No assets currently assigned</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    {viewingCustodian.displayName} does not have any active assets in their custody right now.
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
                    <span className="font-bold">Total {heldAssets.length} active {heldAssets.length === 1 ? 'asset' : 'assets'} assigned</span>
                    <span className="text-[11px] text-blue-700">Assigned to {viewingCustodian.displayName}</span>
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
                            {asset.locationName && (
                              <span>· Location: {asset.locationName}</span>
                            )}
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
                            <div><span className="text-slate-400">CPU:</span> {asset.computerSpecs.cpuName || '—'}</div>
                            <div>
                              <span className="text-slate-400">RAM:</span> {asset.computerSpecs.ramSizeGb ? `${asset.computerSpecs.ramSizeGb} GB` : '—'}
                              {asset.computerSpecs.ramSlotCount ? ` (${asset.computerSpecs.ramSlotCount} slots)` : ''}
                            </div>
                            <div>
                              <span className="text-slate-400">Disk 1:</span> {asset.computerSpecs.disk1SizeGb ? `${asset.computerSpecs.disk1SizeGb} GB` : '—'}
                            </div>
                            {asset.computerSpecs.disk2SizeGb && (
                              <div><span className="text-slate-400">Disk 2:</span> {asset.computerSpecs.disk2SizeGb} GB</div>
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
                                <span>{acc.accessoryType} ({acc.quantity}x)</span>
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
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-100 p-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingCustodian(null)}
                className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Edit holder metadata</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Name *</label>
                <input
                  required
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
                <select
                  value={editLocationId}
                  onChange={(event) => setEditLocationId(event.target.value ? Number(event.target.value) : '')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                >
                  <option value="">Unknown / no location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit / Team</label>
                <input
                  value={editUnit}
                  onChange={(event) => setEditUnit(event.target.value)}
                  placeholder="Unit / team"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IT Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  placeholder="IT-only notes"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === editing.id || !editName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {busyId === editing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Manual Custodian Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-red-600" />
                <h2 className="font-bold text-slate-900">Create New Custodian</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Holder Name *</label>
                <input
                  required
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="e.g. Mutiara Azizah R"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
                <select
                  value={createLocationId}
                  onChange={(event) => setCreateLocationId(event.target.value ? Number(event.target.value) : '')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                >
                  <option value="">Unknown / no location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit / Team</label>
                <input
                  value={createUnit}
                  onChange={(event) => setCreateUnit(event.target.value)}
                  placeholder="e.g. Finance, Marketing, IT"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IT Notes (optional)</label>
                <textarea
                  rows={2}
                  value={createNotes}
                  onChange={(event) => setCreateNotes(event.target.value)}
                  placeholder="Internal notes..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || !createName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create Custodian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          <ConfirmDeleteModal
        isOpen={!!statusTarget}
        onClose={() => {
          setStatusTarget(null);
          setStatusError(null);
        }}
        onConfirm={handleConfirmStatusChange}
        title={statusTarget?.recordStatus === 'ACTIVE' ? 'Aktifkan Kembali Pemegang Aset' : 'Nonaktifkan Pemegang Aset'}
        description={
          statusTarget?.recordStatus === 'ACTIVE'
            ? 'Pemegang aset ini akan diaktifkan kembali dan dapat dipilih untuk peminjaman/alokasi aset.'
            : 'Pemegang aset ini akan dinonaktifkan sehingga tidak dapat dipilih untuk alokasi baru.'
        }
        itemName={statusTarget?.custodian.displayName}
        itemDetails={
          statusTarget
            ? [
                { label: 'Nama Pemegang', value: statusTarget.custodian.displayName },
                ...(statusTarget.custodian.employeeCode ? [{ label: 'NIK / Kode', value: statusTarget.custodian.employeeCode }] : []),
                ...(statusTarget.custodian.locationName ? [{ label: 'Lokasi', value: statusTarget.custodian.locationName }] : []),
                ...(statusTarget.custodian.unitText ? [{ label: 'Unit', value: statusTarget.custodian.unitText }] : []),
                { label: 'Total Aset', value: `${statusTarget.custodian.assignedAssetCount ?? 0} unit` },
              ]
            : []
        }
        confirmText={statusTarget?.recordStatus === 'ACTIVE' ? 'Aktifkan' : 'Nonaktifkan'}
        cancelText="Batal"
        variant={statusTarget?.recordStatus === 'ACTIVE' ? 'primary' : 'warning'}
        isLoading={isUpdatingStatus}
        error={statusError}
      />
    </DashboardLayout>
  );
}
