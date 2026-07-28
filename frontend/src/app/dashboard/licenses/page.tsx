'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Key,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserPlus,
  Building2,
  Laptop,
  Disc,
  CreditCard,
  User as UserIcon
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

export interface SoftwareLicense {
  id: number;
  name: string;
  licenseKey?: string | null;
  licenseType?: string | null; // 'CD / Dongle', 'OEM Bundled', 'Subscription', 'Perpetual'
  vendorId?: number | null;
  vendorName?: string | null;
  totalSeats: number;
  usedSeats: number;
  purchaseDate?: string | null;
  expirationDate?: string | null;
  cost?: string | number | null;
  status: string; // 'Active', 'Expired', 'Deactivated'
  notes?: string | null;
  createdAt?: string;
}

export default function LicensesPage() {
  const router = useRouter();

  // Data States
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');

  // Create/Edit Modal State
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);
  const [formName, setFormName] = useState('');
  const [formLicenseKey, setFormLicenseKey] = useState('');
  const [formLicenseType, setFormLicenseType] = useState<string>('Perpetual');
  const [formVendorId, setFormVendorId] = useState<number | ''>('');
  const [formTotalSeats, setFormTotalSeats] = useState<number>(1);
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formNotes, setFormNotes] = useState('');
  const [licenseSubmitting, setLicenseSubmitting] = useState(false);
  const [licenseModalError, setLicenseModalError] = useState<string | null>(null);

  // Quick Allocate Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocatingLicense, setAllocatingLicense] = useState<SoftwareLicense | null>(null);
  const [targetType, setTargetType] = useState<'employee' | 'asset'>('employee');
  const [allocateEmployeeId, setAllocateEmployeeId] = useState<number | ''>('');
  const [allocateAssetId, setAllocateAssetId] = useState<number | ''>('');
  const [allocateNotes, setAllocateNotes] = useState('');
  const [allocateSubmitting, setAllocateSubmitting] = useState(false);
  const [allocateModalError, setAllocateModalError] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState<SoftwareLicense | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string for licenses
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedType) params.append('licenseType', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedVendor) params.append('vendorId', selectedVendor);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const [licensesData, vendorsData, employeesData, assetsData] = await Promise.all([
        api.get<SoftwareLicense[]>(`/licenses${queryString}`),
        api.get<Vendor[]>('/master/vendors').catch(() => []),
        api.get<Employee[]>('/employees').catch(() => []),
        api.get<Asset[]>('/assets').catch(() => []),
      ]);

      setLicenses(licensesData || []);
      setVendors(vendorsData || []);
      setEmployees(employeesData || []);
      setAssets(assetsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load software licenses');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedStatus, selectedVendor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistics calculation
  const totalLicensesCount = licenses.length;
  const totalAllocatedSeats = licenses.reduce((sum, l) => sum + (l.usedSeats || 0), 0);
  const totalAvailableSeats = licenses.reduce((sum, l) => sum + Math.max(0, (l.totalSeats || 0) - (l.usedSeats || 0)), 0);
  
  // Calculate expiring soon or expired
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringOrAlertsCount = licenses.filter((l) => {
    if (l.status === 'Expired') return true;
    if (!l.expirationDate) return false;
    const expDate = new Date(l.expirationDate);
    return expDate <= thirtyDaysFromNow;
  }).length;

  // Open Create Modal
  const openCreateModal = () => {
    setEditingLicense(null);
    setFormName('');
    setFormLicenseKey('');
    setFormLicenseType('Perpetual');
    setFormVendorId('');
    setFormTotalSeats(1);
    setFormPurchaseDate('');
    setFormExpirationDate('');
    setFormCost('');
    setFormStatus('Active');
    setFormNotes('');
    setLicenseModalError(null);
    setIsLicenseModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (lic: SoftwareLicense) => {
    setEditingLicense(lic);
    setFormName(lic.name);
    setFormLicenseKey(lic.licenseKey || '');
    setFormLicenseType(lic.licenseType || 'Perpetual');
    setFormVendorId(lic.vendorId || '');
    setFormTotalSeats(lic.totalSeats || 1);
    setFormPurchaseDate(lic.purchaseDate ? new Date(lic.purchaseDate).toISOString().split('T')[0] : '');
    setFormExpirationDate(lic.expirationDate ? new Date(lic.expirationDate).toISOString().split('T')[0] : '');
    setFormCost(lic.cost !== undefined && lic.cost !== null ? String(lic.cost) : '');
    setFormStatus(lic.status || 'Active');
    setFormNotes(lic.notes || '');
    setLicenseModalError(null);
    setIsLicenseModalOpen(true);
  };

  // Handle License Create/Update Submit
  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setLicenseModalError('Software name is required');
      return;
    }

    try {
      setLicenseSubmitting(true);
      setLicenseModalError(null);

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

      if (editingLicense) {
        await api.put(`/licenses/${editingLicense.id}`, payload);
      } else {
        await api.post('/licenses', payload);
      }

      setIsLicenseModalOpen(false);
      fetchData();
    } catch (err: any) {
      setLicenseModalError(err.message || 'Failed to save software license');
    } finally {
      setLicenseSubmitting(false);
    }
  };

  // Open Quick Allocate Modal
  const openAllocateModal = (lic: SoftwareLicense) => {
    setAllocatingLicense(lic);
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
    if (!allocatingLicense) return;

    if (targetType === 'employee' && !allocateEmployeeId) {
      setAllocateModalError('Please select an employee to allocate a seat.');
      return;
    }
    if (targetType === 'asset' && !allocateAssetId) {
      setAllocateModalError('Please select a laptop / asset to allocate a seat.');
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

      await api.post(`/licenses/${allocatingLicense.id}/allocate`, payload);
      setIsAllocateModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAllocateModalError(err.message || 'Failed to allocate license seat');
    } finally {
      setAllocateSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (lic: SoftwareLicense) => {
    setDeletingLicense(lic);
    setIsDeleteModalOpen(true);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingLicense) return;
    try {
      setDeleteSubmitting(true);
      await api.delete(`/licenses/${deletingLicense.id}`);
      setIsDeleteModalOpen(false);
      setDeletingLicense(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete license');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Render License Type Badge
  const renderLicenseTypeBadge = (type?: string | null) => {
    switch (type) {
      case 'CD / Dongle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
            <Disc className="w-3.5 h-3.5" />
            <span>CD / Dongle</span>
          </span>
        );
      case 'OEM Bundled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
            <Laptop className="w-3.5 h-3.5" />
            <span>OEM Bundled</span>
          </span>
        );
      case 'Subscription':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription</span>
          </span>
        );
      case 'Perpetual':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Perpetual</span>
          </span>
        );
    }
  };

  // Helper for key masking
  const maskKey = (key?: string | null) => {
    if (!key) return '—';
    if (key.length <= 8) return '••••' + key.slice(-4);
    return '••••-••••-••••-' + key.slice(-4);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
                <Key className="w-5.5 h-5.5" />
              </div>
              <span>Software License Catalog</span>
            </h1>
            <p className="text-sm text-slate-500 font-sans mt-1">
              Manage software keys, CD/Dongle hardware keys, OEM OS bundles, subscriptions, and seat allocations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Software License</span>
            </button>
          </div>
        </div>

        {/* Bento Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Software Licenses */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Total Software</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{totalLicensesCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-red-600 font-semibold font-mono">Cataloged</span> across systems
            </div>
          </div>

          {/* Card 2: Allocated Seats */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Allocated Seats</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{totalAllocatedSeats}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-blue-600 font-semibold font-mono">Active</span> employee & asset seats
            </div>
          </div>

          {/* Card 3: Available Seats */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Available Seats</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{totalAvailableSeats}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-emerald-600 font-semibold font-mono">Ready</span> for allocation
            </div>
          </div>

          {/* Card 4: Expiring Soon / Renewal Alerts */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Expiring / Renewal</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{expiringOrAlertsCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-amber-600 font-semibold font-mono">Action required</span> within 30 days
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search software name, key, vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-sans text-slate-800"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* License Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-slate-700"
              >
                <option value="">All License Types</option>
                <option value="CD / Dongle">CD / Dongle</option>
                <option value="OEM Bundled">OEM Bundled</option>
                <option value="Subscription">Subscription</option>
                <option value="Perpetual">Perpetual</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Deactivated">Deactivated</option>
              </select>
            </div>

            {/* Vendor Filter */}
            <div>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-slate-700"
              >
                <option value="">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={fetchData} className="underline font-bold text-red-700 hover:text-red-800">
              Retry
            </button>
          </div>
        )}

        {/* Glass License Table Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-5">Software Name & Details</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Seat Utilization</th>
                  <th className="py-3.5 px-4">Expiration Date</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                        <span className="font-mono text-xs text-slate-500">Loading Software Catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : licenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="max-w-xs mx-auto text-slate-400 space-y-2">
                        <Key className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">No software licenses found</p>
                        <p className="text-xs text-slate-500">
                          {search || selectedType || selectedStatus || selectedVendor
                            ? 'Try adjusting your filters or search query.'
                            : 'Click "Add Software License" to register your first license.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  licenses.map((lic) => {
                    const percentUsed = Math.min(100, Math.round(((lic.usedSeats || 0) / (lic.totalSeats || 1)) * 100));
                    const isFull = lic.usedSeats >= lic.totalSeats;
                    
                    // Expiration calculation
                    let expText = 'No Expiry (Perpetual)';
                    let isExpiringSoon = false;
                    let isExpired = lic.status === 'Expired';
                    if (lic.expirationDate) {
                      const expDate = new Date(lic.expirationDate);
                      expText = expDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      if (expDate <= thirtyDaysFromNow && expDate > now) {
                        isExpiringSoon = true;
                      } else if (expDate <= now) {
                        isExpired = true;
                      }
                    }

                    return (
                      <tr key={lic.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Software Name & Key */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <Link
                              href={`/dashboard/licenses/${lic.id}`}
                              className="font-bold text-slate-900 group-hover:text-red-600 transition-colors inline-flex items-center gap-1.5"
                            >
                              <span>{lic.name}</span>
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                                Key: {maskKey(lic.licenseKey)}
                              </span>
                              {lic.notes && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={lic.notes}>
                                  {lic.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* License Type Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {renderLicenseTypeBadge(lic.licenseType)}
                        </td>

                        {/* Seat Utilization */}
                        <td className="py-4 px-4 min-w-[160px]">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-semibold text-slate-700">
                                {lic.usedSeats} / {lic.totalSeats} Seats
                              </span>
                              <span className={`text-[10px] font-bold ${isFull ? 'text-red-600' : 'text-slate-500'}`}>
                                {percentUsed}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  isFull
                                    ? 'bg-red-600'
                                    : percentUsed >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Expiration Date */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium text-slate-800">{expText}</div>
                            {isExpired && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" /> Expired
                              </span>
                            )}
                            {isExpiringSoon && !isExpired && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3" /> Expiring Soon
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Vendor */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {lic.vendorName || 'Direct / N/A'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
                              lic.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : lic.status === 'Expired'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                lic.status === 'Active'
                                  ? 'bg-emerald-600 animate-pulse'
                                  : lic.status === 'Expired'
                                  ? 'bg-red-600'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {lic.status || 'Active'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Detail */}
                            <Link
                              href={`/dashboard/licenses/${lic.id}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View License Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Allocate Seat */}
                            <button
                              onClick={() => openAllocateModal(lic)}
                              disabled={isFull}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isFull
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={isFull ? 'No seats available' : 'Quick Allocate Seat'}
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(lic)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit License"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => openDeleteModal(lic)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete License"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* --- CREATE / EDIT LICENSE MODAL --- */}
      {isLicenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingLicense ? 'Edit Software License' : 'Add Software License'}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    {editingLicense ? 'Update software license specs and seat counts.' : 'Register new software product key, CD/dongle, or OEM bundle.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLicenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {licenseModalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{licenseModalError}</span>
              </div>
            )}

            <form onSubmit={handleLicenseSubmit} className="space-y-4 text-xs font-sans">
              {/* Software Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Software Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AVEVA System Platform 2023 R2 or Windows 10 Pro OEM"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-medium"
                />
              </div>

              {/* License Key / Serial */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  License Key / Dongle Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. XXXXX-XXXXX-XXXXX-XXXXX or USB-DONGLE-9921"
                  value={formLicenseKey}
                  onChange={(e) => setFormLicenseKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-mono"
                />
              </div>

              {/* License Type & Vendor */}
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

              {/* Total Seats & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Seats <span className="text-red-600">*</span>
                  </label>
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

              {/* Dates */}
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

              {/* Cost */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cost / Price (IDR or Currency)</label>
                <input
                  type="text"
                  placeholder="e.g. 15000000"
                  value={formCost}
                  onChange={(e) => setFormCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Physical Location</label>
                <textarea
                  rows={2}
                  placeholder="e.g. USB Dongle placed in Server Room Rack A, Slot 2. Bound to Dell XPS laptop."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 font-sans"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLicenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={licenseSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {licenseSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingLicense ? 'Save Changes' : 'Create License'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK SEAT ALLOCATION MODAL --- */}
      {isAllocateModalOpen && allocatingLicense && (
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
                    Assign a seat for <span className="font-bold text-slate-800">{allocatingLicense.name}</span>
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
                {allocatingLicense.totalSeats - allocatingLicense.usedSeats} / {allocatingLicense.totalSeats} Free
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

      {/* --- DELETE LICENSE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && deletingLicense && (
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
              Are you sure you want to delete <span className="font-bold text-slate-900">{deletingLicense.name}</span>? All active seat allocation records for this license will also be revoked and removed.
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
