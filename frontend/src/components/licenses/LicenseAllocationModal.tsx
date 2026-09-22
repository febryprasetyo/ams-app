'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { UserPlus, UserIcon, Laptop, Loader2, AlertCircle } from 'lucide-react';
import { SoftwareLicense, Employee, Asset } from '@/lib/licenses/types';

export interface LicenseAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  license: SoftwareLicense | null;
  employees: Employee[];
  assets: Asset[];
}

export default function LicenseAllocationModal({
  isOpen,
  onClose,
  onSuccess,
  license,
  employees,
  assets,
}: LicenseAllocationModalProps) {
  const [targetType, setTargetType] = useState<'employee' | 'asset'>('employee');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [assetId, setAssetId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetType('employee');
      setEmployeeId('');
      setAssetId('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    if (targetType === 'employee' && !employeeId) {
      setError('Please select an employee to allocate a seat.');
      return;
    }
    if (targetType === 'asset' && !assetId) {
      setError('Please select a laptop / asset to allocate a seat.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        employeeId: targetType === 'employee' ? Number(employeeId) : null,
        assetId: targetType === 'asset' ? Number(assetId) : null,
        notes: notes.trim() || null,
      };

      await api.post(`/licenses/${license.id}/allocate`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate license seat');
    } finally {
      setSubmitting(false);
    }
  };

  if (!license) return null;

  const availableSeats = Math.max(0, (license.totalSeats || 0) - (license.usedSeats || 0));

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      isLoading={submitting}
      title="Allocate License Seat"
      subtitle={`Assign a seat from "${license.name}" to an employee or hardware asset`}
      icon={<UserPlus className="w-5 h-5 text-blue-600" />}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Software:</span>
            <div className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">
              {license.name}
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium">Available Seats:</span>
            <div
              className={`font-bold text-sm ${
                availableSeats > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {availableSeats} / {license.totalSeats}
            </div>
          </div>
        </div>

        {/* Target Type Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Assign To Target
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetType('employee');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                targetType === 'employee'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Employee / User</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('asset');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                targetType === 'asset'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Hardware Asset</span>
            </button>
          </div>
        </div>

        {/* Target Selector */}
        {targetType === 'employee' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode}) {emp.position ? `- ${emp.position}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Hardware Asset <span className="text-rose-500">*</span>
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">-- Choose Asset --</option>
              {assets.map((ast) => (
                <option key={ast.id} value={ast.id}>
                  {ast.name} ({ast.assetCode}) {ast.serialNumber ? `- S/N: ${ast.serialNumber}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Allocation Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Workstation PC Graphic design team..."
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Allocate Seat</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
