import { Response } from 'express';
import { AuthenticatedRequest, getUserPermissions } from '../middleware/auth';
import { db } from '../db';
import { users, roles } from '../db/schema/users';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = loginSchema.parse(req.body);
    
    const userResult = await db.select()
      .from(users)
      .where(eq(users.email, parsed.email))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult[0];

    // Case-insensitive status check
    const normalizedStatus = (user.status || '').toLowerCase();
    if (normalizedStatus !== 'active') {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let userRoleId = user.roleId;
    if (!userRoleId && user.role) {
      const norm = user.role.toLowerCase().replace(/_/g, '');
      const matched = await db
        .select({ id: roles.id })
        .from(roles)
        .where(or(eq(roles.name, user.role), eq(roles.code, norm)))
        .limit(1);
      if (matched.length > 0) {
        userRoleId = matched[0].id;
        await db.update(users).set({ roleId: userRoleId }).where(eq(users.id, user.id));
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: userRoleId ?? 0,
      roleName: user.role,
    });

    const userPermissions = await getUserPermissions(userRoleId ?? undefined, user.role);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.username,
        roleId: userRoleId ?? undefined,
        roleName: user.role,
        permissions: userPermissions,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues || err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userPermissions = await getUserPermissions(req.user.roleId, req.user.roleName);
  return res.status(200).json({
    user: {
      ...req.user,
      permissions: userPermissions,
    },
  });
}
