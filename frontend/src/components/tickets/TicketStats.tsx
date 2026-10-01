import React from 'react';
import { Ticket, AlertTriangle, UserCheck, CheckCircle2 } from 'lucide-react';

interface TicketStatsProps {
  totalOpenCount: number;
  criticalBreachesCount: number;
  unassignedCount: number;
  resolvedTodayCount: number;
}

export default function TicketStats({
  totalOpenCount,
  criticalBreachesCount,
  unassignedCount,
  resolvedTodayCount,
}: TicketStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Open Tickets */}
      <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Total Open Tickets
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black font-mono text-slate-900 mt-2">{totalOpenCount}</p>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
          <span className="text-emerald-600 font-bold">Active</span> queue
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
            Pending Assignment
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black font-mono text-slate-900 mt-2">{unassignedCount}</p>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono">
          <span className="text-amber-600 font-bold">Unassigned</span> queue
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
          <span className="text-emerald-600 font-bold">Completed</span> resolution
        </div>
      </div>
    </div>
  );
}
