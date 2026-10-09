import type { EmployeeItem } from './employeeTypes';

export function filterEmployees<T extends Pick<EmployeeItem, 'employeeCode' | 'departmentId' | 'status'> & { fullName?: string | null }>(
  employees: T[],
  input: {
    tab: 'active' | 'archive';
    employeeIdQuery?: string;
    searchQuery?: string;
    departmentId: string;
    archiveStatus?: 'Inactive' | 'Resigned';
  }
): T[] {
  const query = (input.searchQuery ?? input.employeeIdQuery ?? '').trim().toLowerCase();
  const queryTokens = query ? query.split(/\s+/).filter(Boolean) : [];

  return employees.filter(employee => {
    const lifecycle = (employee.status || 'Active').toLowerCase();
    const inTab = input.tab === 'active' ? lifecycle === 'active' : lifecycle === 'inactive' || lifecycle === 'resigned';
    const code = (employee.employeeCode || '').toLowerCase();
    const name = (employee.fullName || '').toLowerCase();

    const matchesQuery = queryTokens.length === 0 || queryTokens.every(token =>
      code.includes(token) || name.includes(token)
    );

    const matchesDepartment = !input.departmentId || String(employee.departmentId) === input.departmentId;
    const matchesArchiveStatus = !input.archiveStatus || lifecycle === input.archiveStatus.toLowerCase();
    return inTab && matchesQuery && matchesDepartment && matchesArchiveStatus;
  });
}
