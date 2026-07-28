'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Ticket,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Lock,
  MessageSquare,
  Send,
  HardDrive,
  User as UserIcon,
  Mail,
  Tag,
  Calendar,
  Loader2,
  AlertCircle,
  Check,
  FileText,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';

export interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  commentText: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketDetail {
  id: number;
  ticketCode: string;
  type: string; // 'Incident' | 'Request'
  subject: string;
  title?: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  reporterId: number;
  reporterName?: string;
  reporterEmployeeName?: string;
  reporterEmail?: string;
  assigneeId?: number | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  assetId?: number | null;
  assetCode?: string | null;
  assetName?: string | null;
  dueAt?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  comments?: TicketComment[];
}

export interface EmployeeItem {
  id: number;
  fullName: string;
  email?: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();

  // Resolve Param
  const [ticketIdStr, setTicketIdStr] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((p) => {
      setTicketIdStr(p.id);
    });
  }, [params]);

  // Primary State
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [technicians, setTechnicians] = useState<{ id: number; name: string; email?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | ''>('');

  // Resolution modal state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionInput, setResolutionInput] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Fetch Ticket Detail
  const fetchTicketDetail = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<TicketDetail>(`/tickets/${id}`);
      setTicket(data);
      setSelectedAssigneeId(data.assigneeId || '');

      // Load employees for technician list if not loaded
      api.get<EmployeeItem[]>('/employees')
        .then((emps) => {
          setTechnicians(emps.map((e) => ({ id: e.id, name: e.fullName, email: e.email })));
        })
        .catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    } fontFinally: {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ticketIdStr) {
      fetchTicketDetail(ticketIdStr);
    }
  }, [ticketIdStr, fetchTicketDetail]);

  // Handle Status Transition
  const handleStatusChange = async (newStatus: 'In Progress' | 'Closed') => {
    if (!ticket) return;

    try {
      setUpdatingStatus(true);
      const updated = await api.put<TicketDetail>(`/tickets/${ticket.id}`, {
        status: newStatus,
      });
      setTicket((prev) => (prev ? { ...prev, status: updated.status || newStatus } : null));
      fetchTicketDetail(ticket.id.toString());
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Assignee Change
  const handleAssigneeChange = async (newAssigneeId: number | '') => {
    if (!ticket) return;

    try {
      setUpdatingStatus(true);
      const payload = {
        assigneeId: newAssigneeId ? Number(newAssigneeId) : null,
        status: ticket.status === 'Open' ? 'In Progress' : ticket.status,
      };
      await api.put(`/tickets/${ticket.id}`, payload);
      setSelectedAssigneeId(newAssigneeId);
      fetchTicketDetail(ticket.id.toString());
    } catch (err: any) {
      alert(err.message || 'Failed to reassign technician');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit Ticket Resolution
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    if (!resolutionInput.trim()) {
      setResolveError('Resolution notes are required to resolve this ticket.');
      return;
    }

    try {
      setUpdatingStatus(true);
      setResolveError(null);
      await api.put(`/tickets/${ticket.id}`, {
        status: 'Resolved',
        resolutionNotes: resolutionInput.trim(),
        resolvedAt: new Date().toISOString(),
      });
      setIsResolveModalOpen(false);
      fetchTicketDetail(ticket.id.toString());
    } catch (err: any) {
      setResolveError(err.message || 'Failed to resolve ticket');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    if (!commentText.trim()) {
      setCommentError('Comment text cannot be empty.');
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentError(null);
      await api.post(`/tickets/${ticket.id}/comments`, {
        commentText: commentText.trim(),
        isInternal,
      });
      setCommentText('');
      setIsInternal(false);
      fetchTicketDetail(ticket.id.toString());
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // SLA Calculation Helper
  const calculateSLAStatus = () => {
    if (!ticket) return { statusText: 'N/A', percent: 0, color: 'slate', isBreached: false };

    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return { statusText: 'SLA Met', percent: 100, color: 'emerald', isBreached: false };
    }

    if (!ticket.dueAt) {
      return { statusText: 'No SLA Set', percent: 0, color: 'slate', isBreached: false };
    }

    const createdTime = ticket.createdAt ? new Date(ticket.createdAt).getTime() : new Date().getTime() - 3600000;
    const dueTime = new Date(ticket.dueAt).getTime();
    const nowTime = Date.now();

    const totalDuration = Math.max(dueTime - createdTime, 1);
    const elapsed = Math.max(nowTime - createdTime, 0);

    const percent = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

    if (nowTime > dueTime) {
      const overdueMs = nowTime - dueTime;
      const overdueHours = Math.round(overdueMs / (1000 * 60 * 60));
      return {
        statusText: `BREACHED (${overdueHours}h overdue)`,
        percent: 100,
        color: 'red',
        isBreached: true,
      };
    }

    const remainingMs = dueTime - nowTime;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (remainingHours < 2) {
      return {
        statusText: `${remainingHours}h ${remainingMins}m remaining`,
        percent,
        color: 'amber',
        isBreached: false,
      };
    }

    return {
      statusText: `${remainingHours}h ${remainingMins}m remaining`,
      percent,
      color: 'emerald',
      isBreached: false,
    };
  };

  const slaInfo = calculateSLAStatus();

  // Priority Pill Renderer
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Critical Priority
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            High Priority
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Medium Priority
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Low Priority
          </span>
        );
    }
  };

  // Status Badge Renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            In Progress
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            Pending
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <span>Loading ticket workspace & discussion timeline...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !ticket) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Link
            href="/dashboard/tickets"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Ticket Queue</span>
          </Link>
          <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <p className="font-bold text-sm">{error || 'Ticket not found'}</p>
            <button
              onClick={() => router.push('/dashboard/tickets')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Return to Ticket Catalog
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isReq = ticket.type?.toLowerCase() === 'request' || ticket.ticketCode.startsWith('REQ');

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1600px] mx-auto">
        {/* Back Link & Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/tickets"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors shadow-2xs cursor-pointer"
              title="Back to Tickets"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                    isReq
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}
                >
                  {ticket.ticketCode}
                </span>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">
                  {ticket.type}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                {ticket.subject}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderPriorityBadge(ticket.priority)}
            {renderStatusBadge(ticket.status)}
          </div>
        </div>

        {/* Technician Control Bar & Action Ribbon */}
        <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Technician Reassign Select */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Assigned Specialist
              </p>
              <select
                value={selectedAssigneeId}
                disabled={updatingStatus}
                onChange={(e) => handleAssigneeChange(e.target.value ? Number(e.target.value) : '')}
                className="mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Workflow State Machine Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {ticket.status !== 'In Progress' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <button
                onClick={() => handleStatusChange('In Progress')}
                disabled={updatingStatus}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Mark In Progress</span>
              </button>
            )}

            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <button
                onClick={() => setIsResolveModalOpen(true)}
                disabled={updatingStatus}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Resolve Ticket</span>
              </button>
            )}

            {ticket.status === 'Resolved' && (
              <button
                onClick={() => handleStatusChange('Closed')}
                disabled={updatingStatus}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-slate-300" />
                <span>Close Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid: Left Column (Ticket Details & Comments), Right Column (SLA & Meta) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resolution Notes Banner (if resolved) */}
            {ticket.resolutionNotes && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Resolution Notes</span>
                  {ticket.resolvedAt && (
                    <span className="text-[10px] text-emerald-600 font-normal ml-auto">
                      {new Date(ticket.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-line pl-6">
                  {ticket.resolutionNotes}
                </p>
              </div>
            )}

            {/* Ticket Description Card */}
            <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Ticket Description & Details</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ''}
                </span>
              </div>

              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                {ticket.description}
              </div>
            </div>

            {/* Work Log & Discussion Thread */}
            <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-600" />
                  <span>Work Log & Discussion Thread</span>
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {ticket.comments?.length || 0} Messages
                </span>
              </div>

              {/* Timeline Comments List */}
              <div className="space-y-4">
                {(!ticket.comments || ticket.comments.length === 0) ? (
                  <div className="py-8 text-center text-slate-400 font-mono text-xs italic border border-dashed border-slate-200 rounded-xl">
                    No discussion updates posted yet. Use the form below to post a response or internal tech note.
                  </div>
                ) : (
                  ticket.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        comment.isInternal
                          ? 'bg-amber-50/60 border-amber-200/80 text-amber-950 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center ${
                              comment.isInternal
                                ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                : 'bg-red-600 text-white shadow-xs'
                            }`}
                          >
                            {comment.userName ? comment.userName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900">
                              {comment.userName || `User #${comment.userId}`}
                            </span>
                            {comment.userEmail && (
                              <span className="text-[10px] font-mono text-slate-400 ml-2">
                                {comment.userEmail}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {comment.isInternal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Lock className="w-3 h-3 text-amber-700" />
                              Internal Tech Note
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Public Response
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 whitespace-pre-line pl-9 font-sans">
                        {comment.commentText}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <div className="pt-4 border-t border-slate-100">
                {commentError && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{commentError}</span>
                  </div>
                )}

                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                      Add Reply or Work Log Entry
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type your response to user or internal technician log..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Internal Tech Note (Visible only to IT Specialists)</span>
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={commentSubmitting}
                      className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-red-600/10"
                    >
                      {commentSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col wide): SLA Countdown & Meta Info */}
          <div className="space-y-6">
            {/* SLA Countdown Tracker Card */}
            <div className="glass-panel p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>SLA Countdown Tracker</span>
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Resolution SLA Status</span>
                  <span
                    className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      slaInfo.isBreached
                        ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                        : slaInfo.color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {slaInfo.statusText}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      slaInfo.isBreached
                        ? 'bg-red-600'
                        : slaInfo.color === 'emerald'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${slaInfo.percent}%` }}
                  />
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500 border-t border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Registered</span>
                    <span className="font-bold text-slate-800">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Target Due Date</span>
                    <span className="font-bold text-slate-800">
                      {ticket.dueAt ? new Date(ticket.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporter Card */}
            <div className="glass-panel p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-red-600" />
                <span>Reporter Details</span>
              </h3>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                  {ticket.reporterName ? ticket.reporterName[0].toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {ticket.reporterName || `User #${ticket.reporterId}`}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                    {ticket.reporterEmail || 'No Email Registered'}
                  </p>
                </div>
              </div>
            </div>

            {/* Associated IT Asset Card (If present) */}
            {ticket.assetId && (
              <div className="glass-panel p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-red-600" />
                  <span>Associated IT Asset</span>
                </h3>

                <Link
                  href={`/dashboard/assets/${ticket.assetId}`}
                  className="p-3 bg-red-50/50 hover:bg-red-50 border border-red-200 rounded-xl flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-mono font-bold text-xs text-red-600 group-hover:text-red-700">
                        {ticket.assetCode}
                      </p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {ticket.assetName || 'IT Asset'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Resolve Modal --- */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Resolve Ticket ({ticket.ticketCode})</span>
              </h3>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resolveError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resolveError}</span>
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Resolution Notes & Technical Fix *
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="Detail the steps taken to fix the incident or fulfill the request..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <span>Confirm Resolution</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
