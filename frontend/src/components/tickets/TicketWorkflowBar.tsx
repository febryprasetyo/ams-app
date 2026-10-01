import React from 'react';
import { UserCheck, Clock, CheckCircle2, Lock } from 'lucide-react';
import { TicketDetail, TechnicianItem } from '@/lib/tickets/types';

interface TicketWorkflowBarProps {
  ticket: TicketDetail;
  technicians: TechnicianItem[];
  updatingStatus: boolean;
  selectedAssigneeId: number | '';
  onAssigneeChange: (newAssigneeId: number | '') => void;
  onStatusChange: (newStatus: 'In Progress' | 'Closed') => void;
  onOpenResolve: () => void;
}

export default function TicketWorkflowBar({
  ticket,
  technicians,
  updatingStatus,
  selectedAssigneeId,
  onAssigneeChange,
  onStatusChange,
  onOpenResolve,
}: TicketWorkflowBarProps) {
  return (
    <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Technician Reassign Select */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Assigned Specialist
          </p>
          <select
            value={selectedAssigneeId}
            disabled={updatingStatus}
            onChange={(e) => onAssigneeChange(e.target.value ? Number(e.target.value) : '')}
            className="mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
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
            onClick={() => onStatusChange('In Progress')}
            disabled={updatingStatus}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs border border-amber-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Mark In Progress</span>
          </button>
        )}

        {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
          <button
            onClick={onOpenResolve}
            disabled={updatingStatus}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Resolve Ticket</span>
          </button>
        )}

        {ticket.status === 'Resolved' && (
          <button
            onClick={() => onStatusChange('Closed')}
            disabled={updatingStatus}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5 text-slate-300" />
            <span>Close Ticket</span>
          </button>
        )}
      </div>
    </div>
  );
}
