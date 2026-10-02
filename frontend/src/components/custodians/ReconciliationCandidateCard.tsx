'use client';

import React from 'react';
import type { CustodianSummary, EmployeeCandidate } from '@/lib/assetCustodian';
import { GitMerge, Link2, Loader2, UserRound, X } from 'lucide-react';

export interface ReconciliationItem {
  custodian: CustodianSummary;
  matches: EmployeeCandidate[];
}

interface ReconciliationCandidateCardProps {
  item: ReconciliationItem;
  activeCustodians: CustodianSummary[];
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
  isBusy,
  linkSelection,
  onLinkSelectionChange,
  mergeSelection,
  onMergeSelectionChange,
  onLinkEmployee,
  onMergeCustodian,
  onDismiss,
}: ReconciliationCandidateCardProps) {
  const otherActiveCustodians = activeCustodians.filter(
    (c) => c.id !== item.custodian.id
  );

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

        {/* Suggested Matches Section */}
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Suggested HR Matches ({item.matches.length})
          </p>
          {item.matches.length === 0 ? (
            <p className="text-xs text-slate-500">No close employee name matches found.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {item.matches.map((match) => (
                <label
                  key={match.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs hover:border-slate-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`match-${item.custodian.id}`}
                      value={match.id}
                      checked={linkSelection === String(match.id)}
                      onChange={(e) => onLinkSelectionChange(e.target.value)}
                      className="text-red-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{match.fullName}</p>
                      <p className="text-[10px] text-slate-500">
                        {match.employeeCode} · {match.departmentName || 'No Dept'}
                        {match.locationName ? ` · ${match.locationName}` : ''}
                      </p>
                    </div>
                  </div>

                </label>
              ))}

              <button
                type="button"
                onClick={onLinkEmployee}
                disabled={!linkSelection || isBusy}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                Link to selected employee
              </button>
            </div>
          )}
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
