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
  Plus,
  ArrowRightLeft,
  UserX
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

interface AssignmentHistoryRecord {
  id: number;
  assetId: number;
  employeeId?: number | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  employeePosition?: string | null;
  departmentName?: string | null;
  assignedByUsername?: string | null;
  assignedAt: string;
  returnedAt?: string | null;
  conditionOnAssign: string;
  conditionOnReturn?: string | null;
  handoverNotes?: string | null;
  returnNotes?: string | null;
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
  assignmentHistory: AssignmentHistoryRecord[];
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
  const [activeTab, setActiveTab] = useState<'transfers' | 'maintenance' | 'audit'>('transfers');

  // Print Asset Tag Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
          assignmentHistory: [],
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

  // Dedicated Thermal Sticker Print Handler
  const handlePrintSticker = () => {
    if (!asset) return;

    const printWindow = window.open('', '_blank', 'width=650,height=480');
    if (!printWindow) {
      alert('Please allow popups in your browser to print the asset tag sticker.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag Sticker - ${asset.assetCode}</title>
          <style>
            @page {
              size: 80mm 50mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 8px;
              font-family: 'Courier New', Courier, monospace;
              background: #ffffff;
              color: #000000;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .tag-card {
              width: 78mm;
              height: 48mm;
              border: 2px solid #000000;
              border-radius: 6px;
              padding: 6px 10px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #ffffff;
            }
            .header {
              font-size: 9px;
              font-weight: bold;
              letter-spacing: 1px;
              border-bottom: 1.5px solid #000000;
              padding-bottom: 3px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              text-transform: uppercase;
            }
            .body-content {
              text-align: center;
              margin: 4px 0;
            }
            .barcode-lines {
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 1px;
              margin: 2px 0;
              line-height: 1;
            }
            .asset-code {
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 2px;
              margin: 2px 0;
            }
            .asset-name {
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .footer-meta {
              font-size: 8px;
              border-top: 1px solid #000000;
              padding-top: 3px;
              display: flex;
              justify-content: space-between;
            }
            .warning {
              font-size: 7px;
              font-style: italic;
              text-align: center;
              margin-top: 2px;
            }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <div class="header">
              <span>ERP CAHAYA AMS</span>
              <span>IT ASSET</span>
            </div>
            <div class="body-content">
              <div class="barcode-lines">||| ||| | ||||| ||| |||</div>
              <div class="asset-code">${asset.assetCode}</div>
              <div class="asset-name">${asset.name}</div>
            </div>
            <div>
              <div class="footer-meta">
                <span>S/N: ${asset.serialNumber || 'N/A'}</span>
                <span>LOC: ${asset.locationName || 'HEAD OFFICE'}</span>
              </div>
              <div class="warning">PROPERTY OF COMPANY - DO NOT REMOVE</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Handle Log Maintenance Submit
  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;
    setMaintError(null);
    setMaintSubmitting(true);

    try {
      await api.post(`/assets/${assetId}/maintenance`, {
        maintenanceType: maintType,
        title: maintTitle || `${maintType} - ${asset?.name}`,
        description: maintDescription || null,
        cost: typeof maintCost === 'number' ? maintCost : 0,
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
  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;
    setDisposeError(null);
    setDisposeSubmitting(true);

    try {
      await api.post(`/assets/${assetId}/dispose`, {
        reason: disposeReason,
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <span>Loading asset details and tracking logs...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !asset) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-lg mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Asset Record Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested asset does not exist or has been removed.'}</p>
          <Link
            href="/dashboard/assets"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Asset List</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Assigned':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Disposed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'Good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Fair':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Poor':
      case 'Damaged':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Link & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/assets"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 hover:text-red-600 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Asset Catalog</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold font-mono text-red-600 px-3 py-1 bg-red-50 border border-red-200 rounded-xl">
                {asset.assetCode}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{asset.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl text-xs shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-red-600" />
              <span>Print Asset Tag</span>
            </button>

            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 font-bold rounded-xl text-xs shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Log Maintenance</span>
            </button>

            {asset.status !== 'Disposed' && (
              <button
                onClick={() => setIsDisposeModalOpen(true)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-bold rounded-xl text-xs shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Archive className="w-4 h-4 text-rose-600" />
                <span>Dispose Asset</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Asset Technical Specs */}
          <div className="glass-panel p-6 rounded-3xl bg-white space-y-4 md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-red-600" />
                <span>Technical Specifications</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(asset.status)}`}>
                  {asset.status}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getConditionBadge(asset.condition)}`}>
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
                <span className="font-bold text-slate-800">{asset.locationName || 'Unassigned Facility'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block mb-1">Assigned User</span>
                <span className="font-bold text-red-600">{asset.assignedEmployeeName || 'Stock / Pool'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block mb-1">Registered Date</span>
                <span className="font-bold text-slate-800">{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            {asset.notes && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-mono text-[10px] text-slate-400 uppercase block mb-1 font-bold">Notes & Specifications</span>
                <p className="text-slate-700 whitespace-pre-wrap">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Card 2: Asset Barcode Badge Preview */}
          <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-red-50/20 border border-slate-200 flex flex-col justify-between items-center text-center">
            <div className="w-full border-b border-slate-200 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-900 uppercase">AMS Property Tag</span>
              <ShieldCheck className="w-4 h-4 text-red-600" />
            </div>

            <div className="my-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center w-full max-w-[220px]">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl mx-auto flex items-center justify-center mb-2 border border-red-200">
                <QrCode className="w-8 h-8" />
              </div>
              <p className="font-mono font-extrabold text-sm text-slate-900 tracking-wider">{asset.assetCode}</p>
              <p className="text-[9px] font-mono text-slate-500 mt-0.5 truncate">{asset.name}</p>
            </div>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-red-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker Label</span>
            </button>
          </div>
        </div>

        {/* Device Tracking & History Tabs */}
        <div className="space-y-4">
          <div className="glass-panel p-2 rounded-2xl bg-white flex items-center gap-2 border border-slate-200">
            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'transfers'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Device Transfer History ({history?.assignmentHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Maintenance Logs ({history?.maintenanceHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Audit Trail ({history?.auditLogs?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: Device Transfer Tracking History */}
          {activeTab === 'transfers' && (
            <div className="glass-panel p-6 rounded-3xl bg-white space-y-6 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-red-600" />
                    <span>Device Ownership & User Transfer Tracking</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete chronological record of users who have used and returned this device
                  </p>
                </div>
              </div>

              {!history?.assignmentHistory || history.assignmentHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <UserX className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No transfer history recorded yet</p>
                  <p className="text-slate-400 mt-0.5">Assign this asset to an employee to initiate device tracking.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {history.assignmentHistory.map((item, idx) => {
                    const isCurrentActive = !item.returnedAt;
                    return (
                      <div key={item.id || idx} className="relative group">
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-[31px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isCurrentActive
                              ? 'bg-red-600 border-white text-white shadow-md shadow-red-600/30'
                              : 'bg-slate-100 border-slate-300 text-slate-500'
                          }`}
                        >
                          <UserIcon className="w-3 h-3" />
                        </div>

                        {/* Transfer Item Box */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {item.employeeName || 'Unassigned User'}
                              </span>
                              {item.employeeCode && (
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                                  {item.employeeCode}
                                </span>
                              )}
                              {item.departmentName && (
                                <span className="text-[11px] text-slate-500 font-medium">({item.departmentName})</span>
                              )}
                            </div>

                            <span
                              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border w-fit ${
                                isCurrentActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-200 text-slate-600 border-slate-300'
                              }`}
                            >
                              {isCurrentActive ? '● Current Active Owner' : 'Returned / Reallocated'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase block">Assigned Date</span>
                              <span className="font-semibold text-slate-800">
                                {new Date(item.assignedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 text-[10px] uppercase block">Returned Date</span>
                              <span className="font-semibold text-slate-800">
                                {item.returnedAt ? new Date(item.returnedAt).toLocaleDateString() : 'Active Assignment'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 text-[10px] uppercase block">Condition on Assign</span>
                              <span className="font-semibold text-emerald-700">{item.conditionOnAssign}</span>
                            </div>

                            <div>
                              <span className="text-slate-400 text-[10px] uppercase block">Condition on Return</span>
                              <span className="font-semibold text-amber-700">{item.conditionOnReturn || '—'}</span>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-1 text-xs">
                            {item.handoverNotes && (
                              <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                                <strong className="font-mono text-[10px] text-slate-500 uppercase block">Handover Notes:</strong>
                                {item.handoverNotes}
                              </p>
                            )}
                            {item.returnNotes && (
                              <p className="text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                                <strong className="font-mono text-[10px] text-amber-700 uppercase block">Return / Transfer Notes:</strong>
                                {item.returnNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Maintenance History */}
          {activeTab === 'maintenance' && (
            <div className="glass-panel p-6 rounded-3xl bg-white space-y-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Service & Maintenance Records</span>
              </h3>

              {!history?.maintenanceHistory || history.maintenanceHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <Wrench className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No maintenance records logged</p>
                  <p className="text-slate-400 mt-0.5">Use the "Log Maintenance" button to record routine repairs.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.maintenanceHistory.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-amber-700 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded">
                            {m.maintenanceType}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                        </div>
                        {m.description && <p className="text-xs text-slate-600">{m.description}</p>}
                        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                          <span>By: {m.performedByUsername || 'System Tech'}</span>
                          <span>Completed: {m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'In Progress'}</span>
                        </div>
                      </div>
                      <div className="font-mono font-extrabold text-sm text-slate-900 sm:text-right">
                        Rp {Number(m.cost || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="glass-panel p-6 rounded-3xl bg-white space-y-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>System Audit Logs</span>
              </h3>

              {!history?.auditLogs || history.auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {history.auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600 px-2 py-0.5 bg-red-50 border border-red-200 rounded text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-slate-800">{log.username || 'System Admin'}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Printable Asset Tag Modal --- */}
      {isPrintModalOpen && asset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-red-600" />
                <span>Print IT Asset Property Tag Sticker</span>
              </h3>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Preview Box */}
            <div className="my-4 p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-md text-center space-y-3 font-mono">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase border-b border-slate-900 pb-1 text-slate-900">
                <span>ERP CAHAYA ITSM</span>
                <span>PROPERTY TAG</span>
              </div>

              <div className="py-2">
                <div className="text-2xl font-black text-slate-900 tracking-widest leading-none">
                  ||| ||| | ||||| ||| |||
                </div>
                <p className="font-mono font-black text-lg text-red-600 tracking-wider mt-1">{asset.assetCode}</p>
                <p className="text-xs font-bold text-slate-800 truncate">{asset.name}</p>
              </div>

              <div className="text-[10px] border-t border-slate-900 pt-1.5 flex justify-between font-bold text-slate-700">
                <span>S/N: {asset.serialNumber || 'N/A'}</span>
                <span>LOC: {asset.locationName || 'HO-JKT'}</span>
              </div>
              <div className="text-[9px] text-slate-500 italic">DO NOT REMOVE - INTERNAL ASSET TRACKER</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPrintModalOpen(false);
                  handlePrintSticker();
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-red-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tag Label (Sticker)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Log Maintenance Service</span>
              </h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogMaintenance} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Service Type</label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                >
                  <option value="Routine Service">Routine Service</option>
                  <option value="Hardware Repair">Hardware Repair</option>
                  <option value="RAM/SSD Upgrade">RAM/SSD Upgrade</option>
                  <option value="OS Reinstall">OS Reinstall</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Description / Findings</label>
                <textarea
                  rows={2}
                  value={maintDescription}
                  onChange={(e) => setMaintDescription(e.target.value)}
                  placeholder="Details of repair..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Cost (IDR)</label>
                <input
                  type="number"
                  value={maintCost}
                  onChange={(e) => setMaintCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={maintSubmitting}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs"
                >
                  {maintSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispose Modal */}
      {isDisposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <Archive className="w-4 h-4 text-rose-600" />
                <span>Decommission & Dispose Asset</span>
              </h3>
              <button onClick={() => setIsDisposeModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispose} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Reason for Disposal</label>
                <textarea
                  rows={3}
                  required
                  value={disposeReason}
                  onChange={(e) => setDisposeReason(e.target.value)}
                  placeholder="e.g. Beyond economical repair, end of life..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisposeModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disposeSubmitting}
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs"
                >
                  {disposeSubmitting ? 'Processing...' : 'Confirm Disposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
