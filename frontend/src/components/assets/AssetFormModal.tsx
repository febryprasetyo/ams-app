'use client';

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  X,
  AlertCircle,
  Cpu,
  Headphones,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import CustodianPicker from '@/components/assets/CustodianPicker';
import {
  canSubmitAssetForm,
  buildComputerSpecsPayload,
  isComputerCategoryName,
  AssetAccessoryFormItem,
} from '@/lib/assetForm';
import {
  CustodianPickerValue,
  CustodianSummary,
  buildCustodianSelectionPayload,
} from '@/lib/assetCustodian';

export interface CategoryOption {
  id: number;
  name: string;
  codePrefix: string;
  description?: string | null;
}

export interface LocationOption {
  id: number;
  code: string;
  name: string;
}

export interface AssetFormItem {
  id: number;
  name: string;
  assetCode?: string;
  categoryId: number;
  categoryName?: string;
  categoryCodePrefix?: string;
  serialNumber?: string | null;
  locationId?: number | null;
  currentCustodian?: CustodianSummary | null;
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  notes?: string | null;
  computerSpecs?: {
    cpuName?: string | null;
    ramSizeGb?: number | null;
    ramSlotCount?: number | null;
    disk1SizeGb?: number | null;
    disk2SizeGb?: number | null;
  } | null;
  accessories?: Array<{
    id?: number;
    accessoryType: string;
    description?: string | null;
    quantity: number;
    condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
    notes?: string | null;
  }>;
}

export interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: AssetFormItem | null;
  categories?: CategoryOption[];
  locations?: LocationOption[];
  canManage?: boolean;
  onSuccess: (savedAsset?: any) => void;
}

