export interface RouteRule {
  prefix: string;
  exact?: boolean;
  permission?: string;
  itOnly?: boolean;
  adminOnly?: boolean;
  moduleName: string;
}

export const IT_ROLES = ['superadmin', 'super_admin', 'itadmin', 'it_admin', 'itstaff', 'it_staff', 'management'];
export const ADMIN_ROLES = ['superadmin', 'super_admin', 'itadmin', 'it_admin', 'admin'];

export const DASHBOARD_ROUTE_RULES: RouteRule[] = [
  // Super App Landing & Overviews
  {
    prefix: '/dashboard/assets/overview',
    permission: 'assets.view',
    moduleName: 'Asset Management Dashboard',
  },
  {
    prefix: '/dashboard/employee/overview',
    moduleName: 'Employee Workspace',
  },
  {
    prefix: '/dashboard/management/overview',
    moduleName: 'Management Workspace',
  },
  {
    prefix: '/dashboard/welcome',
    moduleName: 'Welcome Overview',
  },

  // Administration
  {
    prefix: '/dashboard/access',
    permission: 'access.users.view',
    adminOnly: true,
    moduleName: 'Access Control',
  },

  // IT Master Data (Restricted from HRD / General Users)
  {
    prefix: '/dashboard/master/asset-custodians',
    permission: 'master.manage',
    adminOnly: true,
    moduleName: 'Asset Custodians',
  },
  {
    prefix: '/dashboard/master/equipment-types',
    permission: 'assets.view',
    itOnly: true,
    moduleName: 'IT Equipment Types',
  },
  {
    prefix: '/dashboard/master/vendors',
    permission: 'assets.view',
    itOnly: true,
    moduleName: 'Vendors',
  },

  // Shared Master Data
  {
    prefix: '/dashboard/master/departments',
    permission: 'master.view',
    moduleName: 'Departments',
  },
  {
    prefix: '/dashboard/master/employees',
    permission: 'master.view',
    moduleName: 'Employees',
  },
  {
    prefix: '/dashboard/master/locations',
    permission: 'master.view',
    moduleName: 'Locations',
  },
  {
    prefix: '/dashboard/master',
    exact: true,
    permission: 'master.view',
    moduleName: 'Master Data',
  },

  // Asset Lifecycle
  {
    prefix: '/dashboard/assets',
    permission: 'assets.view',
    moduleName: 'IT Asset Inventory',
  },
  {
    prefix: '/dashboard/hardware-audits',
    permission: 'hardware_audits.view',
    moduleName: 'Hardware Audits',
  },
  {
    prefix: '/dashboard/licenses',
    permission: 'licenses.view',
    moduleName: 'Software Licenses',
  },

  // IT Operations
  {
    prefix: '/dashboard/tickets',
    permission: 'tickets.view',
    moduleName: 'Service Desk Tickets',
  },
  {
    prefix: '/dashboard/infrastructure',
    permission: 'infrastructure.view',
    moduleName: 'Server & Accurate Infrastructure',
  },

  // HR Attendance
  {
    prefix: '/dashboard/attendance/access',
    permission: 'attendance.manage',
    moduleName: 'Attendance Access Control',
  },
  {
    prefix: '/dashboard/attendance/identities',
    permission: 'attendance.manage',
    moduleName: 'Attendance Biometric Identities',
  },
  {
    prefix: '/dashboard/attendance/imports',
    permission: 'attendance.import',
    moduleName: 'Attendance Machine Imports',
  },
  {
    prefix: '/dashboard/attendance',
    permission: 'attendance.view',
    moduleName: 'HR Attendance',
  },
];

export function findMatchingRouteRule(pathname: string): RouteRule | undefined {
  // Sort rules by prefix length descending to match most specific subpaths first
  const sorted = [...DASHBOARD_ROUTE_RULES].sort((a, b) => b.prefix.length - a.prefix.length);
  return sorted.find((rule) => {
    if (rule.exact) {
      return pathname === rule.prefix;
    }
    return pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`);
  });
}

export function canAccessRoute(
  pathname: string,
  user: { roleName?: string; role?: string; permissions?: string[] } | null | undefined
): boolean {
  if (!user) return false;

  const normRole = (user.roleName || user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  const perms = Array.isArray(user.permissions) ? user.permissions : [];

  // SuperAdmin has full wildcard access
  if (normRole === 'superadmin' || normRole === 'super_admin' || perms.includes('*')) {
    return true;
  }

  // Dedicated open workspace landing pages
  if (pathname === '/dashboard/employee/overview' || pathname === '/dashboard/welcome') {
    return true;
  }

  if (pathname === '/dashboard/management/overview') {
    return normRole === 'management' || perms.includes('management.view');
  }

  const matched = findMatchingRouteRule(pathname);
  if (!matched) {
    // If not specifically registered in DASHBOARD_ROUTE_RULES, allow unless under dashboard
    return true;
  }

  // Admin Only check
  if (matched.adminOnly) {
    const isAdmin = ADMIN_ROLES.some((r) => r.replace(/[\s_-]+/g, '') === normRole);
    if (!isAdmin && !perms.includes('access.roles.manage') && !perms.includes('master.manage')) {
      return false;
    }
  }

  // IT Only check (e.g. IT Equipment Types, Vendors)
  if (matched.itOnly) {
    const isIT = IT_ROLES.some((r) => r.replace(/[\s_-]+/g, '') === normRole);
    const hasITPerm = perms.includes('assets.view') || perms.includes('licenses.view');
    if (!isIT && !hasITPerm) {
      return false;
    }
  }

  // Permission code check
  if (matched.permission) {
    if (!perms.includes(matched.permission)) {
      return false;
    }
  }

  return true;
}

export function getDefaultRedirectForUser(
  user: { roleName?: string; role?: string; permissions?: string[] } | null | undefined
): string {
  if (!user) return '/login';

  const normRole = (user.roleName || user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  const perms = Array.isArray(user.permissions) ? user.permissions : [];

  // Admin, SuperAdmin, ITAdmin, ITStaff direct to Asset Management Dashboard
  if (
    normRole === 'superadmin' ||
    normRole === 'super_admin' ||
    normRole.includes('itadmin') ||
    normRole.includes('itstaff') ||
    perms.includes('*')
  ) {
    return '/dashboard/assets/overview';
  }

  // Prioritize HR / Attendance role
  if (
    normRole.includes('hr') ||
    normRole.includes('attendance') ||
    perms.includes('attendance.view')
  ) {
    return '/dashboard/attendance/overview';
  }

  // Management workspace
  if (normRole === 'management') {
    return '/dashboard/management/overview';
  }

  // Employee workspace
  if (normRole === 'employee') {
    return '/dashboard/employee/overview';
  }

  // IT Asset role
  if (perms.includes('assets.view')) {
    return '/dashboard/assets/overview';
  }

  // Helpdesk Ticket role
  if (perms.includes('tickets.view')) {
    return '/dashboard/tickets';
  }

  // Licenses role
  if (perms.includes('licenses.view')) {
    return '/dashboard/licenses';
  }

  // Server Infrastructure role
  if (perms.includes('infrastructure.view')) {
    return '/dashboard/infrastructure';
  }

  // Access control role
  if (perms.includes('access.users.view') || normRole === 'admin') {
    return '/dashboard/access';
  }

  // Master view fallback
  if (perms.includes('master.view')) {
    return '/dashboard/master/departments';
  }

  return '/dashboard/welcome';
}

export function getDashboardHrefForUser(
  user: { roleName?: string; role?: string; permissions?: string[] } | null | undefined
): string {
  return getDefaultRedirectForUser(user);
}
