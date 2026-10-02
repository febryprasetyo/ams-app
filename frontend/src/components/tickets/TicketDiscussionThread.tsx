'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { TicketComment } from '@/lib/tickets/types';
import { MessageSquare, Lock, AlertCircle, Loader2, Send } from 'lucide-react';

interface TicketDiscussionThreadProps {
  ticketId: number;
  comments?: TicketComment[];
  onCommentAdded: () => void;
}

export default function TicketDiscussionThread({
  ticketId,
  comments = [],
  onCommentAdded,
}: TicketDiscussionThreadProps) {
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.post(`/tickets/${ticketId}/comments`, {
        commentText: commentText.trim(),
        isInternal,
      });
      setCommentText('');
      setIsInternal(false);
      onCommentAdded();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to post reply';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Work Log & Discussion Thread</span>
        </h3>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          {comments.length} Messages
        </span>
      </div>

      {/* Timeline Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-mono text-xs italic border border-dashed border-slate-200 rounded-xl">
            No discussion updates posted yet. Use the form below to post a response or internal tech note.
          </div>
        ) : (
          comments.map((comment) => (
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
                        : 'bg-emerald-600 text-white shadow-xs'
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
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
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
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
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/10"
            >
              {submitting ? (
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
  );
}