function AssetFormDialogContent({
  onClose,
  asset,
  categories: propCategories,
  locations: propLocations,
  canManage = true,
  onSuccess,
}: Omit<AssetFormModalProps, 'isOpen'>) {
  const [internalCategories, setInternalCategories] = useState<CategoryOption[]>([]);
  const [internalLocations, setInternalLocations] = useState<LocationOption[]>([]);

  const categories = propCategories && propCategories.length > 0 ? propCategories : internalCategories;
  const locations = propLocations && propLocations.length > 0 ? propLocations : internalLocations;

  // Form State initialized from props
  const [name, setName] = useState(asset?.name || '');
  const [categoryId, setCategoryId] = useState<number | ''>(asset?.categoryId || '');
  const [assetCode, setAssetCode] = useState(asset?.assetCode || '');
  const [serialNumber, setSerialNumber] = useState(asset?.serialNumber || '');
  const [locationId, setLocationId] = useState<number | ''>(asset?.locationId ?? '');
  const [custodian, setCustodian] = useState<CustodianPickerValue>(
    asset?.currentCustodian
      ? { kind: 'custodian', custodian: asset.currentCustodian }
      : { kind: 'none' }
  );
  const [condition, setCondition] = useState<'Good' | 'Fair' | 'Poor' | 'Damaged'>(asset?.condition || 'Good');
  const [notes, setNotes] = useState(asset?.notes || '');

  // Computer Hardware Specs State
  const [cpuName, setCpuName] = useState(asset?.computerSpecs?.cpuName || '');
  const [ramSizeGb, setRamSizeGb] = useState<number | ''>(asset?.computerSpecs?.ramSizeGb ?? '');
  const [ramSlotCount, setRamSlotCount] = useState<number | ''>(asset?.computerSpecs?.ramSlotCount ?? '');
  const [disk1SizeGb, setDisk1SizeGb] = useState<number | ''>(asset?.computerSpecs?.disk1SizeGb ?? '');
  const [disk2SizeGb, setDisk2SizeGb] = useState<number | ''>(asset?.computerSpecs?.disk2SizeGb ?? '');
  const [accessories, setAccessories] = useState<AssetAccessoryFormItem[]>(() => {
    if (asset?.accessories && asset.accessories.length > 0) {
      return asset.accessories.map((a) => ({
        id: a.id,
        accessoryType: a.accessoryType,
        description: a.description || '',
        quantity: a.quantity,
        condition: a.condition,
        notes: a.notes || '',
      }));
    }
    return [];
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories/locations if not provided by parent
  useEffect(() => {
    let isMounted = true;
    if (!propCategories || propCategories.length === 0) {
      api.get<CategoryOption[]>('/assets/categories')
        .then((res) => {
          if (isMounted) setInternalCategories(Array.isArray(res) ? res : []);
        })
        .catch((err) => console.error('Failed to load categories in AssetFormModal', err));
    }
    if (!propLocations || propLocations.length === 0) {
      api.get<LocationOption[]>('/master/locations')
        .then((res) => {
          if (isMounted) setInternalLocations(Array.isArray(res) ? res : []);
        })
        .catch((err) => console.error('Failed to load locations in AssetFormModal', err));
    }
    return () => {
      isMounted = false;
    };
  }, [propCategories, propLocations]);

  // Determine if selected category is Laptop or PC
  const selectedCatObj = categories.find((c) => c.id === categoryId);
  const isComputerType =
    isComputerCategoryName(selectedCatObj?.name) ||
    selectedCatObj?.codePrefix === 'PC' ||
    selectedCatObj?.codePrefix === 'LPT';

  // Accessory list mutation helpers
  const handleAddAccessory = () => {
    setAccessories((prev) => [
      ...prev,
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
    setAccessories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateAccessory = (index: number, patch: Partial<AssetAccessoryFormItem>) => {
    setAccessories((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isFormValid = canSubmitAssetForm({
      assetName: name,
      equipmentTypeId: categoryId,
      isEditing: !!asset,
      equipmentTypesAvailable: categories.length > 0,
      isComputerType,
      cpuName,
      ramSizeGb,
      ramSlotCount,
      disk1SizeGb,
      disk2SizeGb,
      accessories,
    });

    if (!isFormValid) {
      setError('Please complete the required asset fields and use positive values for any supplied hardware numbers.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: any = {
      name: name.trim(),
      categoryId: Number(categoryId),
      assetCode: assetCode.trim() || undefined,
      serialNumber: serialNumber.trim() || null,
      locationId: locationId ? Number(locationId) : null,
      ...buildCustodianSelectionPayload(custodian, { explicitClear: !!asset }),
      condition,
      notes: notes.trim() || null,
    };

    if (isComputerType) {
      payload.computerSpecs =
        buildComputerSpecsPayload({
          cpuName,
          ramSizeGb,
          ramSlotCount,
          disk1SizeGb,
          disk2SizeGb,
        }) ?? null;
      payload.accessories = accessories.map((acc) => ({
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
      let result;
      if (asset) {
        result = await api.put(`/assets/${asset.id}`, payload);
      } else {
        result = await api.post('/assets', payload);
      }
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="glass-panel w-full max-w-2xl rounded-3xl shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <span>{asset ? 'Edit Asset Record' : 'Register New Hardware Inventory'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Equipment Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-emerald-500"
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
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  placeholder="Leave blank for automatic allocation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Asset Name / Brand & Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ThinkPad T14 Gen 2 / HP LaserJet Pro M404"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. PF2X9871"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Initial Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-emerald-500"
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
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500"
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
                  value={custodian}
                  onChange={setCustodian}
                  locations={locations}
                  allowManual={canManage}
                />
              </div>
            </div>

            {/* Dynamic Computer Hardware Specs Form */}
            {isComputerType && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
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
                      value={cpuName}
                      onChange={(e) => setCpuName(e.target.value)}
                      placeholder="e.g. Intel Core i7-1165G7 @ 2.80GHz"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                      RAM Size (GB) (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ramSizeGb}
                      onChange={(e) => setRamSizeGb(e.target.value ? Number(e.target.value) : '')}
                      placeholder="16"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                      RAM Slots (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ramSlotCount}
                      onChange={(e) => setRamSlotCount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="2"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                      Disk 1 Size (GB) (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={disk1SizeGb}
                      onChange={(e) => setDisk1SizeGb(e.target.value ? Number(e.target.value) : '')}
                      placeholder="512"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                      Disk 2 Size (GB) (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={disk2SizeGb}
                      onChange={(e) => setDisk2SizeGb(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Leave blank if not installed"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Attached Accessories Sub-form */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">
                        Attached Computer Accessories ({accessories.length})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAccessory}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Accessory</span>
                    </button>
                  </div>

                  {accessories.length === 0 ? (
                    <p className="text-xs text-slate-400 font-mono italic">No accessories attached.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {accessories.map((acc, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Accessory #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAccessory(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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
                                onChange={(e) =>
                                  handleUpdateAccessory(idx, {
                                    quantity: e.target.value ? Number(e.target.value) : '',
                                  })
                                }
                                className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                                required
                              />
                              <select
                                value={acc.condition}
                                onChange={(e) =>
                                  handleUpdateAccessory(idx, { condition: e.target.value as any })
                                }
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional hardware details, complaints, vendor warranty..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/90 backdrop-blur-sm shrink-0 rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{asset ? 'Update Asset' : 'Register Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AssetFormModal(props: AssetFormModalProps) {
  if (!props.isOpen) return null;
  return <AssetFormDialogContent key={props.asset?.id ?? 'new'} {...props} />;
}
