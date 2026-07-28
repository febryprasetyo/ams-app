'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  HardDrive,
  ArrowLeft,
  Wrench,
  UserCheck,
  Archive,
  QrCode,
  Printer,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Tag,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  DollarSign,
  ShieldCheck,
  Activity,
  X,
  History,
  Info,
  ChevronRight,
  Plus
} from 'lucide-react';

interface AssetDetail {
  id: number;
  assetCode: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  categoryCodePrefix?: string;
  locationId?: number | null;
  locationName?: string | null;
  assignedToEmployeeId?: number | null;
  assignedEmployeeName?: string | null;
  assignedEmployeeCode?: string | null;
  serialNumber?: string | null;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Disposed' | 'Lost';
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MaintenanceRecord {
  id: number;
  assetId: number;
  maintenanceType: string;
  title: string;
  description?: string | null;
  cost: number;
  vendorId?: number | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  status: string;
  performedById?: number | null;
  performedByUsername?: string | null;
  createdAt: string;
}

interface AuditLogRecord {
  id: number;
  userId?: number | null;
  username?: string | null;
  action: string;
  entity: string;
  entityId: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface HistoryData {
  assetId: number;
  maintenanceHistory: MaintenanceRecord[];
  auditLogs: AuditLogRecord[];
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'audit'>('maintenance');

  // Maintenance Log Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintType, setMaintType] = useState('Routine Service');
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintCost, setMaintCost] = useState<number | ''>(0);
  const [maintStatus, setMaintStatus] = useState('Completed');
  const [maintSubmitting, setMaintSubmitting] = useState(false);
  const [maintError, setMaintError] = useState<string | null>(null);

  // Dispose Modal State
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [disposeReason, setDisposeReason] = useState('');
  const [disposeSubmitting, setDisposeSubmitting] = useState(false);
  const [disposeError, setDisposeError] = useState<string | null>(null);

  // Fetch Asset & History
  const fetchAssetData = useCallback(async () => {
    if (!assetId) return;
    try {
      setLoading(true);
      setError(null);
      const [assetRes, historyRes] = await Promise.all([
        api.get<AssetDetail>(`/assets/${assetId}`),
        api.get<HistoryData>(`/assets/${assetId}/history`).catch(() => ({
          assetId: Number(assetId),
          maintenanceHistory: [],
          auditLogs: [],
        })),
      ]);
      setAsset(assetRes);
      setHistory(historyRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset details');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchAssetData();
  }, [fetchAssetData]);

  // Handle Log Maintenance Submit
  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;
    setMaintError(null);
    setMaintSubmitting(true);

    try {
      await api.post(`/assets/${assetId}/maintenance`, {
        maintenanceType: maintType,
        title: maintTitle.trim() || `${maintType} Maintenance`,
        description: maintDescription.trim() || null,
        cost: Number(maintCost) || 0,
        status: maintStatus,
      });
      setIsMaintenanceModalOpen(false);
      setMaintTitle('');
      setMaintDescription('');
      setMaintCost(0);
      fetchAssetData();
    } catch (err: any) {
      setMaintError(err.message || 'Failed to log maintenance');
    } finally {
      setMaintSubmitting(false);
    }
  };

  // Handle Dispose Submit
  const handleDisposeAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;
    setDisposeError(null);
    setDisposeSubmitting(true);

    try {
      await api.post(`/assets/${assetId}/dispose`, {
        reason: disposeReason.trim() || 'Decommissioned',
      });
      setIsDisposeModalOpen(false);
      setDisposeReason('');
      fetchAssetData();
    } catch (err: any) {
      setDisposeError(err.message || 'Failed to dispose asset');
    } finally {
      setDisposeSubmitting(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status?: AssetDetail['status']) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Assigned
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-mono font-bold border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Maintenance
          </span>
        );
      case 'Disposed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-bold border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Disposed
          </span>
        );
      case 'Lost':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-mono font-bold border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Lost
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <span>Loading asset detail specifications...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !asset) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Asset Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested asset record does not exist.'}</p>
          <Link
            href="/dashboard/assets"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to IT Inventory</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/assets"
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="Back to Inventory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>IT Inventory</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-red-600 font-bold">{asset.assetCode}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mt-0.5">
                <span>{asset.name}</span>
                {renderStatusBadge(asset.status)}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" />
              <span>Log Service</span>
            </button>

