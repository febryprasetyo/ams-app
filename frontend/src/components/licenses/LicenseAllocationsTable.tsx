'use client';

import React from 'react';
import {
  UserCheck,
  Plus,
  User as UserIcon,
  Laptop,
  UserMinus,
} from 'lucide-react';
import { LicenseAllocation } from '@/lib/licenses/types';

export interface LicenseAllocationsTableProps {
  allocations: LicenseAllocation[];
  isFull: boolean;
  onAllocate: () => void;
  onRevoke: (allocation: LicenseAllocation) => void;
}

export default function LicenseAllocationsTable({
  allocations,
  isFull,
  onAllocate,
  onRevoke,
}: LicenseAllocationsTableProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden space-y-4">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-red-600" />
            <span>Active Seat Allocations</span>
            <span className="ml-2 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
              {allocations.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            List of employees and IT laptop assets currently holding a valid seat license key or CD/dongle.
          </p>
        </div>

        <button
          onClick={onAllocate}
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
            {allocations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <UserCheck className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No active seat allocations</p>
                    <p className="text-xs text-slate-500">
                      Click &quot;Allocate Seat&quot; to assign this software license to an employee or IT asset laptop.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              allocations.map((alloc) => {
                const isEmployeeTarget = !!alloc.employeeId;

                return (
                  <tr key={alloc.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Target Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold font-mono text-xs ${
                            isEmployeeTarget
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isEmployeeTarget ? (
                            <UserIcon className="w-4.5 h-4.5" />
                          ) : (
                            <Laptop className="w-4.5 h-4.5" />
                          )}
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>Employee</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <Laptop className="w-3.5 h-3.5" />
                          <span>IT Asset</span>
                        </span>
                      )}
                    </td>

                    {/* Details / Identifiers */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {isEmployeeTarget ? (
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <p className="font-medium text-slate-800">
                            {alloc.employeePosition || 'Employee'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {alloc.employeeEmail || 'No email'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <p className="font-mono text-slate-800">
                            SN: {alloc.assetSerialNumber || 'N/A'}
                          </p>
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
                      <p
                        className="text-xs text-slate-600 truncate max-w-xs"
                        title={alloc.notes || ''}
                      >
                        {alloc.notes || '—'}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => onRevoke(alloc)}
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
  );
}
