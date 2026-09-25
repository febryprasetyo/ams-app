'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RoleItem, ModuleGroup } from '@/lib/access/types';
import {
  ShieldCheck,
  CheckSquare,
  Square,
  RotateCcw,
  Save,
  Loader2,
  HardDrive,
  Ticket,
  Key,
  Server,
  Cpu,
  CalendarCheck,
  Building2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface PermissionMatrixPanelProps {
  role: RoleItem | null;
  moduleGroups: ModuleGroup[];
  onSavePermissions: (roleId: number, permissionIds: number[]) => Promise<void>;
  isLoading?: boolean;
}

const moduleIconMap: Record<string, React.ElementType> = {
  assets: HardDrive,
  tickets: Ticket,
  licenses: Key,
  infrastructure: Server,
  hardware_audits: Cpu,
  attendance: CalendarCheck,
  master: Building2,
  access: ShieldCheck,
};

const moduleTitleMap: Record<string, string> = {
  assets: 'IT Assets & Inventory',
  tickets: 'IT Helpdesk & Tickets',
  licenses: 'Software Licenses',
  infrastructure: 'Accurate & Infrastructure',
  hardware_audits: 'Hardware Audits',
  attendance: 'HR Attendance & Time',
  master: 'Master Data Organization',
  access: 'Access Control & Security',
};

export default function PermissionMatrixPanel({
  role,
  moduleGroups,
  onSavePermissions,
  isLoading = false,
}: PermissionMatrixPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isSuperAdmin = (role?.code || '').toLowerCase() === 'super_admin';

  // Sync with role's current permissions when role changes
  useEffect(() => {
    if (role) {
      setSelectedIds(new Set(role.permissionIds || []));
      setSaveSuccess(false);
    }
  }, [role]);

  // Total permissions count
  const allPermissionIds = useMemo(() => {
    const ids: number[] = [];
    moduleGroups.forEach((g) => {
      g.permissions.forEach((p) => ids.push(p.id));
    });
    return ids;
  }, [moduleGroups]);

  // Dirty state check
  const isDirty = useMemo(() => {
    if (!role) return false;
    const initialSet = new Set(role.permissionIds || []);
    if (selectedIds.size !== initialSet.size) return true;
    for (const id of selectedIds) {
      if (!initialSet.has(id)) return true;
    }
    return false;
  }, [role, selectedIds]);

  const handleToggle = (permId: number) => {
    if (isSuperAdmin) return;
    const next = new Set(selectedIds);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedIds(next);
    setSaveSuccess(false);
  };

  const handleToggleModule = (modulePermIds: number[]) => {
    if (isSuperAdmin) return;
    const allModuleActive = modulePermIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allModuleActive) {
      modulePermIds.forEach((id) => next.delete(id));
    } else {
      modulePermIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
    setSaveSuccess(false);
  };

  const handleSelectAll = () => {
    if (isSuperAdmin) return;
    setSelectedIds(new Set(allPermissionIds));
    setSaveSuccess(false);
  };

  const handleDeselectAll = () => {
    if (isSuperAdmin) return;
    setSelectedIds(new Set());
    setSaveSuccess(false);
  };

  const handleReset = () => {
    if (role) {
      setSelectedIds(new Set(role.permissionIds || []));
      setSaveSuccess(false);
    }
  };

  const handleSave = async () => {
    if (!role || isSuperAdmin) return;
    try {
      setIsSaving(true);
      await onSavePermissions(role.id, Array.from(selectedIds));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!role) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400">
        <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">No Role Selected</h4>
        <p className="text-xs text-slate-400 mt-1">Select a role from the left panel to configure its permissions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full relative">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{role.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                {role.code}
              </span>
              {role.isSystem && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  <Lock className="w-3 h-3" /> System Role
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {role.description || 'Custom role with configurable granular permissions.'}
            </p>
          </div>

          {/* Quick Select Buttons */}
          {!isSuperAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <span className="font-bold text-red-600">{selectedIds.size}</span> of {allPermissionIds.length} active
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* SuperAdmin Banner */}
        {isSuperAdmin && (
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-red-600 shrink-0" />
            <div className="text-xs text-red-900">
              <p className="font-bold">SuperAdmin Role possesses universal wildcard access.</p>
              <p className="text-red-700 mt-0.5">
                All existing and newly added permissions are automatically granted by system design and cannot be revoked.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Modular Grid */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 max-h-[700px]">
        {moduleGroups.map((group) => {
          const Icon = moduleIconMap[group.module] || ShieldCheck;
          const title = moduleTitleMap[group.module] || group.module;
          const groupPermIds = group.permissions.map((p) => p.id);
          const activeInGroup = groupPermIds.filter((id) => selectedIds.has(id)).length;
          const isAllGroupActive = isSuperAdmin || (groupPermIds.length > 0 && activeInGroup === groupPermIds.length);

          return (
            <div key={group.module} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Module Header */}
              <div className="p-3.5 px-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{title}</h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isSuperAdmin ? 'All granted' : `${activeInGroup} of ${group.permissions.length} active`}
                    </span>
                  </div>
                </div>

                {!isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleToggleModule(groupPermIds)}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    {isAllGroupActive ? 'Deselect Module' : 'Select Module'}
                  </button>
                )}
              </div>

              {/* Module Permissions List */}
              <div className="divide-y divide-slate-100">
                {group.permissions.map((perm) => {
                  const isChecked = isSuperAdmin || selectedIds.has(perm.id);

                  return (
                    <div
                      key={perm.id}
                      onClick={() => handleToggle(perm.id)}
                      className={`p-3 px-4 flex items-center justify-between gap-4 transition-colors ${
                        isSuperAdmin ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{perm.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {perm.code}
                          </span>
                        </div>
                        {perm.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                        )}
                      </div>

                      {/* Custom Switch Component */}
                      <div className="shrink-0">
                        <div
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            isChecked ? 'bg-red-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              isChecked ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Save Bar */}
      {!isSuperAdmin && (
        <div className="p-3.5 sm:p-4 px-6 border-t border-slate-200 bg-slate-50/90 backdrop-blur-sm flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs">
            {saveSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                ✓ Permissions successfully saved to database!
              </span>
            ) : isDirty ? (
              <span className="text-amber-700 font-medium">
                You have unsaved changes to this role's permissions.
              </span>
            ) : (
              <span className="text-slate-400">All permissions are synced.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Permissions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
