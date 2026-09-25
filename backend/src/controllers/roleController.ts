import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';
import { roles, permissions, rolePermissions, users } from '../db/schema/users';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

const createRoleSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/, 'Code must be lowercase alphanumeric and underscore'),
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
});

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.number()),
});

export async function getRoles(req: AuthenticatedRequest, res: Response) {
  try {
    const allRoles = await db.select().from(roles).orderBy(roles.id);
    const allRolePerms = await db.select().from(rolePermissions);

    const rolesWithPerms = allRoles.map((role) => {
      const assignedPermIds = allRolePerms
        .filter((rp) => rp.roleId === role.id)
        .map((rp) => rp.permissionId);
      return {
        ...role,
        permissionIds: assignedPermIds,
        permissionCount: assignedPermIds.length,
      };
    });

    return res.status(200).json({ roles: rolesWithPerms });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function getPermissionsCatalog(req: AuthenticatedRequest, res: Response) {
  try {
    const allPerms = await db.select().from(permissions).orderBy(permissions.module, permissions.id);

    // Group by module
    const moduleMap = new Map<string, typeof allPerms>();
    for (const p of allPerms) {
      if (!moduleMap.has(p.module)) {
        moduleMap.set(p.module, []);
      }
      moduleMap.get(p.module)!.push(p);
    }

    const modules = Array.from(moduleMap.entries()).map(([module, perms]) => ({
      module,
      permissions: perms,
    }));

    return res.status(200).json({
      permissions: allPerms,
      modules,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function createRole(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = createRoleSchema.parse(req.body);

    const existingCode = await db.select().from(roles).where(eq(roles.code, parsed.code)).limit(1);
    if (existingCode.length > 0) {
      return res.status(400).json({ error: `Role with code '${parsed.code}' already exists` });
    }

    const existingName = await db.select().from(roles).where(eq(roles.name, parsed.name)).limit(1);
    if (existingName.length > 0) {
      return res.status(400).json({ error: `Role with name '${parsed.name}' already exists` });
    }

    const [inserted] = await db
      .insert(roles)
      .values({
        code: parsed.code,
        name: parsed.name,
        description: parsed.description || null,
        isSystem: false,
      })
      .returning();

    return res.status(201).json({ message: 'Role created successfully', role: inserted });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function updateRole(req: AuthenticatedRequest, res: Response) {
  try {
    const roleId = Number(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const parsed = updateRoleSchema.parse(req.body);

    const existing = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const [updated] = await db
      .update(roles)
      .set({
        name: parsed.name,
        description: parsed.description || null,
      })
      .where(eq(roles.id, roleId))
      .returning();

    return res.status(200).json({ message: 'Role updated successfully', role: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function deleteRole(req: AuthenticatedRequest, res: Response) {
  try {
    const roleId = Number(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const targetRole = (await db.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0];
    if (!targetRole) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (targetRole.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system role' });
    }

    // Check if any user references this role
    const assignedUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.roleId, roleId))
      .limit(1);

    if (assignedUsers.length > 0) {
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }

    await db.delete(roles).where(eq(roles.id, roleId));
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function updateRolePermissions(req: AuthenticatedRequest, res: Response) {
  try {
    const roleId = Number(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const targetRole = (await db.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0];
    if (!targetRole) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const parsed = updatePermissionsSchema.parse(req.body);

    await db.transaction(async (tx) => {
      // 1. Delete all existing permissions for role
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      // 2. Insert new permissions if any
      if (parsed.permissionIds.length > 0) {
        const rowsToInsert = parsed.permissionIds.map((pId) => ({
          roleId,
          permissionId: pId,
        }));
        await tx.insert(rolePermissions).values(rowsToInsert);
      }
    });

    return res.status(200).json({
      message: 'Role permissions updated successfully',
      roleId,
      assignedCount: parsed.permissionIds.length,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
