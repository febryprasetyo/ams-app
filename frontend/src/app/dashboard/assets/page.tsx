'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CustodianPicker, { VerificationBadge } from '@/components/assets/CustodianPicker';
import { api } from '@/lib/api';
import {
  buildCustodianSelectionPayload,
  type CustodianPickerValue,
  type CustodianSummary,
} from '@/lib/assetCustodian';
import { useAuth } from '@/context/AuthContext';
import {
  buildComputerSpecsPayload,
  canSubmitAssetForm,
  isComputerCategoryName,
  type AssetAccessoryFormItem,
} from '@/lib/assetForm';
import {
  canManageAssets,
  canManageLifecycle,
  canCommitAssetImport,
  getCustodianResolutionRows,
  type AssetImportPreview,
  type AssetImportCommitResult,
} from '@/lib/assetImport';
import {
  HardDrive,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  MapPin,
  User as UserIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wrench,
  UserCheck,
  UserX,
  Download,
  Upload,
  FileSpreadsheet,
  Cpu,
  Layers,
  Disc,
  Headphones,
  Check,
  AlertTriangle,
  FileUp,
  RefreshCw,
  Archive
} from 'lucide-react';

interface ComputerSpecs {
  cpuName?: string | null;
  ramSizeGb?: number | null;
  ramSlotCount?: number | null;
  disk1SizeGb?: number | null;
  disk2SizeGb?: number | null;
}

interface AssetAccessory {
  id?: number;
  accessoryType: string;
  description?: string | null;
  quantity: number;
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  notes?: string | null;
}

interface AssetItem {
  id: number;
  assetCode: string;
  name: string;
  categoryId: number;
  categoryName: string;
  categoryCodePrefix: string;
  locationId: number | null;
  locationName: string | null;
  currentCustodianId: number | null;
  currentCustodian: CustodianSummary | null;
  assignedToEmployeeId?: number | null;
  assignedEmployeeName?: string | null;
  assignedEmployeeCode?: string | null;
  serialNumber: string | null;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Disposed' | 'Lost';
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  notes: string | null;
  computerSpecs?: ComputerSpecs | null;
  accessories?: AssetAccessory[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryItem {
  id: number;
  name: string;
  codePrefix: string;
  description?: string | null;
}

interface LocationItem {
  id: number;
  code: string;
  name: string;
}

export default function AssetsPage() {
  const { user } = useAuth();
  const canManage = canManageAssets(user?.roleName);
  const canLifecycle = canManageLifecycle(user?.roleName);

  // Assets List State
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Create / Edit Asset Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formAssetCode, setFormAssetCode] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formLocationId, setFormLocationId] = useState<number | ''>('');
  const [formCustodian, setFormCustodian] = useState<CustodianPickerValue>({ kind: 'none' });
  const [formCondition, setFormCondition] = useState<'Good' | 'Fair' | 'Poor' | 'Damaged'>('Good');
  const [formNotes, setFormNotes] = useState('');

  // Computer Hardware Specs State
  const [formCpuName, setFormCpuName] = useState('');
  const [formRamSizeGb, setFormRamSizeGb] = useState<number | ''>('');
  const [formRamSlotCount, setFormRamSlotCount] = useState<number | ''>('');
  const [formDisk1SizeGb, setFormDisk1SizeGb] = useState<number | ''>('');
  const [formDisk2SizeGb, setFormDisk2SizeGb] = useState<number | ''>('');
  const [formAccessories, setFormAccessories] = useState<AssetAccessoryFormItem[]>([]);

  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<AssetItem | null>(null);
  const [assignCustodian, setAssignCustodian] = useState<CustodianPickerValue>({ kind: 'none' });
  const [assignLocationId, setAssignLocationId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignModalError, setAssignModalError] = useState<string | null>(null);

