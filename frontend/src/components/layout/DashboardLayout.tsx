'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { canManageCustodians } from '@/lib/assetCustodian';
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
  ShieldAlert,
  Loader2,
  Search,
  Bell,
  HardDrive,
  Cpu,
  Ticket,
  Key,
  Server,
  Shapes,
  UserRoundCog,
  GitMerge,
  CalendarCheck,
  FileInput,
  ClipboardList,
  FileBarChart,
  History,
  Fingerprint
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  badge?: string;
  disabled?: boolean;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Master Data',
    items: [
      { name: 'Departments', href: '/dashboard/master/departments', icon: Building2, permission: 'master.view' },
      { name: 'IT Equipment Types', href: '/dashboard/master/equipment-types', icon: Shapes, permission: 'master.view' },
      { name: 'Locations', href: '/dashboard/master/locations', icon: MapPin, permission: 'master.view' },
      { name: 'Vendors', href: '/dashboard/master/vendors', icon: Store, permission: 'master.view' },
      { name: 'Employees', href: '/dashboard/master/employees', icon: Users, permission: 'master.view' },
      { name: 'Asset Custodians', href: '/dashboard/master/asset-custodians', icon: UserRoundCog, permission: 'master.manage', adminOnly: true },
      { name: 'HR Reconciliation', href: '/dashboard/master/asset-custodians/reconciliation', icon: GitMerge, permission: 'master.manage', adminOnly: true },
    ],
  },
  {
    title: 'HR',
    items: [
      { name: 'Data Absensi', href: '/dashboard/attendance', icon: CalendarCheck, permission: 'attendance.view' },
      { name: 'Impor Absensi', href: '/dashboard/attendance/imports', icon: FileInput, permission: 'attendance.import' },
      { name: 'Kartu Absensi', href: '/dashboard/attendance/employees', icon: ClipboardList, permission: 'attendance.view' },
      { name: 'Laporan Absensi', href: '/dashboard/attendance/reports', icon: FileBarChart, permission: 'attendance.view' },
      { name: 'Aktivitas Absensi', href: '/dashboard/attendance/activity', icon: History, permission: 'attendance.view' },
      { name: 'Karyawan Absensi', href: '/dashboard/attendance/master/employees', icon: Users, permission: 'attendance.view' },
      { name: 'Departemen Absensi', href: '/dashboard/attendance/master/departments', icon: Building2, permission: 'attendance.view' },
      { name: 'Lokasi Absensi', href: '/dashboard/attendance/master/locations', icon: MapPin, permission: 'attendance.view' },
      { name: 'Pemetaan Identitas', href: '/dashboard/attendance/identities', icon: Fingerprint, permission: 'attendance.manage' },
      { name: 'Akses Absensi', href: '/dashboard/attendance/access', icon: ShieldCheck, permission: 'attendance.manage' },
    ],
  },
  {
    title: 'Asset Lifecycle',
    items: [
      { name: 'IT Inventory', href: '/dashboard/assets', icon: HardDrive, permission: 'assets.view' },
      { name: 'Hardware Audits', href: '/dashboard/hardware-audits', icon: Cpu, permission: 'hardware_audits.view' },
      { name: 'Software Licenses', href: '/dashboard/licenses', icon: Key, permission: 'licenses.view' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Service Desk', href: '/dashboard/tickets', icon: Ticket, permission: 'tickets.view' },
      { name: 'Accurate & Servers', href: '/dashboard/infrastructure', icon: Server, permission: 'infrastructure.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Access Control', href: '/dashboard/access', icon: ShieldCheck, permission: 'access.users.view', adminOnly: true },
    ],
  },
];

