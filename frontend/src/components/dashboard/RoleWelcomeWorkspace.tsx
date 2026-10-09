'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getTimeBasedGreeting } from '@/lib/attendance/overviewMetrics';
import { BRAND_NAME } from '@/lib/gajianichBrand';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export interface WorkspaceShortcut {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  accentColor?: string;
}

export interface FutureModuleCard {
  title: string;
  description: string;
  icon: React.ElementType;
  statusText?: string;
}

export interface RoleWelcomeWorkspaceProps {
  roleTitle: string;
  roleBadge: string;
  description: string;
  shortcuts?: WorkspaceShortcut[];
  futureModules?: FutureModuleCard[];
}

export default function RoleWelcomeWorkspace({
  roleTitle,
  roleBadge,
  description,
  shortcuts = [],
  futureModules = [],
}: RoleWelcomeWorkspaceProps) {
  const { user } = useAuth();

  const greeting = getTimeBasedGreeting(user?.fullName || user?.email?.split('@')[0] || 'Rekan');

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 font-mono text-[11px] font-bold tracking-wide uppercase border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {roleBadge}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formattedDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {greeting}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {description}
            </p>
          </div>

          {/* Account Identity Card */}
          <div className="shrink-0 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-sm min-w-[240px]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-base shadow-sm">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-[11px] text-slate-500 truncate font-mono">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                    {user?.roleName || 'Sesi Aktif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      {shortcuts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-emerald-600" />
              Menu & Aksi Cepat
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.title}
                  href={shortcut.href}
                  className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      {shortcut.badge && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {shortcut.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {shortcut.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {shortcut.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                    <span>Buka Modul</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Future Roadmap / Module Containers */}
      {futureModules.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
              <Shield className="w-4 h-4 text-slate-400" />
              Modul Dalam Pengembangan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {futureModules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.title}
                  className="bg-slate-50/70 rounded-2xl p-5 border border-dashed border-slate-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-slate-200/60 text-slate-500 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                        {module.statusText || 'Segera Hadir'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">
                        {module.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rencana Roadmap Fitur</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
