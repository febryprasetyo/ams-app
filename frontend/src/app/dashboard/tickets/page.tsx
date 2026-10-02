'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { Ticket, Plus, AlertCircle } from 'lucide-react';
import { ITTicket, TicketCategory, AssetItem, EmployeeItem, TechnicianItem } from '@/lib/tickets/types';
import TicketStats from '@/components/tickets/TicketStats';
import TicketFilters from '@/components/tickets/TicketFilters';
import TicketTable from '@/components/tickets/TicketTable';
import CreateTicketModal from '@/components/tickets/CreateTicketModal';
import AssignTechnicianModal from '@/components/tickets/AssignTechnicianModal';
import ResolveTicketModal from '@/components/tickets/ResolveTicketModal';

export default function ServiceDeskTicketsPage() {
  // Primary State
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState<ITTicket | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState<ITTicket | null>(null);

  // Fetch Auxiliary Data
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [cats, asts, emps] = await Promise.all([
        api.get<TicketCategory[]>('/tickets/categories').catch((err) => {
          console.error('Failed to load ticket categories', err);
          return [] as TicketCategory[];
        }),
        api.get<AssetItem[]>('/assets').catch(() => []),
        api.get<EmployeeItem[]>('/employees').catch(() => []),
      ]);

      setCategories(Array.isArray(cats) ? cats : []);
      setAssets(Array.isArray(asts) ? asts : []);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load tickets';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedPriority, selectedStatus, selectedCategory]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Modals Openers
  const openCreateModal = async () => {
    if (categories.length === 0) {
      try {
        const cats = await api.get<TicketCategory[]>('/tickets/categories');
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        }
      } catch (err) {
        console.error('Failed to refresh ticket categories', err);
      }
    }
    setIsCreateModalOpen(true);
  };

  const openAssignModal = (ticket: ITTicket) => {
    setAssigningTicket(ticket);
    setIsAssignModalOpen(true);
  };

  const openResolveModal = (ticket: ITTicket) => {
    setResolvingTicket(ticket);
    setIsResolveModalOpen(true);
  };

  // Clear Filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedCategory('');
  };

  const hasActiveFilters = Boolean(search || selectedPriority || selectedStatus || selectedCategory);

  // Stats Calculations
  const totalOpenCount = tickets.filter(
    (t) => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending'
  ).length;

  const criticalBreachesCount = tickets.filter(
    (t) => t.priority === 'Critical' && (t.status === 'Open' || t.status === 'In Progress')
  ).length;

  const unassignedCount = tickets.filter(
    (t) => !t.assigneeId && t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;

  const resolvedTodayCount = tickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed'
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Ticket className="w-7 h-7 text-emerald-600" />
              <span>Service Desk & IT Helpdesk</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Incident logging, service requests, SLA tracking, and technician dispatch workspace
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create IT Ticket</span>
          </button>
        </div>

        {/* Bento Stat Cards Grid */}
        <TicketStats
          totalOpenCount={totalOpenCount}
          criticalBreachesCount={criticalBreachesCount}
          unassignedCount={unassignedCount}
          resolvedTodayCount={resolvedTodayCount}
        />

        {/* Filters */}
        <TicketFilters
          search={search}
          onSearchChange={setSearch}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tickets Table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onCreateFirstTicket={openCreateModal}
          onAssign={openAssignModal}
          onResolve={openResolveModal}
        />
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories}
        assets={assets}
        onSuccess={fetchTickets}
      />

      {/* Assign Technician Modal */}
      <AssignTechnicianModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningTicket(null);
        }}
        ticket={assigningTicket}
        technicians={technicians}
        onSuccess={fetchTickets}
      />

      {/* Quick Resolve Modal */}
      <ResolveTicketModal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setResolvingTicket(null);
        }}
        ticket={resolvingTicket}
        onSuccess={fetchTickets}
      />
    </DashboardLayout>
  );
}
