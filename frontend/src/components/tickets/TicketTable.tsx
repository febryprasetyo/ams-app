import React from 'react';
import Link from 'next/link';
import {
  Ticket,
  ChevronRight,
  Tag,
  Clock,
  AlertTriangle,
  HardDrive,
  UserCheck,
  Eye,
  CheckCircle2,
  Check,
  Plus,
  Loader2,
} from 'lucide-react';
import { ITTicket } from '@/lib/tickets/types';

interface TicketTableProps {
  tickets: ITTicket[];
  loading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreateFirstTicket: () => void;
  onAssign: (ticket: ITTicket) => void;
  onResolve: (ticket: ITTicket) => void;
}

export function renderPriorityBadge(priority: string) {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
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
}

export function renderStatusBadge(status: string) {
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
}

export function renderSLABadge(dueAtStr?: string | null, status?: string) {
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
}

export default function TicketTable({
  tickets,
  loading,
  hasActiveFilters,
  onClearFilters,
  onCreateFirstTicket,
  onAssign,
  onResolve,
}: TicketTableProps) {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200 w-full p-16 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
        <Loader2 className="w-7 h-7 animate-spin text-red-600" />
        <span>Fetching IT Service Desk ticket queue...</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200 w-full p-16 text-center">
        <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-800 font-bold text-sm">No IT Tickets Found</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {hasActiveFilters
            ? 'No tickets match your filter criteria. Try clearing search filters.'
            : 'Get started by creating your first IT support request or incident ticket.'}
        </p>
        {hasActiveFilters ? (
          <button
            onClick={onClearFilters}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        ) : (
          <button
            onClick={onCreateFirstTicket}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Ticket</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200 w-full">
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
              const isReq =
                ticket.type?.toLowerCase() === 'request' ||
                ticket.ticketCode.startsWith('REQ');
              return (
                <tr
                  key={ticket.id}
                  className="hover:bg-red-50/30 transition-colors group"
                >
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
                      <div className="w-6 h-6 rounded-full bg-slate-100 font-mono font-bold text-[10px] text-slate-600 flex items-center justify-center border border-slate-200">
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
                    {renderPriorityBadge(ticket.priority)}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    {renderStatusBadge(ticket.status)}
                  </td>

                  {/* Target Asset */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    {ticket.assetId && ticket.assetCode ? (
                      <Link
                        href={`/dashboard/assets/${ticket.assetId}`}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 font-mono text-[11px] transition-colors"
                        title={ticket.assetName || 'Associated IT Asset'}
                      >
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{ticket.assetCode}</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </td>

                  {/* SLA Due Date */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    {renderSLABadge(ticket.dueAt, ticket.status)}
                  </td>

                  {/* Assigned Tech */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    {ticket.assigneeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-mono font-bold text-[10px] flex items-center justify-center border border-blue-200">
                          {ticket.assigneeName[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs">
                          {ticket.assigneeName}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAssign(ticket)}
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
                        onClick={() => onAssign(ticket)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                        title="Assign / Change Technician"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>

                      {/* Quick Resolve */}
                      {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                        <button
                          onClick={() => onResolve(ticket)}
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
    </div>
  );
}
