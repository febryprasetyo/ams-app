import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { db } from '../db';
import { roles, permissions, rolePermissions } from '../db/schema/users';
import { eq, and } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function getUserPermissions(roleId?: number, roleName?: string): Promise<string[]> {
  const normRole = (roleName || '').toLowerCase().replace(/_/g, '');
  if (normRole === 'superadmin') {
    const allPerms = await db.select({ code: permissions.code }).from(permissions);
    return allPerms.map((p) => p.code);
  }

  if (!roleId) return [];

  const rows = await db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  return rows.map((r) => r.code);
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Access token missing' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoleNormalized = (req.user.roleName || '').toLowerCase().replace(/_/g, '');
    const isAllowed = allowedRoles.some((role) => {
      const allowedRoleNormalized = role.toLowerCase().replace(/_/g, '');
      return userRoleNormalized === allowedRoleNormalized;
    });

    if (allowedRoles.length > 0 && !isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
}

export function requirePermission(permissionCode: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const normRole = (req.user.roleName || '').toLowerCase().replace(/_/g, '');
    if (normRole === 'superadmin') {
      return next();
    }

    if (!req.user.roleId) {
      return res.status(403).json({ error: 'Forbidden: Missing permission ' + permissionCode });
    }

    try {
      const match = await db
        .select({ id: rolePermissions.permissionId })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(rolePermissions.roleId, req.user.roleId),
            eq(permissions.code, permissionCode)
          )
        )
        .limit(1);

      if (match.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Missing permission ' + permissionCode });
      }

      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
}
