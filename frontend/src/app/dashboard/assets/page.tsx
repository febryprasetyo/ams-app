'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  HardDrive,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Eye,
  Filter,
  RefreshCw,
  Boxes,
  PackageCheck,
  Wrench,
  Archive,
  MapPin,
  User as UserIcon,
  Tag,
  CheckCircle2,
  Building2,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';

export interface AssetCategory {
  id: number;
  name: string;
  codePrefix: string;
}

export interface LocationItem {
  id: number;
  code: string;
  name: string;
}

export interface EmployeeItem {
  id: number;
  employeeCode: string;
  fullName: string;
  email?: string;
}

export interface Asset {
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

export default function AssetsPage() {
  const router = useRouter();

  // Primary State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Create/Edit Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formLocationId, setFormLocationId] = useState<number | ''>('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formStatus, setFormStatus] = useState<'Available' | 'Assigned' | 'Maintenance' | 'Disposed' | 'Lost'>('Available');
  const [formCondition, setFormCondition] = useState<'Good' | 'Fair' | 'Poor' | 'Damaged'>('Good');
  const [formNotes, setFormNotes] = useState('');
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [assetModalError, setAssetModalError] = useState<string | null>(null);

  // Quick Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState<number | ''>('');
  const [assignLocationId, setAssignLocationId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignModalError, setAssignModalError] = useState<string | null>(null);

  // Unassign Modal State
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [unassigningAsset, setUnassigningAsset] = useState<Asset | null>(null);
  const [unassignReturnNotes, setUnassignReturnNotes] = useState('');
  const [unassignCondition, setUnassignCondition] = useState<'Good' | 'Fair' | 'Poor' | 'Damaged'>('Good');
  const [unassignSubmitting, setUnassignSubmitting] = useState(false);
  const [unassignModalError, setUnassignModalError] = useState<string | null>(null);

  // Fetch Auxiliary Master Data (Categories, Locations, Employees)
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [cats, locs, emps] = await Promise.all([
        api.get<AssetCategory[]>('/assets/categories').catch(() => []),
        api.get<LocationItem[]>('/master/locations').catch(() => []),
        api.get<EmployeeItem[]>('/employees').catch(() => []),
      ]);
      setCategories(cats);
      setLocations(locs);
      setEmployees(emps);
    } catch (err) {
      console.error('Failed to load auxiliary data', err);
    }
  }, []);

  // Fetch Assets with query params
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (selectedCategory) queryParams.set('categoryId', selectedCategory);
      if (selectedLocation) queryParams.set('locationId', selectedLocation);
      if (selectedStatus) queryParams.set('status', selectedStatus);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const data = await api.get<Asset[]>(`/assets${queryString}`);
      setAssets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset inventory');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedLocation, selectedStatus]);

  useEffect(() => {
    fetchAuxiliaryData();
    fetchAssets();
  }, [fetchAuxiliaryData, fetchAssets]);

  // Handler: Open Create Modal
  const openCreateModal = () => {
    setEditingAsset(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || '');
    setFormLocationId('');
    setFormSerialNumber('');
    setFormStatus('Available');
    setFormCondition('Good');
    setFormNotes('');
    setAssetModalError(null);
    setIsAssetModalOpen(true);
  };

  // Handler: Open Edit Modal
  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormCategoryId(asset.categoryId);
    setFormLocationId(asset.locationId || '');
    setFormSerialNumber(asset.serialNumber || '');
    setFormStatus(asset.status);
    setFormCondition(asset.condition);
    setFormNotes(asset.notes || '');
    setAssetModalError(null);
    setIsAssetModalOpen(true);
  };

  // Handler: Open Assign Modal
  const openAssignModal = (asset: Asset) => {
    setAssigningAsset(asset);
    setAssignEmployeeId(asset.assignedToEmployeeId || '');
    setAssignLocationId(asset.locationId || '');
    setAssignNotes('');
    setAssignModalError(null);
    setIsAssignModalOpen(true);
  };

  // Handler: Open Unassign Modal
  const openUnassignModal = (asset: Asset) => {
    setUnassigningAsset(asset);
    setUnassignReturnNotes('');
    setUnassignCondition(asset.condition || 'Good');
    setUnassignModalError(null);
    setIsUnassignModalOpen(true);
  };

  // Submit Create / Edit Asset Form
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategoryId) {
      setAssetModalError('Asset name and category are required.');
      return;
    }

    setAssetSubmitting(true);
    setAssetModalError(null);

    const payload = {
      name: formName.trim(),
      categoryId: Number(formCategoryId),
      locationId: formLocationId ? Number(formLocationId) : null,
      serialNumber: formSerialNumber.trim() || null,
      status: formStatus,
      condition: formCondition,
      notes: formNotes.trim() || null,
    };

    try {
      if (editingAsset) {
        await api.put(`/assets/${editingAsset.id}`, payload);
      } else {
        await api.post('/assets', payload);
      }
      setIsAssetModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      setAssetModalError(err.message || 'Failed to save asset');
    } fontFinally: {
      setAssetSubmitting(false);
    }
  };

  // Submit Quick Assign Form
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningAsset) return;

    if (!assignEmployeeId && !assignLocationId) {
      setAssignModalError('Please select an employee or location to assign.');
      return;
    }

    setAssignSubmitting(true);
    setAssignModalError(null);

    try {
      await api.post(`/assets/${assigningAsset.id}/assign`, {
        assignedToEmployeeId: assignEmployeeId ? Number(assignEmployeeId) : null,
        assignedToLocationId: assignLocationId ? Number(assignLocationId) : null,
        notes: assignNotes.trim() || null,
      });
      setIsAssignModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      setAssignModalError(err.message || 'Failed to assign asset');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Submit Unassign Form
  const handleUnassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unassigningAsset) return;

    setUnassignSubmitting(true);
    setUnassignModalError(null);

    try {
      await api.post(`/assets/${unassigningAsset.id}/unassign`, {
        returnNotes: unassignReturnNotes.trim() || 'Unassigned and returned to available IT stock pool',
        conditionOnReturn: unassignCondition,
      });
      setIsUnassignModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      setUnassignModalError(err.message || 'Failed to unassign asset');
    } finally {
      setUnassignSubmitting(false);
    }
  };

  // Handle Delete Asset
  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset from inventory?')) return;
    try {
      await api.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  // Clear All Filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedStatus('');
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedLocation || selectedStatus);

  // Computed Metrics
  const totalCount = assets.length;
  const assignedCount = assets.filter((a) => a.status === 'Assigned').length;
  const availableCount = assets.filter((a) => a.status === 'Available').length;
  const maintenanceCount = assets.filter((a) => a.status === 'Maintenance').length;
  const disposedCount = assets.filter((a) => a.status === 'Disposed').length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Assigned
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      case 'Disposed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Disposed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const renderConditionBadge = (cond: string) => {
    switch (cond) {
      case 'Good':
        return <span className="text-[11px] font-semibold text-emerald-700 font-mono">Good</span>;
      case 'Fair':
        return <span className="text-[11px] font-semibold text-amber-700 font-mono">Fair</span>;
      case 'Poor':
      case 'Damaged':
        return <span className="text-[11px] font-semibold text-rose-700 font-mono">{cond}</span>;
      default:
        return <span className="text-[11px] text-slate-500 font-mono">{cond}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <HardDrive className="w-7 h-7 text-red-600" />
              <span>IT Asset Inventory & Lifecycle</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage enterprise IT equipment, track user assignment history, and log maintenance events
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Asset</span>
          </button>
        </div>

        {/* Bento Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Assets */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Total Assets
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 mt-2">{totalCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-red-600 font-bold">100%</span> tracked
            </div>
          </div>

          {/* Card 2: In Use / Assigned */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                In Use / Assigned
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-blue-600 mt-2">{assignedCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span>{totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0}% of total</span>
            </div>
          </div>

          {/* Card 3: Available Stock */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Available Stock
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 mt-2">{availableCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-emerald-600 font-bold">Ready</span> to deploy
            </div>
          </div>

          {/* Card 4: In Maintenance */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                In Maintenance
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-amber-600 mt-2">{maintenanceCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span>Under service</span>
            </div>
          </div>

          {/* Card 5: Disposed */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Disposed
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-slate-600 mt-2">{disposedCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-mono">
              <span>Decommissioned</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by asset code, name, or serial number..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.codePrefix})
                  </option>
                ))}
              </select>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer font-mono"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Disposed">Disposed</option>
                <option value="Lost">Lost</option>
              </select>

              {/* Clear Filter Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Glass Asset Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200 w-full">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
              <Loader2 className="w-7 h-7 animate-spin text-red-600" />
              <span>Fetching asset inventory...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="p-16 text-center">
              <HardDrive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-800 font-bold text-sm">No IT Assets Found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'No assets match your current search or status filter. Try clearing filters.'
                  : 'Start by creating your first IT asset inventory item.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-semibold">Asset Code</th>
                    <th className="py-3.5 px-5 font-semibold">Name & Category</th>
                    <th className="py-3.5 px-5 font-semibold">Serial Number</th>
                    <th className="py-3.5 px-5 font-semibold">Location</th>
                    <th className="py-3.5 px-5 font-semibold">Assigned Employee</th>
                    <th className="py-3.5 px-5 font-semibold">Status</th>
                    <th className="py-3.5 px-5 font-semibold">Condition</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-red-50/30 transition-colors group"
                    >
                      {/* Asset Code */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <Link
                          href={`/dashboard/assets/${asset.id}`}
                          className="font-mono font-bold text-red-600 hover:text-red-700 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 hover:border-red-300 transition-colors inline-flex items-center gap-1 group/code"
                        >
                          <span>{asset.assetCode}</span>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                        </Link>
                      </td>

                      {/* Name & Category */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <Link
                            href={`/dashboard/assets/${asset.id}`}
                            className="font-bold text-slate-900 group-hover:text-red-600 transition-colors text-xs"
                          >
                            {asset.name}
                          </Link>
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {asset.categoryName || 'General Category'}
                          </span>
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className="py-4 px-5 font-mono text-slate-600 whitespace-nowrap">
                        {asset.serialNumber ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {asset.serialNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {asset.locationName ? (
                          <span className="text-slate-700 font-medium flex items-center gap-1.5 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {asset.locationName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not Set</span>
                        )}
                      </td>

                      {/* Assigned Employee */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {asset.assignedEmployeeName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-mono font-bold text-[10px] flex items-center justify-center">
                              {asset.assignedEmployeeName[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-xs">
                                {asset.assignedEmployeeName}
                              </span>
                              {asset.assignedEmployeeCode && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {asset.assignedEmployeeCode}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {renderStatusBadge(asset.status)}
                      </td>

                      {/* Condition */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {renderConditionBadge(asset.condition)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <Link
                            href={`/dashboard/assets/${asset.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                            title="View Asset Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Quick Assign / Reassign */}
                          <button
                            onClick={() => openAssignModal(asset)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                            title="Assign to Employee / Location"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Unassign / Return to Stock */}
                          {asset.assignedToEmployeeId != null && (
                            <button
                              onClick={() => openUnassignModal(asset)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
                              title="Unassign & Return to Stock"
                            >
                              <UserX className="w-4 h-4 text-amber-600" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(asset)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Edit Asset"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- Create & Edit Asset Modal --- */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-red-600" />
                <span>{editingAsset ? `Edit Asset (${editingAsset.assetCode})` : 'Create New IT Asset'}</span>
              </h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assetModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assetModalError}</span>
              </div>
            )}

            <form onSubmit={handleAssetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Asset Name / Model *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. MacBook Pro 16 M3 Max, Dell UltraSharp 27"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.codePrefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">Location</label>
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                  >
                    <option value="">Unassigned Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formSerialNumber}
                  onChange={(e) => setFormSerialNumber(e.target.value)}
                  placeholder="e.g. C02G1234MD6R, DL-XPS-998811"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-red-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Disposed">Disposed</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">Condition</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-red-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">Technical Notes</label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional specs or remarks..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assetSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-2"
                >
                  {assetSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingAsset ? 'Update Asset' : 'Save New Asset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Quick Assign Asset Modal --- */}
      {isAssignModalOpen && assigningAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Assign Asset</span>
                </h3>
                <p className="text-xs text-red-600 font-mono font-bold mt-0.5">{assigningAsset.assetCode} — {assigningAsset.name}</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignModalError}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Target Employee
                </label>
                <select
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                >
                  <option value="">Unassigned (None)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Primary Location Facility
                </label>
                <select
                  value={assignLocationId}
                  onChange={(e) => setAssignLocationId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                >
                  <option value="">Keep Existing Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Handover Notes
                </label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Issued for Software Engineering role..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                  {assignSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Unassign Asset Modal --- */}
      {isUnassignModalOpen && unassigningAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-amber-700 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-amber-600" />
                  <span>Unassign & Return Device to Stock</span>
                </h3>
                <p className="text-xs text-red-600 font-mono font-bold mt-0.5">{unassigningAsset.assetCode} — {unassigningAsset.name}</p>
              </div>
              <button
                onClick={() => setIsUnassignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {unassignModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{unassignModalError}</span>
              </div>
            )}

            <form onSubmit={handleUnassignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Condition on Return
                </label>
                <select
                  value={unassignCondition}
                  onChange={(e) => setUnassignCondition(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-red-500"
                >
                  <option value="Good">Good (Clean / No issues)</option>
                  <option value="Fair">Fair (Minor cosmetic scuffs)</option>
                  <option value="Poor">Poor (Requires servicing)</option>
                  <option value="Damaged">Damaged (Broken hardware)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Return / Reallocation Notes
                </label>
                <textarea
                  rows={3}
                  value={unassignReturnNotes}
                  onChange={(e) => setUnassignReturnNotes(e.target.value)}
                  placeholder="e.g. Returned upon resignation / project completion. Checked by IT..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unassignSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
                >
                  {unassignSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                  <span>Return to Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
