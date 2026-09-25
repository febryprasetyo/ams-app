import { User } from '@/context/AuthContext';

export function checkUserPermission(user: User | null | undefined, permissionCode: string): boolean {
  if (!user) return false;

  const normRole = (user.roleName || (user as any).role || '').toLowerCase().replace(/_/g, '');
  if (normRole === 'superadmin') {
    return true;
  }

  if (!Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.includes(permissionCode);
}
