'use client';

import React, { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { ITTicket, TechnicianItem } from '@/lib/tickets/types';
import { UserCheck, AlertCircle, Loader2 } from 'lucide-react';

interface AssignTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ITTicket | null;
  technicians: TechnicianItem[];
  onSuccess: () => void;
}

export default function AssignTechnicianModal({
  isOpen,
  onClose,
  ticket,
  technicians,
  onSuccess,
}: AssignTechnicianModalProps) {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | ''>(ticket?.assigneeId || '');
  const [prevTicketId, setPrevTicketId] = useState<number | null>(ticket?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ticket && ticket.id !== prevTicketId) {
    setPrevTicketId(ticket.id);
    setSelectedAssigneeId(ticket.assigneeId || '');
    setError(null);
  }

  if (!isOpen || !ticket) return null;

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.put(`/tickets/${ticket.id}`, {
        assigneeId: selectedAssigneeId ? Number(selectedAssigneeId) : null,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign technician';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-red-600" />
          <span>Assign IT Specialist</span>
        </div>
      }
      maxWidthClass="max-w-md"
    >
      <div className="mb-4 p-3 bg-red-50/50 rounded-xl border border-red-100 font-mono text-xs">
        <p className="font-bold text-red-600">{ticket.ticketCode}</p>
        <p className="text-slate-700 truncate mt-0.5">{ticket.subject}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
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
    </ModalShell>
  );
}
