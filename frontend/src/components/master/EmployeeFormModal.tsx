'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import type { DepartmentOption, LocationOption, EmployeeItem } from './EmployeeTable';
import { Loader2, Plus, Pencil, AlertCircle } from 'lucide-react';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeItem | null;
  departments: DepartmentOption[];
  locations: LocationOption[];
  onSuccess: () => void;
}

export default function EmployeeFormModal({
  isOpen,
  onClose,
  employee,
  departments,
  locations,
  onSuccess,
}: EmployeeFormModalProps) {
  const isEdit = !!employee;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState<string>('');
  const [locId, setLocId] = useState<string>('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (employee) {
        setCode(employee.employeeCode);
        setName(employee.fullName);
        setEmail(employee.email);
        setPhone(employee.phone || '');
        setDeptId(employee.departmentId ? String(employee.departmentId) : '');
        setLocId(employee.locationId ? String(employee.locationId) : '');
        setPosition(employee.position || '');
        setStatus(employee.status || 'Active');
      } else {
        setCode('');
        setName('');
        setEmail('');
        setPhone('');
        setDeptId('');
        setLocId('');
        setPosition('');
        setStatus('Active');
      }
    }
  }, [isOpen, employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      employeeCode: code.trim(),
      fullName: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      departmentId: deptId ? Number(deptId) : null,
      locationId: locId ? Number(locId) : null,
      position: position.trim() || null,
      status,
    };

    try {
      if (isEdit && employee) {
        await api.put(`/employees/${employee.id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update employee' : 'Failed to register employee'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Employee Details' : 'Register New Employee'}
      icon={
        isEdit ? (
          <Pencil className="w-5 h-5 text-red-600" />
        ) : (
          <Plus className="w-5 h-5 text-red-600" />
        )
      }
      maxWidthClass="max-w-xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              NIK / Employee Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. EMP-001"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Corporate Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@company.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +62 812-3456-7890"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
            Job Position / Role
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Department
            </label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            >
              <option value="">No Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Office Location
            </label>
            <select
              value={locId}
              onChange={(e) => setLocId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            >
              <option value="">Unassigned Location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl transition flex items-center gap-2 shadow-sm font-bold cursor-pointer"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEdit ? 'Update Details' : 'Register Member'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
