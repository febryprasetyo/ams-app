'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Ticket,
  Plus,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Eye,
  Clock,
  AlertTriangle,
  HardDrive,
  ChevronRight,
  Tag,
  User as UserIcon,
  ShieldCheck,
  Check,
  Sparkles,
  FileText
} from 'lucide-react';

export interface TicketCategory {
  id: number;
  code?: string;
  name: string;
  description?: string;
}

export interface AssetItem {
  id: number;
  assetCode: string;
  name: string;
}

export interface EmployeeItem {
  id: number;
  employeeCode: string;
  fullName: string;
  email?: string;
}

export interface ITTicket {
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
}

export default function ServiceDeskTicketsPage() {
  // Primary State
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [technicians, setTechnicians] = useState<{ id: number; name: string; email?: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Create Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formType, setFormType] = useState<'Incident' | 'Request'>('Incident');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formPriority, setFormPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [formAssetId, setFormAssetId] = useState<number | ''>('');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createModalError, setCreateModalError] = useState<string | null>(null);

  // Assign Technician Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState<ITTicket | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | ''>('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignModalError, setAssignModalError] = useState<string | null>(null);

  // Quick Resolve Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState<ITTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveModalError, setResolveModalError] = useState<string | null>(null);

  // Fetch Auxiliary Data
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [cats, asts, emps] = await Promise.all([
        api.get<TicketCategory[]>('/tickets/categories').catch(() => []),
        api.get<AssetItem[]>('/assets').catch(() => []),
        api.get<EmployeeItem[]>('/employees').catch(() => []),
      ]);

      setCategories(cats);
      setAssets(asts);

      // Build technician options from employee directory
      const techList = emps.map((e) => ({
        id: e.id,
        name: e.fullName,
        email: e.email,
      }));
      setTechnicians(techList);
    } catch (err) {
      console.error('Failed to load auxiliary ticket options', err);
    }
  }, []);

  // Fetch Tickets List
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (selectedPriority) queryParams.set('priority', selectedPriority);
      if (selectedStatus) queryParams.set('status', selectedStatus);
      if (selectedCategory) queryParams.set('categoryId', selectedCategory);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const data = await api.get<ITTicket[]>(`/tickets${queryString}`);
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [search, selectedPriority, selectedStatus, selectedCategory]);

  useEffect(() => {
    fetchAuxiliaryData();
    fetchTickets();
  }, [fetchAuxiliaryData, fetchTickets]);

  // Handler: Open Create Ticket Modal
  const openCreateModal = () => {
    setFormType('Incident');
    setFormCategoryId(categories[0]?.id || '');
    setFormPriority('Medium');
    setFormAssetId('');
    setFormSubject('');
    setFormDescription('');
    setCreateModalError(null);
    setIsCreateModalOpen(true);
  };

  // Handler: Submit Create Ticket
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim() || !formCategoryId) {
      setCreateModalError('Subject, Category, and Description are required.');
      return;
    }

    setCreateSubmitting(true);
    setCreateModalError(null);

    const payload = {
      type: formType,
      title: formSubject.trim(),
      subject: formSubject.trim(),
      priority: formPriority,
      categoryId: Number(formCategoryId),
      assetId: formAssetId ? Number(formAssetId) : null,
      description: formDescription.trim(),
    };

    try {
      await api.post('/tickets', payload);
      setIsCreateModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      setCreateModalError(err.message || 'Failed to create ticket');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handler: Open Assign Technician Modal
  const openAssignModal = (ticket: ITTicket) => {
    setAssigningTicket(ticket);
    setSelectedAssigneeId(ticket.assigneeId || '');
    setAssignModalError(null);
    setIsAssignModalOpen(true);
  };

  // Handler: Submit Assign Technician
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket) return;

    setAssignSubmitting(true);
    setAssignModalError(null);

    try {
      await api.put(`/tickets/${assigningTicket.id}`, {
        assigneeId: selectedAssigneeId ? Number(selectedAssigneeId) : null,
        status: assigningTicket.status === 'Open' ? 'In Progress' : assigningTicket.status,
      });
      setIsAssignModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      setAssignModalError(err.message || 'Failed to assign technician');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Handler: Open Quick Resolve Modal
  const openResolveModal = (ticket: ITTicket) => {
    setResolvingTicket(ticket);
    setResolutionNotes(ticket.resolutionNotes || '');
    setResolveModalError(null);
    setIsResolveModalOpen(true);
  };

  // Handler: Submit Quick Resolve
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    if (!resolutionNotes.trim()) {
      setResolveModalError('Resolution notes are required to resolve a ticket.');
      return;
    }

    setResolveSubmitting(true);
    setResolveModalError(null);

    try {
      await api.put(`/tickets/${resolvingTicket.id}`, {
        status: 'Resolved',
        resolutionNotes: resolutionNotes.trim(),
        resolvedAt: new Date().toISOString(),
      });
      setIsResolveModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      setResolveModalError(err.message || 'Failed to resolve ticket');
    } finally {
      setResolveSubmitting(false);
    }
  };

  // Clear Filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedCategory('');
  };

  const hasActiveFilters = Boolean(search || selectedPriority || selectedStatus || selectedCategory);

  // Compute Bento Statistics
  const totalOpenCount = tickets.filter(
    (t) => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending'
  ).length;

  const now = new Date();
  const criticalBreachesCount = tickets.filter((t) => {
    const isClosedOrResolved = t.status === 'Resolved' || t.status === 'Closed';
    if (isClosedOrResolved) return false;
    const isCritical = t.priority === 'Critical';
    const isOverdue = t.dueAt ? new Date(t.dueAt) < now : false;
    return isCritical || isOverdue;
  }).length;

  const pendingAssignmentCount = tickets.filter((t) => !t.assigneeId && t.status !== 'Closed').length;

  const resolvedTodayCount = tickets.filter((t) => {
    if (t.status !== 'Resolved' && t.status !== 'Closed') return false;
    if (!t.resolvedAt && !t.updatedAt) return false;
    const dateToCompare = new Date(t.resolvedAt || t.updatedAt!);
    return (
      dateToCompare.getDate() === now.getDate() &&
      dateToCompare.getMonth() === now.getMonth() &&
      dateToCompare.getFullYear() === now.getFullYear()
    );
  }).length;

  // Render Helpers
  const renderPriorityPill = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Low
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            In Progress
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Pending
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const renderSLABadge = (dueAtStr?: string | null, status?: string) => {
    if (status === 'Resolved' || status === 'Closed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          SLA Met
        </span>
      );
    }

    if (!dueAtStr) {
      return <span className="text-slate-400 font-mono text-[11px]">—</span>;
    }

    const dueDate = new Date(dueAtStr);
    const diffMs = dueDate.getTime() - new Date().getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      const overdueHours = Math.abs(diffHours);
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
          Breached ({overdueHours}h ago)
        </span>
      );
    }

    if (diffHours <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          Due in {diffHours === 0 ? '<1' : diffHours}h
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
        Due in {diffHours}h
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Ticket className="w-7 h-7 text-red-600" />
              <span>Service Desk & IT Helpdesk</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Incident logging, service requests, SLA tracking, and technician dispatch workspace
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create IT Ticket</span>
          </button>
        </div>

        {/* Bento Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Open Tickets */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Total Open Tickets
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 mt-2">{totalOpenCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-blue-600 font-bold">Active</span> queue
            </div>
          </div>

          {/* Card 2: Critical SLA Breaches */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Critical SLA Breaches
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-red-600 mt-2">{criticalBreachesCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-red-600 font-bold">Requires</span> immediate action
            </div>
          </div>

          {/* Card 3: Pending Assignment */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Unassigned Tickets
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-amber-600 mt-2">{pendingAssignmentCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span>Needs technician</span>
            </div>
          </div>

          {/* Card 4: Resolved Today */}
          <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Resolved Today
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 mt-2">{resolvedTodayCount}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-emerald-600 font-bold">Completed</span> today
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket code (INC-2026-0001), subject, reporter..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Priority */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Glass Ticket Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200 w-full">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
              <Loader2 className="w-7 h-7 animate-spin text-red-600" />
              <span>Fetching IT Service Desk ticket queue...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-800 font-bold text-sm">No IT Tickets Found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'No tickets match your filter criteria. Try clearing search filters.'
                  : 'Get started by creating your first IT support request or incident ticket.'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              ) : (
                <button
                  onClick={openCreateModal}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Ticket</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-semibold">Ticket Code</th>
                    <th className="py-3.5 px-5 font-semibold">Subject & Category</th>
                    <th className="py-3.5 px-5 font-semibold">Reporter</th>
                    <th className="py-3.5 px-5 font-semibold">Priority</th>
                    <th className="py-3.5 px-5 font-semibold">Status</th>
                    <th className="py-3.5 px-5 font-semibold">Target Asset</th>
                    <th className="py-3.5 px-5 font-semibold">SLA Due Date</th>
                    <th className="py-3.5 px-5 font-semibold">Assigned Tech</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => {
                    const isReq = ticket.type?.toLowerCase() === 'request' || ticket.ticketCode.startsWith('REQ');
                    return (
                      <tr key={ticket.id} className="hover:bg-red-50/30 transition-colors group">
                        {/* Ticket Code */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <Link
                            href={`/dashboard/tickets/${ticket.id}`}
                            className={`font-mono font-bold px-2.5 py-1 rounded-md border transition-colors inline-flex items-center gap-1 group/code ${
                              isReq
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300'
                                : 'bg-red-50 text-red-600 border-red-200 hover:border-red-300'
                            }`}
                          >
                            <span>{ticket.ticketCode}</span>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                          </Link>
                        </td>

                        {/* Subject & Category */}
                        <td className="py-4 px-5">
                          <div className="flex flex-col max-w-xs">
                            <Link
                              href={`/dashboard/tickets/${ticket.id}`}
                              className="font-bold text-slate-900 group-hover:text-red-600 transition-colors text-xs truncate"
                              title={ticket.subject}
                            >
                              {ticket.subject}
                            </Link>
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {ticket.categoryName || 'General IT Issue'}
                            </span>
                          </div>
                        </td>

                        {/* Reporter */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              {ticket.reporterName ? ticket.reporterName[0].toUpperCase() : 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-xs">
                                {ticket.reporterName || `User #${ticket.reporterId}`}
                              </span>
                              {ticket.reporterEmail && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {ticket.reporterEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {renderPriorityPill(ticket.priority)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {renderStatusBadge(ticket.status)}
                        </td>

                        {/* Target Asset */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {ticket.assetCode ? (
                            <Link
                              href={`/dashboard/assets/${ticket.assetId}`}
                              className="text-slate-700 font-medium hover:text-red-600 flex items-center gap-1.5 text-xs font-mono"
                            >
                              <HardDrive className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span>{ticket.assetCode}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">—</span>
                          )}
                        </td>

                        {/* SLA Due Date */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {renderSLABadge(ticket.dueAt, ticket.status)}
                        </td>

                        {/* Assigned Technician */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {ticket.assigneeName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-red-200">
                                {ticket.assigneeName[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800 text-xs">
                                {ticket.assigneeName}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModal(ticket)}
                              className="text-amber-600 hover:text-amber-700 font-mono text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Assign Tech</span>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Detail */}
                            <Link
                              href={`/dashboard/tickets/${ticket.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              title="View Ticket Details & Work Log"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Assign Technician */}
                            <button
                              onClick={() => openAssignModal(ticket)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                              title="Assign / Change Technician"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>

                            {/* Quick Resolve */}
                            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                              <button
                                onClick={() => openResolveModal(ticket)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
                                title="Quick Resolve Ticket"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- Create IT Ticket Modal --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-red-600" />
                <span>Create IT Support Ticket</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Type Select */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Ticket Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'Incident' | 'Request')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  >
                    <option value="Incident">Incident (System Breakdown)</option>
                    <option value="Request">Service Request (Hardware/Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  >
                    <option value="Low">Low (Routine / Inquiry)</option>
                    <option value="Medium">Medium (Standard SLA 24h)</option>
                    <option value="High">High (Urgent SLA 8h)</option>
                    <option value="Critical">Critical (Outage SLA 2h)</option>
                  </select>
                </div>
              </div>

              {/* Category & Asset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                    Target IT Asset (Optional)
                  </label>
                  <select
                    value={formAssetId}
                    onChange={(e) => setFormAssetId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  >
                    <option value="">No Specific Asset</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.assetCode} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Subject / Short Title *
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Printer offline on Floor 3, Email login error"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the problem, error message, steps to reproduce, or requested hardware specs..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Assign Technician Modal --- */}
      {isAssignModalOpen && assigningTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-red-600" />
                <span>Assign IT Technician</span>
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-red-50/50 rounded-xl border border-red-100 font-mono text-xs">
              <p className="font-bold text-red-600">{assigningTicket.ticketCode}</p>
              <p className="text-slate-700 truncate mt-0.5">{assigningTicket.subject}</p>
            </div>

            {assignModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignModalError}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Select IT Specialist / Technician *
                </label>
                <select
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email || `ID #${t.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {assignSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm Assignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Quick Resolve Ticket Modal --- */}
      {isResolveModalOpen && resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Mark Ticket as Resolved</span>
              </h3>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 font-mono text-xs">
              <p className="font-bold text-emerald-700">{resolvingTicket.ticketCode}</p>
              <p className="text-slate-700 truncate mt-0.5">{resolvingTicket.subject}</p>
            </div>

            {resolveModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resolveModalError}</span>
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
                  Resolution Summary & Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain how the ticket was resolved or root cause fix..."
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
                  disabled={resolveSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {resolveSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <span>Resolve Ticket</span>
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
