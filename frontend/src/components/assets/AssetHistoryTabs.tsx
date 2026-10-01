'use client';

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Wrench,
  History,
  Plus,
  UserCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  AssignmentHistoryRecord,
  MaintenanceRecord,
} from '@/lib/assets/types';

export interface AuditLogItem {
  id?: number;
  action: string;
  entity: string;
  entityId: number;
  username?: string | null;
  userId?: number | null;
  createdAt: string;
}

export interface AssetHistoryData {
  assignmentHistory?: AssignmentHistoryRecord[];
  maintenanceHistory?: MaintenanceRecord[];
  auditLogs?: AuditLogItem[];
}

export interface AssetHistoryTabsProps {
  history: AssetHistoryData | null;
  onOpenMaintenanceModal: () => void;
}

export default function AssetHistoryTabs({
  history,
  onOpenMaintenanceModal,
}: AssetHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<'transfers' | 'maintenance' | 'audit'>('transfers');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'transfers'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>
            Assignment & Handover History ({history?.assignmentHistory?.length || 0})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'maintenance'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>
            Maintenance & Servicing ({history?.maintenanceHistory?.length || 0})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>System Audit Logs ({history?.auditLogs?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Assignment History */}
      {activeTab === 'transfers' && (
        <div className="glass-panel rounded-3xl p-6 bg-white border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Custody & Transfer Timeline</h3>
          {history?.assignmentHistory && history.assignmentHistory.length > 0 ? (
            <div className="space-y-4">
              {history.assignmentHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-sm">
                        {item.employeeName || 'Unknown Staff'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({item.employeeCode || 'N/A'})
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      {item.departmentName || 'General Staff'} • Handed over by{' '}
                      {item.assignedByUsername || 'IT Admin'}
                    </p>
                    {item.handoverNotes && (
                      <p className="text-slate-700 bg-white p-2 rounded-xl border border-slate-200 text-[11px] font-sans mt-1">
                        Note: {item.handoverNotes}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right space-y-1 shrink-0">
                    <div className="flex items-center md:justify-end gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Assigned: {new Date(item.assignedAt).toLocaleDateString()}</span>
                    </div>
                    {item.returnedAt ? (
                      <div className="flex items-center md:justify-end gap-1.5 text-amber-600 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Returned: {new Date(item.returnedAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-200">
                        Current Active Custodian
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-mono">
              No historical assignment records found for this asset.
            </p>
          )}
        </div>
      )}

      {/* Tab 2: Maintenance History */}
      {activeTab === 'maintenance' && (
        <div className="glass-panel rounded-3xl p-6 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Repair & Servicing Log</h3>
            <button
              onClick={onOpenMaintenanceModal}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Service</span>
            </button>
          </div>

          {history?.maintenanceHistory && history.maintenanceHistory.length > 0 ? (
            <div className="space-y-4">
              {history.maintenanceHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        {item.maintenanceType}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-slate-600 text-[11px] font-sans">{item.description}</p>
                    )}
                    <p className="text-slate-400 text-[10px]">
                      Logged by: {item.performedByUsername || 'IT Staff'}
                    </p>
                  </div>

                  <div className="text-left md:text-right space-y-1 shrink-0">
                    <span className="font-bold text-slate-900 block text-sm">
                      IDR {Number(item.cost || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-mono">
              No maintenance records logged for this asset.
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-3xl p-6 bg-white border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">System Activity Audit Trail</h3>
          {history?.auditLogs && history.auditLogs.length > 0 ? (
            <div className="space-y-3">
              {history.auditLogs.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600 uppercase tracking-wider text-[11px]">
                        {item.action}
                      </span>
                      <span className="text-slate-700">
                        {item.entity} #{item.entityId}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      By user: {item.username || `ID ${item.userId || 'system'}`}
                    </p>
                  </div>
                  <span className="text-slate-400 text-[10px]">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-mono">No system audit records available.</p>
          )}
        </div>
      )}
    </div>
  );
}
