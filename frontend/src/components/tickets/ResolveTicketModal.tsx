'use client';

import React, { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ResolveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: number;
    ticketCode: string;
    subject?: string;
  } | null;
  onSuccess: () => void;
}

export default function ResolveTicketModal({
  isOpen,
  onClose,
  ticket,
  onSuccess,
}: ResolveTicketModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError('Resolution notes are required to resolve this ticket.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.put(`/tickets/${ticket.id}`, {
        status: 'Resolved',
        resolutionNotes: resolutionNotes.trim(),
        resolvedAt: new Date().toISOString(),
      });
      setResolutionNotes('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resolve ticket';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      setResolutionNotes('');
      onClose();
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Resolve Ticket ({ticket.ticketCode})</span>
        </div>
      }
      maxWidthClass="max-w-md"
    >
      {ticket.subject && (
        <div className="mb-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 font-mono text-xs">
          <p className="font-bold text-emerald-700">{ticket.ticketCode}</p>
          <p className="text-slate-700 truncate mt-0.5">{ticket.subject}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Resolution Summary & Notes *
          </label>
          <textarea
            required
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Detail the steps taken to fix the incident or fulfill the request..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
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
                <span>Resolving...</span>
              </>
            ) : (
              <span>Confirm Resolution</span>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
