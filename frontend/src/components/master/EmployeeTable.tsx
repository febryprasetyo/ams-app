'use client';

import React from 'react';
import { Mail, Pencil, Trash2, Users, Loader2 } from 'lucide-react';

export interface DepartmentOption {
  id: number;
  code: string;
  name: string;
}

export interface LocationOption {
  id: number;
  code: string;
  name: string;
}

export interface EmployeeItem {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  departmentId?: number | null;
  locationId?: number | null;
  position?: string | null;
  status: string;
  departmentName?: string | null;
  departmentCode?: string | null;
  locationName?: string | null;
}

interface EmployeeTableProps {
  employees: EmployeeItem[];
  loading: boolean;
  onEdit: (emp: EmployeeItem) => void;
  onDelete: (emp: EmployeeItem) => void;
}

export default function EmployeeTable({
  employees,
  loading,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        <span>Fetching employee directory...</span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold text-sm">No employees found</p>
        <p className="text-xs text-slate-500 mt-1">
          Try adjusting your search criteria or register a new staff member.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
            <th className="py-3.5 px-5 font-semibold">NIK Code</th>
            <th className="py-3.5 px-5 font-semibold">Full Name & Position</th>
            <th className="py-3.5 px-5 font-semibold">Corporate Email</th>
            <th className="py-3.5 px-5 font-semibold">Dept & Location</th>
            <th className="py-3.5 px-5 font-semibold">Status</th>
            <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((emp) => {
            const isActive = (emp.status || '').toLowerCase() === 'active';
            return (
              <tr key={emp.id} className="hover:bg-red-50/30 transition-colors group">
                <td className="py-4 px-5 font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold">
                    {emp.employeeCode}
                  </span>
                </td>
                <td className="py-4 px-5">
                  <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                    {emp.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{emp.position || 'Staff'}</p>
                </td>
                <td className="py-4 px-5 font-mono text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.email}</span>
                  </div>
                </td>
                <td className="py-4 px-5 text-slate-700">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">{emp.departmentName || '—'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {emp.locationName || 'Unassigned'}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-red-600' : 'bg-slate-400'
                      }`}
                    />
                    {emp.status}
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(emp)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                      title="Edit Employee"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(emp)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