  // Unassign Modal State
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [unassigningAsset, setUnassigningAsset] = useState<AssetItem | null>(null);
  const [unassignCondition, setUnassignCondition] = useState<'Good' | 'Fair' | 'Poor' | 'Damaged'>('Good');
  const [unassignReturnNotes, setUnassignReturnNotes] = useState('');
  const [unassignSubmitting, setUnassignSubmitting] = useState(false);
  const [unassignModalError, setUnassignModalError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingAsset, setDeletingAsset] = useState<AssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  // General Feedback / Notification Modal State
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // XLSX Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<AssetImportPreview | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<AssetImportCommitResult | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Determine if selected category is Laptop or PC
  const selectedCatObj = categories.find((c) => c.id === formCategoryId);
  const isComputerType = isComputerCategoryName(selectedCatObj?.name) || selectedCatObj?.codePrefix === 'PC' || selectedCatObj?.codePrefix === 'LPT';

  // Fetch Auxiliary Master Data
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [catsRes, locsRes] = await Promise.all([
        api.get<CategoryItem[]>('/assets/categories').catch(() => []),
        api.get<LocationItem[]>('/master/locations').catch(() => []),
      ]);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setLocations(Array.isArray(locsRes) ? locsRes : []);
    } catch (err: any) {
      console.error('Failed to load auxiliary data', err);
    }
  }, []);

  // Fetch Assets
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'ALL') params.append('categoryId', selectedCategory);
      if (selectedLocation !== 'ALL') params.append('locationId', selectedLocation);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedCondition !== 'ALL') params.append('condition', selectedCondition);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await api.get<{ data: AssetItem[]; total: number }>(`/assets?${params.toString()}`);
      if (res && Array.isArray(res.data)) {
        setAssets(res.data);
        setTotalCount(res.total || res.data.length);
      } else if (Array.isArray(res)) {
        setAssets(res);
        setTotalCount((res as any).length);
      } else {
        setAssets([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset inventory');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedLocation, selectedStatus, selectedCondition, page, limit]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Open Create Asset Modal
  const handleOpenCreateModal = () => {
    setEditingAsset(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || '');
    setFormAssetCode('');
    setFormSerialNumber('');
    setFormLocationId(locations[0]?.id || '');
    setFormCustodian({ kind: 'none' });
    setFormCondition('Good');
    setFormNotes('');
    setFormCpuName('');
    setFormRamSizeGb('');
    setFormRamSlotCount('');
    setFormDisk1SizeGb('');
    setFormDisk2SizeGb('');
    setFormAccessories([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Asset Modal
  const handleOpenEditModal = (asset: AssetItem) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormCategoryId(asset.categoryId);
    setFormAssetCode(asset.assetCode);
    setFormSerialNumber(asset.serialNumber || '');
    setFormLocationId(asset.locationId || '');
    setFormCustodian(asset.currentCustodian
      ? { kind: 'custodian', custodian: asset.currentCustodian }
      : { kind: 'none' });
    setFormCondition(asset.condition);
    setFormNotes(asset.notes || '');

    if (asset.computerSpecs) {
      setFormCpuName(asset.computerSpecs.cpuName || '');
      setFormRamSizeGb(asset.computerSpecs.ramSizeGb || '');
      setFormRamSlotCount(asset.computerSpecs.ramSlotCount || '');
      setFormDisk1SizeGb(asset.computerSpecs.disk1SizeGb || '');
      setFormDisk2SizeGb(asset.computerSpecs.disk2SizeGb ?? '');
    } else {
      setFormCpuName('');
      setFormRamSizeGb('');
      setFormRamSlotCount('');
      setFormDisk1SizeGb('');
      setFormDisk2SizeGb('');
    }

    if (asset.accessories && asset.accessories.length > 0) {
      setFormAccessories(
        asset.accessories.map((a) => ({
          id: a.id,
          accessoryType: a.accessoryType,
          description: a.description || '',
          quantity: a.quantity,
          condition: a.condition,
          notes: a.notes || '',
        }))
      );
    } else {
      setFormAccessories([]);
    }

    setModalError(null);
    setIsModalOpen(true);
  };

  // Accessory list mutation helpers
  const handleAddAccessory = () => {
    setFormAccessories([
      ...formAccessories,
      {
        accessoryType: 'Mouse',
        description: '',
        quantity: 1,
        condition: 'Good',
        notes: '',
      },
    ]);
  };

  const handleRemoveAccessory = (index: number) => {
    setFormAccessories(formAccessories.filter((_, idx) => idx !== index));
  };

  const handleUpdateAccessory = (index: number, patch: Partial<AssetAccessoryFormItem>) => {
    setFormAccessories(
      formAccessories.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  // Create / Edit Submit Handler
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isFormValid = canSubmitAssetForm({
      assetName: formName,
      equipmentTypeId: formCategoryId,
      isEditing: !!editingAsset,
      equipmentTypesAvailable: categories.length > 0,
      isComputerType,
      cpuName: formCpuName,
      ramSizeGb: formRamSizeGb,
      ramSlotCount: formRamSlotCount,
      disk1SizeGb: formDisk1SizeGb,
      disk2SizeGb: formDisk2SizeGb,
      accessories: formAccessories,
    });

    if (!isFormValid) {
      setModalError('Please complete the required asset fields and use positive values for any supplied hardware numbers.');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    const payload: any = {
      name: formName.trim(),
      categoryId: Number(formCategoryId),
      assetCode: formAssetCode.trim() || undefined,
      serialNumber: formSerialNumber.trim() || null,
      locationId: formLocationId ? Number(formLocationId) : null,
      ...buildCustodianSelectionPayload(formCustodian, { explicitClear: !!editingAsset }),
      condition: formCondition,
      notes: formNotes.trim() || null,
    };

    if (isComputerType) {
      payload.computerSpecs = buildComputerSpecsPayload({
        cpuName: formCpuName,
        ramSizeGb: formRamSizeGb,
        ramSlotCount: formRamSlotCount,
        disk1SizeGb: formDisk1SizeGb,
        disk2SizeGb: formDisk2SizeGb,
      }) ?? null;
      payload.accessories = formAccessories.map((acc) => ({
        accessoryType: acc.accessoryType.trim(),
        description: acc.description?.trim() || null,
        quantity: Number(acc.quantity),
        condition: acc.condition,
        notes: acc.notes?.trim() || null,
      }));
    } else {
      payload.computerSpecs = null;
      payload.accessories = [];
    }

    try {
      if (editingAsset) {
        await api.put(`/assets/${editingAsset.id}`, payload);
      } else {
        await api.post('/assets', payload);
      }
      setIsModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save asset');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Handlers
  const handleOpenDeleteModal = (asset: AssetItem) => {
    setDeletingAsset(asset);
    setDeleteModalError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAsset) return;
    setIsDeleting(true);
    setDeleteModalError(null);

    try {
      await api.delete(`/assets/${deletingAsset.id}`);
      const deletedName = deletingAsset.name;
      const deletedCode = deletingAsset.assetCode;
      setDeletingAsset(null);
      fetchAssets();
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Asset Deleted Successfully',
        message: `Asset "${deletedName}" (${deletedCode}) has been permanently deleted along with its assignment history and specifications.`,
      });
    } catch (err: any) {
      setDeleteModalError(err.message || 'Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  // Assign Submit Handler
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningAsset) return;
    if (assignCustodian.kind === 'none') {
      setAssignModalError('Select an active custodian before assigning this asset.');
      return;
    }
    setAssignSubmitting(true);
    setAssignModalError(null);

    try {
      await api.post(`/assets/${assigningAsset.id}/assign`, {
        ...buildCustodianSelectionPayload(assignCustodian),
        assignedToLocationId: assignLocationId ? Number(assignLocationId) : undefined,
        handoverNotes: assignNotes.trim() || null,
      });
      setIsAssignModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      setAssignModalError(err.message || 'Failed to assign asset');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Unassign Submit Handler
  const handleUnassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unassigningAsset) return;
    setUnassignSubmitting(true);
    setUnassignModalError(null);

    try {
      await api.post(`/assets/${unassigningAsset.id}/unassign`, {
        conditionOnReturn: unassignCondition,
        returnNotes: unassignReturnNotes.trim() || null,
      });
      setIsUnassignModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      setUnassignModalError(err.message || 'Failed to return asset to stock');
    } finally {
      setUnassignSubmitting(false);
    }
  };

  // Download Template Handler
  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const blob = await api.download('/assets/import/template');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ams-asset-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Failed to download asset import template',
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // XLSX Import Handlers
  const handleOpenImportModal = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportError(null);
    setImportSuccess(null);
    setIsImportModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        setImportError('Only .xlsx spreadsheet files are supported.');
        setImportFile(null);
        return;
      }
      setImportFile(file);
      setImportPreview(null);
      setImportError(null);
      setImportSuccess(null);
    }
  };

  const handlePreviewUpload = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const previewRes = await api.upload<AssetImportPreview>('/assets/import/preview', formData);
      setImportPreview(previewRes);
    } catch (err: any) {
      setImportError(err.message || 'Failed to validate workbook');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importFile || !importPreview || !canCommitAssetImport(importPreview, isCommitting)) return;
    setIsCommitting(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const commitRes = await api.upload<AssetImportCommitResult>('/assets/import/commit', formData);
      setImportSuccess(commitRes);
      fetchAssets();
    } catch (err: any) {
      setImportError(err.message || 'Failed to commit import');
    } finally {
      setIsCommitting(false);
    }
  };

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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <HardDrive className="w-6 h-6 text-red-600" />
              <span>IT Asset & Hardware Inventory</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Comprehensive hardware registry, computer specifications, accessory tracking, and custody lifecycle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                  title="Download standard 4-sheet XLSX bulk import template"
                >
                  {downloadingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Template</span>
                </button>

                <button
                  onClick={handleOpenImportModal}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Import XLSX</span>
                </button>

                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Asset</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Asset Tag, Serial Number, Name, User..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-red-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.codePrefix})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-red-500"
              >
                <option value="ALL">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-red-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Available">Available (Stock)</option>
                <option value="Assigned">Assigned (In Use)</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Asset Inventory Table */}
        <div className="glass-panel rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span>Loading inventory registry...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 text-xs font-mono space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <p>{error}</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs space-y-3">
              <HardDrive className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-slate-600 font-bold">No assets found matching your filter criteria.</p>
              {canManage && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold inline-flex items-center gap-2 text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register First Asset</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Asset Tag</th>
                    <th className="px-4 py-3.5 font-bold">Device & Specs</th>
                    <th className="px-4 py-3.5 font-bold">Category</th>
                    <th className="px-4 py-3.5 font-bold">Location</th>
                    <th className="px-4 py-3.5 font-bold">Custodian</th>
                    <th className="px-4 py-3.5 font-bold">Condition</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {assets.map((asset) => {
                    const isComputer = isComputerCategoryName(asset.categoryName);
                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-3 font-mono font-bold text-red-600 whitespace-nowrap">
                          <Link
                            href={`/dashboard/assets/${asset.id}`}
                            className="hover:underline flex items-center gap-1.5"
                          >
                            <span>{asset.assetCode}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-red-600" />
                          </Link>
                        </td>

                        <td className="px-4 py-3 min-w-[220px]">
                          <div className="font-bold text-slate-900 leading-tight">{asset.name}</div>
                          {isComputer && asset.computerSpecs ? (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>{asset.computerSpecs.cpuName}</span>
                              <span>•</span>
                              <span>{asset.computerSpecs.ramSizeGb}GB RAM</span>
                              <span>•</span>
                              <span>{asset.computerSpecs.disk1SizeGb}GB</span>
                              {asset.accessories && asset.accessories.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  +{asset.accessories.length} Acc
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {asset.serialNumber ? `S/N: ${asset.serialNumber}` : 'Standard Asset'}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                            {asset.categoryName || 'IT Asset'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {asset.locationName || 'Unassigned Facility'}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {asset.currentCustodian ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <div className="font-bold text-slate-900 text-xs">{asset.currentCustodian.displayName}</div>
                                <VerificationBadge status={asset.currentCustodian.verificationStatus} />
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {asset.currentCustodian.employeeCode || asset.currentCustodian.unitText || 'Manual holder'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Available in Stock</span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getConditionBadge(asset.condition)}`}>
                            {asset.condition}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(asset.status)}`}>
                            {asset.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Detail Link */}
                            <Link
                              href={`/dashboard/assets/${asset.id}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* Lifecycle Quick Actions */}
                            {canLifecycle && (
                              <>
                                {asset.status === 'Available' ? (
                                  <button
                                    onClick={() => {
                                      setAssigningAsset(asset);
                                      setAssignCustodian({ kind: 'none' });
                                      setAssignLocationId(asset.locationId || '');
                                      setAssignNotes('');
                                      setAssignModalError(null);
                                      setIsAssignModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Assign to holder"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                ) : asset.status === 'Assigned' ? (
                                  <button
                                    onClick={() => {
                                      setUnassigningAsset(asset);
                                      setUnassignCondition(asset.condition);
                                      setUnassignReturnNotes('');
                                      setUnassignModalError(null);
                                      setIsUnassignModalOpen(true);
                                    }}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Return Asset to Stock"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                ) : null}
                              </>
                            )}

                            {/* Edit / Delete Admin Actions */}
                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(asset)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Edit Asset"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteModal(asset)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Asset"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
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

          {/* Pagination Controls */}
          {totalCount > limit && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} assets
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="px-2 font-bold text-slate-800">
                  Page {page} of {Math.ceil(totalCount / limit)}
                </span>
                <button
                  disabled={page * limit >= totalCount}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Create / Edit Asset Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-red-600" />
                <span>{editingAsset ? 'Edit Asset Record' : 'Register New Hardware Inventory'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Equipment Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-red-500"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.codePrefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Asset Tag Code
                  </label>
                  <input
                    type="text"
                    value={formAssetCode}
                    onChange={(e) => setFormAssetCode(e.target.value)}
                    placeholder="Leave blank for automatic allocation"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Asset Name / Brand & Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. ThinkPad T14 Gen 2 / HP LaserJet Pro M404"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formSerialNumber}
                    onChange={(e) => setFormSerialNumber(e.target.value)}
                    placeholder="e.g. PF2X9871"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Initial Condition
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-red-500"
                  >
                    <option value="Good">Good (Working / Clean)</option>
                    <option value="Fair">Fair (Operational with Scuffs)</option>
                    <option value="Poor">Poor (Degraded Performance)</option>
                    <option value="Damaged">Damaged (Requires Repair)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Primary Facility Location
                  </label>
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

                <div>
                  <CustodianPicker
                    label="Assigned Custodian"
                    value={formCustodian}
                    onChange={setFormCustodian}
                    locations={locations}
                    allowManual={canManage}
                  />
                </div>
              </div>

              {/* Dynamic Computer Hardware Specs Form */}
              {isComputerType && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">
                      Computer Hardware Specifications
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                        Processor (CPU) Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={formCpuName}
                        onChange={(e) => setFormCpuName(e.target.value)}
                        placeholder="e.g. Intel Core i7-1165G7 @ 2.80GHz"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                        RAM Size (GB) (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formRamSizeGb}
                        onChange={(e) => setFormRamSizeGb(e.target.value ? Number(e.target.value) : '')}
                        placeholder="16"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                        RAM Slots (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formRamSlotCount}
                        onChange={(e) => setFormRamSlotCount(e.target.value ? Number(e.target.value) : '')}
                        placeholder="2"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                        Disk 1 Size (GB) (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formDisk1SizeGb}
                        onChange={(e) => setFormDisk1SizeGb(e.target.value ? Number(e.target.value) : '')}
                        placeholder="512"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                        Disk 2 Size (GB) (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formDisk2SizeGb}
                        onChange={(e) => setFormDisk2SizeGb(e.target.value ? Number(e.target.value) : '')}
                        placeholder="Leave blank if not installed"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Attached Accessories Sub-form */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">
                          Attached Computer Accessories ({formAccessories.length})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddAccessory}
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Accessory</span>
                      </button>
                    </div>

                    {formAccessories.length === 0 ? (
                      <p className="text-xs text-slate-400 font-mono italic">No accessories attached.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {formAccessories.map((acc, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">Accessory #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAccessory(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <input
                                  type="text"
                                  placeholder="Type (e.g. Mouse, Bag)"
                                  value={acc.accessoryType}
                                  onChange={(e) => handleUpdateAccessory(idx, { accessoryType: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Description (Model/Brand)"
                                  value={acc.description || ''}
                                  onChange={(e) => handleUpdateAccessory(idx, { description: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Qty"
                                  value={acc.quantity}
                                  onChange={(e) => handleUpdateAccessory(idx, { quantity: e.target.value ? Number(e.target.value) : '' })}
                                  className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                                  required
                                />
                                <select
                                  value={acc.condition}
                                  onChange={(e) => handleUpdateAccessory(idx, { condition: e.target.value as any })}
                                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                                >
                                  <option value="Good">Good</option>
                                  <option value="Fair">Fair</option>
                                  <option value="Poor">Poor</option>
                                  <option value="Damaged">Damaged</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  General Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional hardware details, complaints, vendor warranty..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-2"
                >
                  {modalSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingAsset ? 'Update Asset' : 'Register Asset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Assign Asset Modal --- */}
      {isAssignModalOpen && assigningAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Assign Custody & Handover</span>
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
              <CustodianPicker
                label="Target Custodian"
                value={assignCustodian}
                onChange={setAssignCustodian}
                locations={locations}
                allowManual={canManage}
                allowClear={false}
                required
                accent="blue"
              />

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Facility Location
                </label>
                <select
                  value={assignLocationId}
                  onChange={(e) => setAssignLocationId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="">Keep / Default Holder Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Handover Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Handed over for engineering work with charger and mouse..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
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
                  disabled={assignSubmitting || assignCustodian.kind === 'none'}
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
                  <span>Return Asset to Stock</span>
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="Good">Good (Clean / Operational)</option>
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
                  placeholder="e.g. Returned upon resignation or project completion. Checked by IT..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500"
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

      {/* --- XLSX Import Modal --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Bulk Import Assets from XLSX</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-900">Import Completed Successfully!</h4>
                <p className="text-xs text-slate-500 font-mono">
                  All devices, hardware specifications, and attached accessories have been written into the inventory catalog.
                </p>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono max-w-md mx-auto">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Computers</span>
                    <span className="font-bold text-blue-600 text-base">{importSuccess.computersCreated}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Other Devices</span>
                    <span className="font-bold text-emerald-600 text-base">{importSuccess.otherAssetsCreated}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Accessories</span>
                    <span className="font-bold text-purple-600 text-base">{importSuccess.accessoriesCreated}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportSuccess(null);
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close & View Updated Inventory
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Picker Section */}
                <div className="p-6 border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-3xl bg-slate-50/50 text-center transition-colors">
                  <FileUp className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-slate-800">Select an XLSX Spreadsheet File</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Must use the standard 4-sheet template (Petunjuk, Laptop-PC, Other Assets, Accessories).
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-3">
                    <input
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileChange}
                      id="xlsxFileInput"
                      className="hidden"
                    />
                    <label
                      htmlFor="xlsxFileInput"
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-colors"
                    >
                      {importFile ? 'Change File' : 'Browse File...'}
                    </label>

                    {importFile && (
                      <button
                        onClick={handlePreviewUpload}
                        disabled={importLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span>Validate & Preview</span>
                      </button>
                    )}
                  </div>

                  {importFile && (
                    <div className="mt-3 text-xs font-mono text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block border border-emerald-200">
                      Selected: <strong>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {importError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Validation Preview Results */}
                {importPreview && (
                  <div className="space-y-3 pt-2">
                    {/* Status Alert Banner */}
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-mono ${
                        importPreview.valid && importPreview.summary.errorCount === 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {importPreview.valid && importPreview.summary.errorCount === 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold">
                            {importPreview.valid && importPreview.summary.errorCount === 0
                              ? 'Workbook Validation Passed'
                              : `Validation Found ${importPreview.summary.errorCount} Error(s)`}
                          </p>
                          <p className="text-[11px] opacity-80 font-sans">
                            {importPreview.valid && importPreview.summary.errorCount === 0
                              ? importPreview.summary.warningCount > 0
                                ? 'Workbook has minor warnings but is safe to commit.'
                                : 'All rows and references are valid and ready to import.'
                              : 'Please resolve errors in your spreadsheet before committing to inventory.'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-bold text-xs shrink-0">
                        {importPreview.summary.validRows} / {importPreview.summary.totalRows} Rows Valid
                      </div>
                    </div>

                    {/* Summary Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Computers</span>
                        <span className="font-bold text-slate-800">{importPreview.summary.laptopPcCount}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Other Devices</span>
                        <span className="font-bold text-slate-800">{importPreview.summary.otherAssetCount}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Accessories</span>
                        <span className="font-bold text-slate-800">{importPreview.summary.accessoryCount}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Issues</span>
                        <span className="font-bold text-slate-800">
                          {importPreview.summary.errorCount} err / {importPreview.summary.warningCount} warn
                        </span>
                      </div>
                    </div>

                    {/* Holder Resolution Decisions */}
                    {getCustodianResolutionRows(importPreview).length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-700 uppercase block">
                          Holder Resolution Decisions
                        </span>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                          {getCustodianResolutionRows(importPreview).map((row) => (
                            <div key={`${row.source}-${row.rowNumber}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5">
                              <span className="text-[10px] font-mono text-slate-400">{row.source} #{row.rowNumber}</span>
                              <span className="min-w-0">
                                <span className="block truncate font-bold text-slate-800">{row.assetName}</span>
                                <span className="block truncate text-[10px] text-slate-500">{row.holderName || 'No holder'}</span>
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold ${
                                row.action === 'ERROR'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : row.action === 'UNASSIGNED'
                                    ? 'border-slate-200 bg-slate-50 text-slate-600'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}>
                                {row.action.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error / Warning Table */}

                    {importPreview.messages.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-700 uppercase block">
                          Validation Messages ({importPreview.messages.length})
                        </span>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs font-mono">
                          {importPreview.messages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 flex items-start gap-2.5 ${
                                msg.type === 'error' ? 'bg-rose-50/50' : 'bg-amber-50/50'
                              }`}
                            >
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  msg.type === 'error' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                                }`}
                              >
                                {msg.type}
                              </span>
                              <div className="flex-1">
                                <span className="font-bold text-slate-900">
                                  [{msg.sheet}] Row {msg.rowNumber}
                                  {msg.field ? ` • ${msg.field}` : ''}:
                                </span>{' '}
                                <span className="text-slate-700 font-sans text-[11px]">{msg.message}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Commit Action */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCommitImport}
                        disabled={!canCommitAssetImport(importPreview, isCommitting)}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Commit Import to Database</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Asset Permanently</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this asset? This operation cannot be undone.
              </p>
            </div>

            {/* Asset Info Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Asset Code:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {deletingAsset.assetCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Asset Name:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">{deletingAsset.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="text-slate-700">{deletingAsset.categoryName}</span>
              </div>
              {deletingAsset.currentCustodian && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Current Custodian:</span>
                  <span className="text-slate-800 font-medium">{deletingAsset.currentCustodian.displayName}</span>
                </div>
              )}
            </div>

            {/* Error banner inside modal */}
            {deleteModalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <span className="font-bold block">Operation Failed:</span>
                  <span className="text-rose-600">{deleteModalError}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingAsset(null);
                  setDeleteModalError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Feedback / Notification Modal */}
      {feedbackModal && feedbackModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                feedbackModal.type === 'success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : feedbackModal.type === 'error'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {feedbackModal.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : feedbackModal.type === 'error' ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{feedbackModal.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{feedbackModal.message}</p>
            </div>

            <button
              type="button"
              onClick={() => setFeedbackModal(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