const ROUTE_PERMISSION_MAP: { prefix: string; permission: string; moduleName: string }[] = [
  { prefix: '/dashboard/access', permission: 'access.users.view', moduleName: 'Access Control' },
  { prefix: '/dashboard/assets', permission: 'assets.view', moduleName: 'IT Asset Inventory' },
  { prefix: '/dashboard/hardware-audits', permission: 'hardware_audits.view', moduleName: 'Hardware Audits' },
  { prefix: '/dashboard/licenses', permission: 'licenses.view', moduleName: 'Software Licenses' },
  { prefix: '/dashboard/tickets', permission: 'tickets.view', moduleName: 'Service Desk Tickets' },
  { prefix: '/dashboard/infrastructure', permission: 'infrastructure.view', moduleName: 'Accurate & Server Infrastructure' },
  { prefix: '/dashboard/attendance', permission: 'attendance.view', moduleName: 'HR Attendance' },
  { prefix: '/dashboard/master', permission: 'master.view', moduleName: 'Master Data' },
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

  const hasItemAccess = (item: NavItem): boolean => {
    if (!user) return false;
    const normRole = (user.roleName || (user as { role?: string }).role || '').toLowerCase().replace(/_/g, '');
    if (normRole === 'superadmin' || user.permissions?.includes('*')) return true;

    if (item.href === '/dashboard/access') {
      return Boolean(
        normRole === 'admin' ||
        user.permissions?.includes('access.users.view') ||
        user.permissions?.includes('access.roles.manage')
      );
    }

    if (item.adminOnly) {
      if (!canManageCustodians(user.roleName)) return false;
    }

    if (item.permission) {
      return Boolean(user.permissions && user.permissions.includes(item.permission));
    }

    return true;
  };

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(hasItemAccess),
    }))
    .filter((group) => group.items.length > 0);

  const matchedRouteRule = ROUTE_PERMISSION_MAP.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );

  const canAccessCurrentRoute = (() => {
    if (!matchedRouteRule) return true;
    if (!user) return false;
    const normRole = (user.roleName || (user as { role?: string }).role || '').toLowerCase().replace(/_/g, '');
    if (normRole === 'superadmin' || user.permissions?.includes('*')) return true;

    if (matchedRouteRule.prefix === '/dashboard/access') {
      return Boolean(
        normRole === 'admin' ||
        user.permissions?.includes('access.users.view') ||
        user.permissions?.includes('access.roles.manage')
      );
    }

    return Boolean(user.permissions && user.permissions.includes(matchedRouteRule.permission));
  })();

  // Get active item name for breadcrumb
  const currentNavItem = visibleNavGroups
    .flatMap((g) => g.items)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => item.href === pathname || pathname.startsWith(`${item.href}/`));
  const currentNavGroup = visibleNavGroups.find(group => group.items.some(item => item.href === currentNavItem?.href));

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
        className={`fixed md:sticky md:top-0 h-dvh shrink-0 inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm ${
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
            aria-label="Tutup navigasi"
            className="md:hidden text-slate-400 hover:text-slate-700 p-2 cursor-pointer"
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
          {visibleNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = currentNavItem?.href === item.href;
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
              aria-label="Buka navigasi"
              className="md:hidden text-slate-500 hover:text-slate-900 p-2 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-slate-400">Platform</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400">{currentNavGroup?.title || 'Dashboard'}</span>
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
        <main className="flex-1 p-4 md:p-8 md:px-10 max-w-[1600px] w-full mx-auto">
          {!canAccessCurrentRoute ? (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 p-8 shadow-xl shadow-rose-500/5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold tracking-wide uppercase mb-3">
                  403 Akses Dibatasi
                </span>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Akses Modul Tidak Diizinkan
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Peran akun Anda (<span className="font-semibold text-slate-700">{user.roleName || (user as { role?: string }).role || 'User'}</span>) tidak memiliki izin <code className="px-1.5 py-0.5 bg-slate-100 text-rose-600 rounded text-[11px] font-mono">{matchedRouteRule?.permission}</code> untuk mengakses modul <span className="font-semibold text-slate-700">{matchedRouteRule?.moduleName}</span>.
                </p>

                {visibleNavGroups.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[11px] font-medium text-slate-400 mb-3">Menu yang dapat Anda akses:</p>
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {visibleNavGroups.flatMap(g => g.items).slice(0, 4).map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={visibleNavGroups[0]?.items[0]?.href || '/login'}
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-600/20 hover:from-red-700 hover:to-rose-700 transition-all cursor-pointer"
                    >
                      Buka Modul Anda
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
