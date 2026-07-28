'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Key,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Clock,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Building2,
  Laptop,
  Disc,
  CreditCard,
  User as UserIcon,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  RefreshCw,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export interface Vendor {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  fullName: string;
  employeeCode: string;
  email?: string;
  position?: string;
}

export interface Asset {
  id: number;
  name: string;
  assetCode: string;
  serialNumber?: string;
  status?: string;
}

export interface LicenseAllocation {
  id: number;
  licenseId: number;
  employeeId?: number | null;
  employeeName?: string | null;
  employeeCode?: string | null;
  employeeEmail?: string | null;
  employeePosition?: string | null;
  assetId?: number | null;
  assetName?: string | null;
  assetCode?: string | null;
  assetSerialNumber?: string | null;
  allocatedAt: string;
  notes?: string | null;
}

export interface SoftwareLicenseDetail {
  id: number;
  name: string;
  licenseKey?: string | null;
  licenseType?: string | null;
  vendorId?: number | null;
  vendorName?: string | null;
  totalSeats: number;
  usedSeats: number;
  purchaseDate?: string | null;
  expirationDate?: string | null;
  cost?: string | number | null;
  status: string;
  notes?: string | null;
  createdAt?: string;
  allocations: LicenseAllocation[];
}

export default function LicenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const licenseId = Number(resolvedParams.id);
  const router = useRouter();

  // Data States
  const [license, setLicense] = useState<SoftwareLicenseDetail | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Key Visibility State
  const [showFullKey, setShowFullKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Allocate Seat Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'employee' | 'asset'>('employee');
  const [allocateEmployeeId, setAllocateEmployeeId] = useState<number | ''>('');
  const [allocateAssetId, setAllocateAssetId] = useState<number | ''>('');
  const [allocateNotes, setAllocateNotes] = useState('');
  const [allocateSubmitting, setAllocateSubmitting] = useState(false);
  const [allocateModalError, setAllocateModalError] = useState<string | null>(null);

  // Revoke Seat Modal State
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokingAllocation, setRevokingAllocation] = useState<LicenseAllocation | null>(null);
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);

  // Edit License Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLicenseKey, setFormLicenseKey] = useState('');
  const [formLicenseType, setFormLicenseType] = useState('Perpetual');
  const [formVendorId, setFormVendorId] = useState<number | ''>('');
  const [formTotalSeats, setFormTotalSeats] = useState(1);
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formNotes, setFormNotes] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Delete License Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Fetch Data
  const fetchLicenseData = useCallback(async () => {
    if (isNaN(licenseId)) {
      setError('Invalid license ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [licData, vendorsData, employeesData, assetsData] = await Promise.all([
        api.get<SoftwareLicenseDetail>(`/licenses/${licenseId}`),
        api.get<Vendor[]>('/master/vendors').catch(() => []),
        api.get<Employee[]>('/employees').catch(() => []),
        api.get<Asset[]>('/assets').catch(() => []),
      ]);

      setLicense(licData);
      setVendors(vendorsData || []);
      setEmployees(employeesData || []);
      setAssets(assetsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch software license details');
    } finally {
      setLoading(false);
    }
  }, [licenseId]);

  useEffect(() => {
    fetchLicenseData();
  }, [fetchLicenseData]);

  // Handle Copy Key
  const handleCopyKey = () => {
    if (!license?.licenseKey) return;
    navigator.clipboard.writeText(license.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Open Allocate Modal
  const openAllocateModal = () => {
    setTargetType('employee');
    setAllocateEmployeeId('');
    setAllocateAssetId('');
    setAllocateNotes('');
    setAllocateModalError(null);
    setIsAllocateModalOpen(true);
  };

  // Handle Seat Allocation Submit
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    if (targetType === 'employee' && !allocateEmployeeId) {
      setAllocateModalError('Please select an employee to allocate seat.');
      return;
    }
    if (targetType === 'asset' && !allocateAssetId) {
      setAllocateModalError('Please select a laptop / asset to allocate seat.');
      return;
    }

    try {
      setAllocateSubmitting(true);
      setAllocateModalError(null);

      const payload = {
        employeeId: targetType === 'employee' ? Number(allocateEmployeeId) : null,
        assetId: targetType === 'asset' ? Number(allocateAssetId) : null,
        notes: allocateNotes.trim() || null,
      };

      await api.post(`/licenses/${license.id}/allocate`, payload);
      setIsAllocateModalOpen(false);
      fetchLicenseData();
    } catch (err: any) {
      setAllocateModalError(err.message || 'Failed to allocate license seat');
    } finally {
      setAllocateSubmitting(false);
    }
  };

  // Open Revoke Modal
  const openRevokeModal = (alloc: LicenseAllocation) => {
    setRevokingAllocation(alloc);
    setIsRevokeModalOpen(true);
  };

  // Handle Revoke Submit
  const handleRevokeConfirm = async () => {
    if (!license || !revokingAllocation) return;

    try {
      setRevokeSubmitting(true);
      await api.post(`/licenses/${license.id}/revoke`, {
        allocationId: revokingAllocation.id,
      });
      setIsRevokeModalOpen(false);
      setRevokingAllocation(null);
      fetchLicenseData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke license seat');
    } finally {
      setRevokeSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = () => {
    if (!license) return;
    setFormName(license.name);
    setFormLicenseKey(license.licenseKey || '');
    setFormLicenseType(license.licenseType || 'Perpetual');
    setFormVendorId(license.vendorId || '');
    setFormTotalSeats(license.totalSeats || 1);
    setFormPurchaseDate(license.purchaseDate ? new Date(license.purchaseDate).toISOString().split('T')[0] : '');
    setFormExpirationDate(license.expirationDate ? new Date(license.expirationDate).toISOString().split('T')[0] : '');
    setFormCost(license.cost !== undefined && license.cost !== null ? String(license.cost) : '');
    setFormStatus(license.status || 'Active');
    setFormNotes(license.notes || '');
    setEditModalError(null);
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    if (!formName.trim()) {
      setEditModalError('Software name is required');
      return;
    }

    try {
      setEditSubmitting(true);
      setEditModalError(null);

      const payload = {
        name: formName.trim(),
        licenseKey: formLicenseKey.trim() || null,
        licenseType: formLicenseType || null,
        vendorId: formVendorId !== '' ? Number(formVendorId) : null,
        totalSeats: Number(formTotalSeats) || 1,
        purchaseDate: formPurchaseDate ? formPurchaseDate : null,
        expirationDate: formExpirationDate ? formExpirationDate : null,
        cost: formCost ? formCost : null,
        status: formStatus,
        notes: formNotes.trim() || null,
      };

      await api.put(`/licenses/${license.id}`, payload);
      setIsEditModalOpen(false);
      fetchLicenseData();
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update software license');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!license) return;
    try {
      setDeleteSubmitting(true);
      await api.delete(`/licenses/${license.id}`);
      router.push('/dashboard/licenses');
    } catch (err: any) {
      alert(err.message || 'Failed to delete license');
      setDeleteSubmitting(false);
    }
  };

  // Render License Type Badge
  const renderLicenseTypeBadge = (type?: string | null) => {
    switch (type) {
      case 'CD / Dongle':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <Disc className="w-4 h-4 text-purple-600" />
            <span>CD / Dongle</span>
          </span>
        );
      case 'OEM Bundled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Laptop className="w-4 h-4 text-blue-600" />
            <span>OEM Bundled</span>
          </span>
        );
      case 'Subscription':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>Subscription</span>
          </span>
        );
      case 'Perpetual':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Perpetual</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="font-mono text-sm text-slate-500">Loading Software Workspace...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !license) {
    return (
      <DashboardLayout>
        <div className="py-12 space-y-4">
          <Link
            href="/dashboard/licenses"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Software Catalog</span>
          </Link>

          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-4 max-w-xl mx-auto">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">Error loading license details</p>
              <p className="text-xs text-red-600 mt-1">{error || 'License not found.'}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const percentUsed = Math.min(100, Math.round(((license.usedSeats || 0) / (license.totalSeats || 1)) * 100));
  const availableSeats = Math.max(0, license.totalSeats - license.usedSeats);
  const isFull = license.usedSeats >= license.totalSeats;

  // Expiration calculations
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  let expFormatted = 'No Expiry (Perpetual)';
  let isExpiringSoon = false;
  let isExpired = license.status === 'Expired';
  if (license.expirationDate) {
    const expDate = new Date(license.expirationDate);
    expFormatted = expDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (expDate <= thirtyDaysFromNow && expDate > now) {
      isExpiringSoon = true;
    } else if (expDate <= now) {
      isExpired = true;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/licenses"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Software Catalog</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLicenseData}
              className="p-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
              title="Refresh Workspace"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Top Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {license.name}
                </h1>
                {renderLicenseTypeBadge(license.licenseType)}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    license.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : license.status === 'Expired'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      license.status === 'Active' ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                    }`}
                  />
                  {license.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 flex items-center gap-2">
                <span>Vendor: <span className="font-semibold text-slate-800">{license.vendorName || 'Direct / N/A'}</span></span>
                <span>•</span>
                <span>Registered ID: <span className="font-semibold text-slate-800">#LIC-{license.id}</span></span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={openAllocateModal}
                disabled={isFull}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                  isFull
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:scale-[0.98]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Allocate Seat</span>
              </button>

              <button
                onClick={openEditModal}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs md:text-sm rounded-xl border border-slate-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit License</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                title="Delete License"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed License Bento Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: License Key & Serial Info */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-red-600" />
                <span>License Credentials & Keys</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Protected Key</span>
            </div>

            {/* Key Preview Badge Box */}
            <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-red-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Software Key / Serial</p>
                  <p className="font-bold text-white tracking-widest truncate">
                    {license.licenseKey
                      ? showFullKey
                        ? license.licenseKey
                        : license.licenseKey.length <= 8
                        ? '••••' + license.licenseKey.slice(-4)
                        : '••••-••••-••••-' + license.licenseKey.slice(-4)
                      : 'No License Key Recorded'}
                  </p>
                </div>
              </div>

              {license.licenseKey && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowFullKey(!showFullKey)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                    title={showFullKey ? 'Mask License Key' : 'Reveal License Key'}
                  >
                    {showFullKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="hidden sm:inline">{showFullKey ? 'Mask' : 'Reveal'}</span>
                  </button>

                  <button
                    onClick={handleCopyKey}
                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
                    title="Copy Key to Clipboard"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* License Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Type</p>
                <p className="text-xs font-bold text-slate-900 mt-1">{license.licenseType || 'Perpetual'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Purchase Date</p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {license.purchaseDate
                    ? new Date(license.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Expiration Date</p>
                <p className="text-xs font-bold text-slate-900 mt-1">{expFormatted}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Cost / Value</p>
                <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                  {license.cost ? `IDR ${Number(license.cost).toLocaleString('id-ID')}` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Notes Panel */}
            {license.notes && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Notes & Physical Location:</span>
                </p>
                <p className="text-slate-600 leading-relaxed font-sans">{license.notes}</p>
              </div>
            )}
          </div>

          {/* Card 2: Seat Utilization Gauge */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-red-600" />
                  <span>Seat Utilization Gauge</span>
                </h2>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Capacity</span>
              </div>

              <div className="text-center py-2 space-y-1">
                <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {license.usedSeats} <span className="text-lg text-slate-400 font-normal">/ {license.totalSeats}</span>
                </div>
                <p className="text-xs font-semibold text-slate-500">Seats Allocated</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Capacity Usage</span>
                  <span className={`font-bold ${isFull ? 'text-red-600' : 'text-slate-700'}`}>{percentUsed}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-red-600' : percentUsed >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                  <p className="text-[10px] text-blue-600 font-semibold uppercase">Assigned</p>
                  <p className="text-base font-bold text-blue-900 mt-0.5">{license.usedSeats}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase">Available</p>
                  <p className="text-base font-bold text-emerald-900 mt-0.5">{availableSeats}</p>
                </div>
              </div>
            </div>

            {/* Quick Action in Card Footer */}
            <button
              onClick={openAllocateModal}
              disabled={isFull}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isFull
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isFull ? 'All Seats Occupied' : 'Allocate New Seat'}</span>
            </button>
          </div>
        </div>

        {/* Active Seat Allocations Workspace Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-red-600" />
                <span>Active Seat Allocations</span>
                <span className="ml-2 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {license.allocations.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                List of employees and IT laptop assets currently holding a valid seat license key or CD/dongle.
              </p>
            </div>

            <button
              onClick={openAllocateModal}
              disabled={isFull}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                isFull
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Seat</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-5">Target / Assignee</th>
                  <th className="py-3.5 px-4">Target Type</th>
                  <th className="py-3.5 px-4">Details / Identifiers</th>
                  <th className="py-3.5 px-4">Allocated Date</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans">
                {license.allocations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <UserCheck className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">No active seat allocations</p>
                        <p className="text-xs text-slate-500">
                          Click "Allocate Seat" to assign this software license to an employee or IT asset laptop.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  license.allocations.map((alloc) => {
                    const isEmployeeTarget = !!alloc.employeeId;

                    return (
                      <tr key={alloc.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Target Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold font-mono text-xs ${
                                isEmployeeTarget
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              }`}
                            >
                              {isEmployeeTarget ? <UserIcon className="w-4.5 h-4.5" /> : <Laptop className="w-4.5 h-4.5" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {isEmployeeTarget ? alloc.employeeName : alloc.assetName}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500">
                                {isEmployeeTarget ? alloc.employeeCode : alloc.assetCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Target Type Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isEmployeeTarget ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                              <UserIcon className="w-3.5 h-3.5" />
                              <span>Employee</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-2xs">
                              <Laptop className="w-3.5 h-3.5" />
                              <span>IT Asset</span>
                            </span>
                          )}
                        </td>

                        {/* Details / Identifiers */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isEmployeeTarget ? (
                            <div className="space-y-0.5 text-xs text-slate-600">
                              <p className="font-medium text-slate-800">{alloc.employeePosition || 'Employee'}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{alloc.employeeEmail || 'No email'}</p>
                            </div>
                          ) : (
                            <div className="space-y-0.5 text-xs text-slate-600">
                              <p className="font-mono text-slate-800">SN: {alloc.assetSerialNumber || 'N/A'}</p>
                            </div>
                          )}
                        </td>

                        {/* Allocated Date */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-600">
                          {alloc.allocatedAt
                            ? new Date(alloc.allocatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </td>

                        {/* Notes */}
                        <td className="py-4 px-4">
                          <p className="text-xs text-slate-600 truncate max-w-xs" title={alloc.notes || ''}>
                            {alloc.notes || '—'}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 whitespace-nowrap text-right">
                          <button
                            onClick={() => openRevokeModal(alloc)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                            title="Revoke Seat Allocation"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Revoke Seat</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ALLOCATE SEAT MODAL --- */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Allocate Software Seat</h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Assign a seat for <span className="font-bold text-slate-800">{license.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* License Availability Info */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">Available Seats:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {availableSeats} / {license.totalSeats} Free
              </span>
            </div>

            {allocateModalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{allocateModalError}</span>
              </div>
            )}

            <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs font-sans">
              {/* Target Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Allocation Target Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('employee')}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all cursor-pointer ${
                      targetType === 'employee'
                        ? 'bg-red-50 text-red-700 border-red-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Employee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('asset')}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all cursor-pointer ${
                      targetType === 'asset'
                        ? 'bg-red-50 text-red-700 border-red-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    <span>Laptop / Asset</span>
                  </button>
                </div>
              </div>

              {/* Target Selection Dropdown */}
              {targetType === 'employee' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Employee</label>
                  <select
                    value={allocateEmployeeId}
                    onChange={(e) => setAllocateEmployeeId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-medium"
                  >
                    <option value="">Choose Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode}) {emp.position ? `- ${emp.position}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Laptop / IT Asset</label>
                  <select
                    value={allocateAssetId}
                    onChange={(e) => setAllocateAssetId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-medium"
                  >
                    <option value="">Choose IT Asset...</option>
                    {assets.map((ast) => (
                      <option key={ast.id} value={ast.id}>
                        {ast.name} ({ast.assetCode}) {ast.serialNumber ? `[SN: ${ast.serialNumber}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Allocation Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dongle assigned to engineering laptop or Office account bundled with new joiner MacBook."
                  value={allocateNotes}
                  onChange={(e) => setAllocateNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-sans"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocateSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {allocateSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Allocate Seat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REVOKE SEAT CONFIRMATION MODAL --- */}
      {isRevokeModalOpen && revokingAllocation && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Revoke Seat Allocation</h3>
                <p className="text-xs text-slate-500 font-sans">Reclaim software license seat capacity.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to revoke seat allocation for{' '}
              <span className="font-bold text-slate-900">
                {revokingAllocation.employeeId ? revokingAllocation.employeeName : revokingAllocation.assetName}
              </span>
              ? This will decrease used seat counts and free up 1 seat capacity for this software license.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRevokeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeConfirm}
                disabled={revokeSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {revokeSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Revoke Seat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT LICENSE MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Software License</h3>
                  <p className="text-xs text-slate-500 font-sans">Update license specifications and seat limits.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Software Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">License Key / Serial Number</label>
                <input
                  type="text"
                  value={formLicenseKey}
                  onChange={(e) => setFormLicenseKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">License Type</label>
                  <select
                    value={formLicenseType}
                    onChange={(e) => setFormLicenseType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-medium"
                  >
                    <option value="CD / Dongle">CD / Dongle</option>
                    <option value="OEM Bundled">OEM Bundled</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Perpetual">Perpetual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor</label>
                  <select
                    value={formVendorId}
                    onChange={(e) => setFormVendorId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-medium"
                  >
                    <option value="">Select Vendor (Optional)</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formTotalSeats}
                    onChange={(e) => setFormTotalSeats(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={formExpirationDate}
                    onChange={(e) => setFormExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cost / Price</label>
                <input
                  type="text"
                  value={formCost}
                  onChange={(e) => setFormCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Physical Location</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Software License</h3>
                <p className="text-xs text-slate-500 font-sans">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">{license.name}</span>? All seat allocations for this license will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete License</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
