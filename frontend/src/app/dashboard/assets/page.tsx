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
  ChevronRight
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
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Stat Calculations
  const totalCount = assets.length;
  const assignedCount = assets.filter((a) => a.status === 'Assigned').length;
  const availableCount = assets.filter((a) => a.status === 'Available').length;
  const maintenanceCount = assets.filter((a) => a.status === 'Maintenance').length;
  const disposedCount = assets.filter((a) => a.status === 'Disposed').length;

  // Open Create Asset Modal
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

  // Open Edit Asset Modal
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

  const closeAssetModal = () => {
    setIsAssetModalOpen(false);
    setEditingAsset(null);
    setAssetModalError(null);
  };

  // Save Asset Form (Create / Edit)
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryId) {
      setAssetModalError('Please select a category');
      return;
    }
    setAssetModalError(null);
    setAssetSubmitting(true);

    try {
      const payload = {
        name: formName.trim(),
        categoryId: Number(formCategoryId),
        locationId: formLocationId ? Number(formLocationId) : null,
        serialNumber: formSerialNumber.trim() || null,
        status: formStatus,
        condition: formCondition,
        notes: formNotes.trim() || null,
      };

      if (editingAsset) {
        await api.put(`/assets/${editingAsset.id}`, payload);
      } else {
        await api.post('/assets', payload);
      }
      closeAssetModal();
      fetchAssets();
    } catch (err: any) {
      setAssetModalError(err.message || 'Operation failed');
    } finally {
      setAssetSubmitting(false);
    }
  };

  // Open Quick Assign Modal
  const openAssignModal = (asset: Asset) => {
    setAssigningAsset(asset);
    setAssignEmployeeId(asset.assignedToEmployeeId || '');
    setAssignLocationId(asset.locationId || '');
    setAssignNotes('');
    setAssignModalError(null);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssigningAsset(null);
    setAssignModalError(null);
  };

  // Save Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId && !assignLocationId) {
      setAssignModalError('Select at least an employee or location to assign');
      return;
    }
    setAssignModalError(null);
    setAssignSubmitting(true);

    try {
      if (!assigningAsset) return;
      await api.post(`/assets/${assigningAsset.id}/assign`, {
        assignedToEmployeeId: assignEmployeeId ? Number(assignEmployeeId) : null,
        assignedToLocationId: assignLocationId ? Number(assignLocationId) : null,
        notes: assignNotes.trim() || null,
      });
      closeAssignModal();
      fetchAssets();
    } catch (err: any) {
      setAssignModalError(err.message || 'Assignment failed');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Handle Delete Asset
  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this IT asset record?')) return;
    try {
      await api.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  // Clear Filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedStatus('');
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedLocation || selectedStatus);

  // Status Badge Helper
  const renderStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-semibold border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-semibold border border-blue-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Assigned
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-mono font-semibold border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Maintenance
          </span>
        );
      case 'Disposed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-semibold border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Disposed
          </span>
        );
      case 'Lost':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-mono font-semibold border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Lost
          </span>
        );
      default:
        return <span className="text-xs font-mono text-slate-500">{status}</span>;
    }
  };

  // Condition Badge Helper
  const renderConditionBadge = (condition: Asset['condition']) => {
    switch (condition) {
      case 'Good':
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-mono border border-emerald-100">Good</span>;
      case 'Fair':
        return <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-mono border border-sky-100">Fair</span>;
      case 'Poor':
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-mono border border-amber-100">Poor</span>;
      case 'Damaged':
        return <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[11px] font-mono border border-rose-100 font-bold">Damaged</span>;
      default:
        return <span className="text-xs text-slate-500">{condition}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>IT Asset Inventory</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {totalCount} Total
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware tracking, employee assignments, serial barcodes & service history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAssets}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-xl shadow-red-600/20 transition-all cursor-pointer text-xs flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Asset</span>
            </button>
          </div>
        </div>

        {/* Bento Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Assets */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
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
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
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
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
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
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
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
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
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
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
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

                          {/* Quick Assign */}
                          <button
                            onClick={() => openAssignModal(asset)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                            title="Assign to Employee / Location"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

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
                onClick={closeAssetModal}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assetModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assetModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAsset} className="space-y-4">
              {/* Asset Name */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Asset Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. MacBook Pro M3 Max 16-inch"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              {/* Category & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                    Category *
                  </label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.codePrefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                    Location
                  </label>
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500"
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

              {/* Serial Number & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formSerialNumber}
                    onChange={(e) => setFormSerialNumber(e.target.value)}
                    placeholder="SN-9988776655"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                    Condition
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500"
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Disposed">Disposed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Notes / Specification Details
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional technical specifications, warranty details, or purchase notes..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Submit / Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeAssetModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assetSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {assetSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAsset ? 'Update Asset' : 'Save Asset'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Quick Assignment Modal --- */}
      {isAssignModalOpen && assigningAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign IT Asset</h3>
                  <p className="text-[11px] font-mono text-red-600 font-bold">{assigningAsset.assetCode} - {assigningAsset.name}</p>
                </div>
              </div>
              <button
                onClick={closeAssignModal}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Assign To Employee
                </label>
                <select
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Override Selection */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Deploy Location
                </label>
                <select
                  value={assignLocationId}
                  onChange={(e) => setAssignLocationId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Keep / Select Location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5 font-semibold">
                  Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Handover date, accessories included, condition check notes..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {assignSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <span>Confirm Assignment</span>
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
