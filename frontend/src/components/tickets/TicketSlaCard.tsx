import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, User as UserIcon, HardDrive, ChevronRight } from 'lucide-react';
import { TicketDetail } from '@/lib/tickets/types';

interface TicketSlaCardProps {
  ticket: TicketDetail;
}

export default function TicketSlaCard({ ticket }: TicketSlaCardProps) {
  const [nowTime] = useState(() => Date.now());

  const calculateSLAStatus = () => {
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return {
        statusText: 'SLA MET / RESOLVED',
        percent: 100,
        color: 'emerald',
        isBreached: false,
      };
    }

    if (!ticket.dueAt) {
      return {
        statusText: 'NO SLA SET',
        percent: 0,
        color: 'slate',
        isBreached: false,
      };
    }

    const createdTime = ticket.createdAt ? new Date(ticket.createdAt).getTime() : nowTime - 3600000;
    const dueTime = new Date(ticket.dueAt).getTime();

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

  return (
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
                {ticket.dueAt
                  ? new Date(ticket.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'}
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
  );
}
