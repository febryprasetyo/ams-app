'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, Loader2, Plus, Search, UserRound, X } from 'lucide-react';
import { api } from '@/lib/api';
import {
  custodianDisplayDetail,
  prepareManualCustodian,
  type CustodianPickerValue,
  type CustodianSearchResponse,
  type CustodianSummary,
  type EmployeeCandidate,
} from '@/lib/assetCustodian';

interface LocationOption {
  id: number;
  code?: string;
  name: string;
}

interface CustodianPickerProps {
  value: CustodianPickerValue;
  onChange: (value: CustodianPickerValue) => void;
  locations?: LocationOption[];
  allowManual?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  accent?: 'red' | 'blue';
}

import { VerificationBadge } from '@/components/custodians/VerificationBadge';
export { VerificationBadge };

export default function CustodianPicker({
  value,
  onChange,
  locations = [],
  allowManual = false,
  allowClear = true,
  disabled = false,
  label = 'Asset holder',
  required = false,
  accent = 'red',
}: CustodianPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CustodianSearchResponse>({ custodians: [], employees: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualLocationId, setManualLocationId] = useState<number | ''>('');
  const [manualUnit, setManualUnit] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!open && !manualOpen) return;
    const sequence = ++requestSequence.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ search: search.trim(), status: 'ACTIVE' });
        const response = await api.get<CustodianSearchResponse>(`/asset-custodians?${params.toString()}`);
        if (sequence === requestSequence.current) {
          setResults({
            custodians: Array.isArray(response?.custodians) ? response.custodians : [],
            employees: Array.isArray(response?.employees) ? response.employees : [],
          });
        }
      } catch (err: any) {
        if (sequence === requestSequence.current) setError(err.message || 'Failed to search holders');
      } finally {
        if (sequence === requestSequence.current) setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, manualOpen, search]);

  const combinedList = useMemo(() => {
    const linkedEmployeeIds = new Set(
      results.custodians.map((c) => c.employeeId).filter((id): id is number => id != null)
    );

    const list: Array<
      | { key: string; kind: 'custodian'; name: string; detail: string; status: CustodianSummary['verificationStatus']; data: CustodianSummary }
      | { key: string; kind: 'employee'; name: string; detail: string; status: 'VERIFIED'; data: EmployeeCandidate }
    > = [];

    for (const c of results.custodians) {
      list.push({
        key: `custodian-${c.id}`,
        kind: 'custodian',
        name: c.displayName,
        detail: custodianDisplayDetail(c),
        status: c.verificationStatus,
        data: c,
      });
    }

    for (const e of results.employees) {
      if (!linkedEmployeeIds.has(e.id)) {
        list.push({
          key: `employee-${e.id}`,
          kind: 'employee',
          name: e.fullName,
          detail: [e.employeeCode, e.departmentName || e.locationName || 'HR directory'].filter(Boolean).join(' · '),
          status: 'VERIFIED',
          data: e,
        });
      }
    }

    return list;
  }, [results]);

  const hasCandidates = combinedList.length > 0;
  const selectedLabel = useMemo(() => {
    if (value.kind === 'custodian') return value.custodian.displayName;
    if (value.kind === 'manual') return value.newCustodian.displayName;
    return '';
  }, [value]);

  const chooseCustodian = (custodian: CustodianSummary) => {
    onChange({ kind: 'custodian', custodian });
    setOpen(false);
    setManualOpen(false);
    setSearch('');
    setError(null);
  };

  const chooseEmployee = async (employee: EmployeeCandidate) => {
    setLoading(true);
    setError(null);
    try {
      const custodian = await api.post<CustodianSummary>('/asset-custodians/resolve-employee', {
        employeeId: employee.id,
      });
      chooseCustodian(custodian);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve the employee holder');
      setLoading(false);
    }
  };

  const beginManual = () => {
    setManualName(search.trim());
    setManualLocationId('');
    setManualUnit('');
    setManualNotes('');
    setDuplicateAcknowledged(false);
    setManualOpen(true);
    setOpen(true);
  };

  const chooseManual = () => {
    try {
      const newCustodian = prepareManualCustodian(
        {
          displayName: manualName,
          locationId: manualLocationId === '' ? null : manualLocationId,
          unitText: manualUnit,
          notes: manualNotes,
          duplicateAcknowledged,
        },
        { hasDuplicateCandidates: hasCandidates },
      );
      onChange({ kind: 'manual', newCustodian });
      setOpen(false);
      setManualOpen(false);
      setSearch('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid holder details');
    }
  };

  const clear = () => {
    onChange({ kind: 'none' });
    setSearch('');
    setManualOpen(false);
    setOpen(false);
    setError(null);
  };

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-mono font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {value.kind !== 'none' ? (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-xs font-bold text-slate-900">{selectedLabel}</span>
              {value.kind === 'custodian' && <VerificationBadge status={value.custodian.verificationStatus} />}

            </div>
            <p className="truncate text-[10px] font-mono text-slate-500">
              {value.kind === 'custodian'
                ? custodianDisplayDetail(value.custodian)
                : value.newCustodian.unitText || 'New manual holder — saved with this asset'}
            </p>
          </div>
          {!disabled && allowClear && (
            <button type="button" onClick={clear} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label="Clear asset holder">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls="custodian-picker-results"
            value={search}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
              setManualOpen(false);
              setDuplicateAcknowledged(false);
            }}
            placeholder="Search holder name or employee code..."
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:outline-none ${
              accent === 'blue' ? 'focus:border-emerald-500' : 'focus:border-emerald-500'
            }`}
          />
        </div>
      )}

      {open && value.kind === 'none' && (
        <div id="custodian-picker-results" className="relative z-20 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {error && (
            <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-4 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching holders...
            </div>
          )}

          {!loading && !manualOpen && (
            <>
              {combinedList.length > 0 ? (
                <div className="space-y-0.5">
                  {combinedList.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => (item.kind === 'custodian' ? chooseCustodian(item.data) : chooseEmployee(item.data))}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-slate-900">{item.name}</span>
                        <span className="block truncate text-[10px] font-mono text-slate-500">{item.detail}</span>
                      </span>
                      <VerificationBadge status={item.status} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-2 text-[10px] text-slate-400">No active holders found</p>
              )}

              {allowManual && (
                <button
                  type="button"
                  onClick={beginManual}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50/50 px-3 py-2.5 text-left text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  <Plus className="h-4 w-4" /> Add new holder{search.trim() ? ` “${search.trim()}”` : ''}
                </button>
              )}
              {!allowManual && combinedList.length === 0 && (
                <p className="px-3 py-2 text-[10px] text-slate-500">Ask an IT administrator to create a manual holder.</p>
              )}
            </>
          )}

          {manualOpen && (
            <div className="space-y-3 p-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900"><UserRound className="h-4 w-4 text-emerald-600" /> New manual holder</div>
              <input value={manualName} onChange={(event) => { setManualName(event.target.value); setSearch(event.target.value); setDuplicateAcknowledged(false); }} placeholder="Display name *" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none" />
              <select value={manualLocationId} onChange={(event) => setManualLocationId(event.target.value ? Number(event.target.value) : '')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none">
                <option value="">Unknown / no location</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.code ? ` (${location.code})` : ''}</option>)}
              </select>
              <input value={manualUnit} onChange={(event) => setManualUnit(event.target.value)} placeholder="Unit / team (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none" />
              <textarea rows={2} value={manualNotes} onChange={(event) => setManualNotes(event.target.value)} placeholder="IT-only notes (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none" />
              {hasCandidates && (
                <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[10px] text-amber-800">
                  <input type="checkbox" checked={duplicateAcknowledged} onChange={(event) => setDuplicateAcknowledged(event.target.checked)} className="mt-0.5" />
                  <span>I reviewed the matches above and confirm this is a separate holder.</span>
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setManualOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Back</button>
                <button type="button" onClick={chooseManual} disabled={loading || !manualName.trim() || (hasCandidates && !duplicateAcknowledged)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">Use new holder</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


