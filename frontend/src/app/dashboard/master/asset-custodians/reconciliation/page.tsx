'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, GitMerge, Link2, Loader2, RefreshCw, Sparkles, UserRound } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  canManageCustodians,
  type CustodianSummary,
  type EmployeeCandidate,
} from '@/lib/assetCustodian';

interface ReconciliationItem {
  custodian: CustodianSummary;
  matches: EmployeeCandidate[];
}

export default function CustodianReconciliationPage() {
  const { user } = useAuth();
  const isAdmin = canManageCustodians(user?.roleName);

  const [candidates, setCandidates] = useState<ReconciliationItem[]>([]);
  const [activeCustodians, setActiveCustodians] = useState<CustodianSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [linkSelections, setLinkSelections] = useState<Record<number, string>>({});
  const [mergeSelections, setMergeSelections] = useState<Record<number, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reconcileRes, searchRes] = await Promise.all([
        api.get<ReconciliationItem[]>('/asset-custodians/reconciliation-candidates'),
        api.get<{ custodians: CustodianSummary[] }>('/asset-custodians?status=ACTIVE'),
      ]);
      setCandidates(Array.isArray(reconcileRes) ? reconcileRes : []);
      setActiveCustodians(Array.isArray(searchRes?.custodians) ? searchRes.custodians : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reconciliation candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const linkEmployee = async (item: ReconciliationItem) => {
    const employeeId = Number(linkSelections[item.custodian.id]);
    if (!employeeId) return;
    setBusyId(item.custodian.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.post(`/asset-custodians/${item.custodian.id}/link-employee`, { employeeId });
      setSuccessMessage(`Successfully linked "${item.custodian.displayName}" to HR record.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to link employee');
    } finally {
      setBusyId(null);
    }
  };

  const mergeCustodian = async (source: CustodianSummary) => {
    const targetId = Number(mergeSelections[source.id]);
    if (!targetId) return;
    setBusyId(source.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.post(`/asset-custodians/${source.id}/merge`, { targetCustodianId: targetId });
      setSuccessMessage(`Successfully merged "${source.displayName}" into canonical holder.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to merge custodian');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCandidates = candidates.filter((item) => !dismissed.has(item.custodian.id));

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-lg font-bold text-slate-900">Administrator access required</h1>
          <p className="mt-1 text-xs text-slate-600">HR Reconciliation requires SuperAdmin or ITAdmin role.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <div>
          <Link
            href="/dashboard/master/asset-custodians"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Asset Custodians
          </Link>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">HR Reconciliation Candidates</h1>
              <p className="text-xs text-slate-500">
                Review unverified holders and resolve them with official HR employee records or merge duplicate profiles.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-xs text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading candidates...
          </div>
        ) : pendingCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No candidates requiring reconciliation</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              All current asset holders are either verified or have been reviewed. As new manual holders are created, suggested matches will appear here.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/master/asset-custodians"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Return to Directory
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingCandidates.map((item) => (
              <div
                key={item.custodian.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
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
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600">
                    {item.custodian.locationName || 'No location'}
                    {item.custodian.unitText ? ` · ${item.custodian.unitText}` : ''}
                  </p>

                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Suggested HR Matches ({item.matches.length})
                    </p>
                    {item.matches.length === 0 ? (
                      <p className="text-xs text-slate-500">No close employee name matches found.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {item.matches.slice(0, 3).map((match) => (
                          <li key={match.id} className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{match.fullName}</span>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                              {match.employeeCode} · {match.departmentName || match.locationName || 'HR'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    {item.matches.length > 0 && (
                      <div className="flex gap-2">
                        <select
                          value={linkSelections[item.custodian.id] || ''}
                          onChange={(e) =>
                            setLinkSelections((cur) => ({ ...cur, [item.custodian.id]: e.target.value }))
                          }
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">Select HR employee to link...</option>
                          {item.matches.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.fullName} ({m.employeeCode}) · {m.departmentName || m.locationName || 'HR'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => linkEmployee(item)}
                          disabled={!linkSelections[item.custodian.id] || busyId === item.custodian.id}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
                        >
                          <Link2 className="h-3.5 w-3.5" /> Link
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <select
                        value={mergeSelections[item.custodian.id] || ''}
                        onChange={(e) =>
                          setMergeSelections((cur) => ({ ...cur, [item.custodian.id]: e.target.value }))
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-slate-800 focus:outline-none"
                      >
                        <option value="">Or merge into existing active custodian...</option>
                        {activeCustodians
                          .filter((target) => target.id !== item.custodian.id)
                          .map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.displayName} ({target.employeeCode || target.unitText || 'Manual'})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => mergeCustodian(item.custodian)}
                        disabled={!mergeSelections[item.custodian.id] || busyId === item.custodian.id}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40"
                      >
                        <GitMerge className="h-3.5 w-3.5" /> Merge
                      </button>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setDismissed((cur) => new Set(cur).add(item.custodian.id))}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                      >
                        Keep separate for this session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
