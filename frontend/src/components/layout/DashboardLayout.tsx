'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  MapPin,
  Store,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  Loader2,
  Search,
  Bell,
  HardDrive,
  Ticket,
  Key,
  Server,
  Activity
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Master Data',
    items: [
      { name: 'Departments', href: '/dashboard/master/departments', icon: Building2 },
      { name: 'Locations', href: '/dashboard/master/locations', icon: MapPin },
      { name: 'Vendors', href: '/dashboard/master/vendors', icon: Store },
      { name: 'Employees', href: '/dashboard/master/employees', icon: Users },
    ],
  },
  {
    title: 'Asset Lifecycle',
    items: [
      { name: 'IT Inventory', href: '/dashboard/assets', icon: HardDrive },
      { name: 'Software Licenses', href: '/dashboard/licenses', icon: Key },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Service Desk', href: '/dashboard/tickets', icon: Ticket },
      { name: 'Accurate & Servers', href: '/dashboard/infrastructure', icon: Server, badge: 'Phase 5' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center text-slate-600 font-mono">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-xl">
          <Loader2 className="w-5 h-5 animate-spin text-red-600" />
          <span className="text-sm font-medium text-slate-800">Verifying Session Token...</span>
        </div>
      </div>
    );
  }

  // Get active item name for breadcrumb
  const currentNavItem = navGroups
    .flatMap((g) => g.items)
    .find((item) => item.href === pathname);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-red-500/20 selection:text-red-900">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Crisp White Sidebar with Fresh Red Accent */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <Link href="/dashboard/master/departments" className="flex items-center gap-3 overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                  <span>AMS</span>
                  <span className="text-red-600 font-mono text-xs">PRO</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1">IT Service Management</span>
              </div>
            )}
          </Link>

          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Search Shortcut Button */}
        {!collapsed && (
          <div className="px-3 pt-4 pb-2">
            <button className="w-full py-2 px-3 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center justify-between transition-colors cursor-pointer group">
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition-colors" />
                <span>Quick Search...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Group Section */}
        <div className="flex-1 py-3 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group relative ${
                      isActive
                        ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm shadow-red-500/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    {/* Active Red Accent Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-red-600" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />

                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* System Health Widget in Sidebar Footer */}
        {!collapsed && (
          <div className="p-3 m-3 rounded-2xl bg-red-50/50 border border-red-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-[11px] text-slate-600 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-red-600" />
                PostgreSQL Live
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 truncate">192.168.10.23:5432/ams_db</p>
          </div>
        )}

        {/* User Card in Sidebar Bottom */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow-sm">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.fullName || user.email}</p>
                  <p className="text-[10px] text-red-600 font-mono font-bold truncate uppercase">
                    {user.roleName || 'SUPERADMIN'}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-slate-400">Platform</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400">Master Data</span>
              <span className="text-slate-300">/</span>
              <span className="text-red-600 font-bold">{currentNavItem?.name || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600" />
            </button>

            <div className="h-4 w-px bg-slate-200" />

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 pl-1">
              <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-slate-700 font-medium hidden sm:inline">{user.email}</span>
                <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-mono font-bold text-[10px] uppercase border border-red-200">
                  {user.roleName || 'ADMIN'}
                </span>
              </div>

              {/* Topbar Logout Button */}
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 md:px-10 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