            {asset.status !== 'Disposed' && (
              <button
                onClick={() => setIsDisposeModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Archive className="w-4 h-4 text-slate-500" />
                <span>Decommission</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Specifications & Audit/Maintenance History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Specifications Card */}
            <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Technical Specifications & Metadata</span>
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                  ID: #{asset.id}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {/* Asset Code */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Asset Code</span>
                  <span className="font-mono font-extrabold text-red-600 text-sm mt-0.5 block">{asset.assetCode}</span>
                </div>

                {/* Category */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Category</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">{asset.categoryName || 'N/A'}</span>
                </div>

                {/* Serial Number */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Serial Number</span>
                  <span className="font-mono font-medium text-slate-700 text-xs mt-0.5 block">
                    {asset.serialNumber || 'No Serial Recorded'}
                  </span>
                </div>

                {/* Condition */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Physical Condition</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">{asset.condition}</span>
                </div>

                {/* Primary Location */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Primary Location</span>
                  <span className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    {asset.locationName || 'Unassigned Location'}
                  </span>
                </div>

                {/* Created Date */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Registered Date</span>
                  <span className="font-mono text-slate-600 text-xs mt-0.5 block">
                    {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Technical Notes / Description */}
              {asset.notes && (
                <div className="pt-2">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1.5">
                    Notes & Configuration Details
                  </span>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {asset.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Audit Trail & Maintenance History Timeline Component */}
            <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-red-600" />
                  <span>Asset Lifecycle Timeline</span>
                </h2>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('maintenance')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'maintenance'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Maintenance Logs ({history?.maintenanceHistory?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'audit'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Audit Trail ({history?.auditLogs?.length || 0})
                  </button>
                </div>
              </div>

              {/* Maintenance Tab */}
              {activeTab === 'maintenance' && (
                <div>
                  {!history?.maintenanceHistory || history.maintenanceHistory.length === 0 ? (
                    <div className="py-8 text-center">
                      <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-semibold">No maintenance logs recorded</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Log repairs, hardware upgrades, or routine inspections.
                      </p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {history.maintenanceHistory.map((m) => (
                        <div key={m.id} className="relative group">
                          {/* Circle Node */}
                          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-amber-100 text-amber-700 border-2 border-white flex items-center justify-center shadow-2xs">
                            <Wrench className="w-2.5 h-2.5" />
                          </div>

                          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                {m.maintenanceType}
                              </span>
                            </div>

                            {m.description && (
                              <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
                            )}

                            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                <DollarSign className="w-3 h-3 text-emerald-600" />
                                Cost: IDR {m.cost ? m.cost.toLocaleString() : '0'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(m.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Audit Trail Tab */}
              {activeTab === 'audit' && (
                <div>
                  {!history?.auditLogs || history.auditLogs.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-semibold">No system audit logs found</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {history.auditLogs.map((log) => (
                        <div key={log.id} className="relative group">
                          {/* Circle Node */}
                          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-red-100 text-red-600 border-2 border-white flex items-center justify-center shadow-2xs">
                            <Activity className="w-2.5 h-2.5" />
                          </div>

                          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-1 hover:bg-slate-50 transition-colors text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-red-600 uppercase text-[11px]">
                                ACTION: {log.action}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium">
                              Performed by: <strong className="text-slate-900">{log.username || 'System Admin'}</strong>
                            </p>
                            {log.newValues && (
                              <div className="mt-1.5 p-2 rounded-xl bg-white border border-slate-100 text-[11px] font-mono text-slate-600 overflow-x-auto">
                                <pre className="text-[10px]">{JSON.stringify(log.newValues, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Visual Barcode Badge & Current Assignment */}
          <div className="space-y-6">
            {/* Barcode / QR Code Visual Badge Preview Card */}
            <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-red-600" />
                  Asset Tag Preview
                </span>
                <span className="text-[10px] font-mono bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">
                  VERIFIED TAG
                </span>
              </div>

              {/* Visual Badge Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden text-left font-mono border border-slate-800">
                {/* Red Accent top strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-700" />

                <div className="flex items-center justify-between pt-1 mb-3">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                    AMS IT PROPERTY
                  </span>
                  <span className="text-[9px] text-red-400 font-bold uppercase">SECURE</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-white tracking-wider leading-none">
                      {asset.assetCode}
                    </p>
                    <p className="text-[11px] text-slate-300 font-sans mt-1 line-clamp-1 font-semibold">
                      {asset.name}
                    </p>
                    {asset.serialNumber && (
                      <p className="text-[9px] text-slate-400 mt-1 font-mono">
                        S/N: {asset.serialNumber}
                      </p>
                    )}
                  </div>

                  {/* Mock SVG Barcode */}
                  <div className="w-16 h-16 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                </div>

                {/* SVG Barcode Lines */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col items-center gap-1">
                  <div className="w-full h-8 flex items-center justify-between gap-0.5">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2].map((w, idx) => (
                      <div key={idx} className="h-full bg-slate-200" style={{ width: `${w * 2}px` }} />
                    ))}
                  </div>
                  <span className="text-[8px] text-slate-400 tracking-widest mt-0.5">
                    *{asset.assetCode}*
                  </span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Asset Tag Label</span>
              </button>
            </div>

            {/* Current Assignment Info Card */}
            <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Assignment Status
                </h3>
              </div>

              {asset.assignedEmployeeName ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                      {asset.assignedEmployeeName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {asset.assignedEmployeeName}
                      </p>
                      {asset.assignedEmployeeCode && (
                        <p className="text-[11px] font-mono text-blue-700 font-medium">
                          Code: {asset.assignedEmployeeCode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-2 text-slate-600 pt-1">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Deployed Location</span>
                      <span className="font-semibold text-slate-800">{asset.locationName || 'Standard Office'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Allocation Date</span>
                      <span className="font-mono text-slate-700">
                        {asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 text-center space-y-2 border border-slate-200">
                  <UserIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Currently Unassigned</p>
                  <p className="text-[11px] text-slate-400">
                    This asset is available in central stock for employee assignment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Log Maintenance Modal --- */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Log Maintenance Record</h3>
              </div>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {maintError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{maintError}</span>
              </div>
            )}

            <form onSubmit={handleLogMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Maintenance Type
                </label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Routine Service">Routine Service</option>
                  <option value="Hardware Repair">Hardware Repair</option>
                  <option value="Software/OS Reinstall">Software / OS Reinstall</option>
                  <option value="Battery Replacement">Battery Replacement</option>
                  <option value="Component Upgrade">Component Upgrade</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Title / Subject
                </label>
                <input
                  type="text"
                  required
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  placeholder="e.g. SSD Upgrade to 1TB NVMe"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Estimated Repair Cost (IDR)
                </label>
                <input
                  type="number"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Description / Service Details
                </label>
                <textarea
                  rows={3}
                  value={maintDescription}
                  onChange={(e) => setMaintDescription(e.target.value)}
                  placeholder="Details of symptoms, replaced parts, vendor name, warranty status..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={maintSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {maintSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Logging...</span>
                    </>
                  ) : (
                    <span>Save Log</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Dispose Modal --- */}
      {isDisposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-slate-600" />
                <h3 className="text-base font-bold text-slate-900">Decommission & Dispose Asset</h3>
              </div>
              <button
                onClick={() => setIsDisposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {disposeError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{disposeError}</span>
              </div>
            )}

            <form onSubmit={handleDisposeAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Decommission Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={disposeReason}
                  onChange={(e) => setDisposeReason(e.target.value)}
                  placeholder="e.g. End of lifespan, unrepairable hardware failure, recycled..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisposeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disposeSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {disposeSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Disposal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
