'use client';

import React from 'react';
import { RoleItem } from '@/lib/access/types';
import { Shield, Plus, Lock, Edit2, Trash2 } from 'lucide-react';

interface RoleListPanelProps {
  roles: RoleItem[];
  selectedRoleId: number | null;
  onSelectRole: (role: RoleItem) => void;
  onAddRole: () => void;
  onEditRole: (role: RoleItem) => void;
  onDeleteRole: (role: RoleItem) => void;
}

export default function RoleListPanel({
  roles,
  selectedRoleId,
  onSelectRole,
  onAddRole,
  onEditRole,
  onDeleteRole,
}: RoleListPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Configured Roles</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Select a role to configure permissions</p>
        </div>
        <button
          type="button"
          onClick={onAddRole}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Role</span>
        </button>
      </div>

      {/* Roles List */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[650px] p-2 space-y-1">
        {roles.map((role) => {
          const isSelected = selectedRoleId === role.id;
          const isSuperAdmin = (role.code || '').toLowerCase() === 'super_admin';

          return (
            <div
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={`p-3.5 rounded-xl transition-all cursor-pointer relative group flex items-start justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-50/80 border border-emerald-200 shadow-xs'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              {isSelected && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-600" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {role.name}
                  </span>
                  {role.isSystem ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      System
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Custom
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">{role.code}</p>

                {role.description && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{role.description}</p>
                )}

                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
                  {isSuperAdmin ? (
                    <span className="text-emerald-600 font-semibold">Full Access (Wildcard *)</span>
                  ) : (
                    <span className="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {role.permissionCount ?? role.permissionIds?.length ?? 0} permissions granted
                    </span>
                  )}
                </div>
              </div>

              {/* Actions for custom roles or edit details */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRole(role);
                  }}
                  title="Edit role details"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {!role.isSystem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRole(role);
                    }}
                    title="Delete custom role"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
