'use client';

import React, { useMemo, useState } from 'react';
import type { CustodianSummary, EmployeeCandidate } from '@/lib/assetCustodian';
import {
  filterEmployeeCandidates,
  getDefaultReconciliationMatchTab,
  getEmployeeConflictAdvisory,
} from '@/lib/assetCustodian';
import {
  AlertTriangle,
  GitMerge,
  Link2,
  Loader2,
  Search,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

export interface ReconciliationItem {
  custodian: CustodianSummary;
  matches: EmployeeCandidate[];
}

export interface ReconciliationCandidateCardProps {
  item: ReconciliationItem;
  activeCustodians: CustodianSummary[];
  allEmployees?: EmployeeCandidate[];
  isBusy: boolean;
  linkSelection: string;
  onLinkSelectionChange: (val: string) => void;
  mergeSelection: string;
  onMergeSelectionChange: (val: string) => void;
  onLinkEmployee: () => void;
  onMergeCustodian: () => void;
  onDismiss: () => void;
}

export default function ReconciliationCandidateCard({
  item,
  activeCustodians,
  allEmployees = [],
  isBusy,
  linkSelection,
  onLinkSelectionChange,
  mergeSelection,
  onMergeSelectionChange,
  onLinkEmployee,
  onMergeCustodian,
  onDismiss,
}: ReconciliationCandidateCardProps) {
  const [matchTab, setMatchTab] = useState<'suggested' | 'manual'>(() =>
    getDefaultReconciliationMatchTab(item.matches.length)
  );
  const [manualSearch, setManualSearch] = useState<string>('');

  const otherActiveCustodians = activeCustodians.filter(
    (c) => c.id !== item.custodian.id
  );

  const filteredEmployees = useMemo(() => {
    return filterEmployeeCandidates(allEmployees, manualSearch);
  }, [allEmployees, manualSearch]);

  const selectedEmployee = useMemo(() => {
    if (!linkSelection) return undefined;
    const id = Number(linkSelection);
    return (
      item.matches.find((m) => m.id === id) ||
      allEmployees.find((e) => e.id === id)
    );
  }, [linkSelection, item.matches, allEmployees]);

  const conflictAdvisory = useMemo(() => {
    return getEmployeeConflictAdvisory(selectedEmployee);
  }, [selectedEmployee]);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{item.custodian.displayName}</h3>
              <p className="text-[10px] font-mono text-slate-400">
                Holder #{item.custodian.id} · {item.custodian.origin}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            title="Dismiss for this session"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-600">
          {item.custodian.locationName || 'No location'}
          {item.custodian.unitText ? ` · ${item.custodian.unitText}` : ''}
        </p>

        {/* HR Candidate Selection Section */}
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          {/* Tab Switcher */}
          <div
            role="tablist"
            aria-label="Metode Pemilihan Karyawan"
            className="flex rounded-xl bg-slate-200/70 p-1 mb-3"
          >
            <button
              type="button"
              role="tab"
              id={`tab-suggested-${item.custodian.id}`}
              aria-controls={`panel-suggested-${item.custodian.id}`}
              aria-selected={matchTab === 'suggested'}
              onClick={() => setMatchTab('suggested')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                matchTab === 'suggested'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Suggested Matches ({item.matches.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              id={`tab-manual-${item.custodian.id}`}
              aria-controls={`panel-manual-${item.custodian.id}`}
              aria-selected={matchTab === 'manual'}
              onClick={() => setMatchTab('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                matchTab === 'manual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Search className="h-3 w-3" />
              <span>Cari Karyawan Manual</span>
            </button>
          </div>

          {/* Tab Panel: Suggested Matches */}
          {matchTab === 'suggested' && (
            <div
              role="tabpanel"
              id={`panel-suggested-${item.custodian.id}`}
              aria-labelledby={`tab-suggested-${item.custodian.id}`}
            >
              {item.matches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-center">
                  <p className="text-xs text-slate-500">No close employee name matches found.</p>
                  <button
                    type="button"
                    onClick={() => setMatchTab('manual')}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    <Search className="h-3 w-3" /> Cari karyawan manual di direktori HR
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {item.matches.map((match) => {
                    const isSelected = linkSelection === String(match.id);
                    const hasExistingHolder = match.custodianId != null;
                    return (
                      <label
                        key={match.id}
                        className={`flex items-start justify-between rounded-lg border p-2.5 text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name={`match-${item.custodian.id}`}
                            value={match.id}
                            checked={isSelected}
                            onChange={(e) => onLinkSelectionChange(e.target.value)}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{match.fullName}</span>
                              {hasExistingHolder && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 border border-amber-200">
                                  Holder #{match.custodianId}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {match.employeeCode} · {match.departmentName || 'No Dept'}
                              {match.locationName ? ` · ${match.locationName}` : ''}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Panel: Manual Employee Search */}
          {matchTab === 'manual' && (
            <div
              role="tabpanel"
              id={`panel-manual-${item.custodian.id}`}
              aria-labelledby={`tab-manual-${item.custodian.id}`}
              className="space-y-2 pt-1"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Cari nama, NIP, atau departemen..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {manualSearch && (
                  <button
                    type="button"
                    onClick={() => setManualSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Hapus kata kunci pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-slate-500">
                  Tidak ada data karyawan yang cocok dengan pencarian.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filteredEmployees.map((candidate) => {
                    const isSelected = linkSelection === String(candidate.id);
                    const hasExistingHolder = candidate.custodianId != null;
                    return (
                      <label
                        key={candidate.id}
                        className={`flex items-start justify-between rounded-lg border p-2 text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name={`manual-match-${item.custodian.id}`}
                            value={candidate.id}
                            checked={isSelected}
                            onChange={(e) => onLinkSelectionChange(e.target.value)}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{candidate.fullName}</span>
                              {hasExistingHolder && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 border border-amber-200">
                                  Holder #{candidate.custodianId}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {candidate.employeeCode} · {candidate.departmentName || 'No Dept'}
                              {candidate.locationName ? ` · ${candidate.locationName}` : ''}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Smart Conflict / Merge Advisory */}
          {selectedEmployee && conflictAdvisory.hasConflict && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-amber-900">Karyawan Sudah Memiliki Holder Aktif</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    <strong>{selectedEmployee.fullName}</strong> sudah terhubung ke <strong>Holder #{conflictAdvisory.activeCustodianId}</strong>. Disarankan untuk menggunakan proses Merge agar riwayat kepemilikan aset tergabung.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (conflictAdvisory.activeCustodianId != null) {
                        onMergeSelectionChange(String(conflictAdvisory.activeCustodianId));
                      }
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    <GitMerge className="h-3.5 w-3.5" /> Beralih ke Merge Karyawan Ini
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLinkEmployee}
            disabled={!linkSelection || isBusy || conflictAdvisory.hasConflict}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            Link to selected employee
          </button>
        </div>

        {/* Duplicate Merge Section */}
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Merge into Another Holder
          </p>
          <div className="flex gap-2 pt-1">
            <select
              value={mergeSelection}
              onChange={(e) => onMergeSelectionChange(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select target custodian...</option>
              {otherActiveCustodians.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.employeeCode || `Holder #${c.id}`})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onMergeCustodian}
              disabled={!mergeSelection || isBusy}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <GitMerge className="h-3.5 w-3.5 text-slate-500" /> Merge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
