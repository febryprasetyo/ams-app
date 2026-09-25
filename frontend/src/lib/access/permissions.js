export function checkUserPermission(user, permissionCode) {
  if (!user) return false;

  const normRole = (user.roleName || user.role || '').toLowerCase().replace(/_/g, '');
  if (normRole === 'superadmin') {
    return true;
  }

  if (!Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.includes(permissionCode);
}
