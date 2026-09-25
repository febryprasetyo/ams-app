import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import {
  getRoles,
  getPermissionsCatalog,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
} from '../controllers/roleController';

const router = Router();

const roleAuth = [authenticateToken, requirePermission('access.roles.manage')];

router.get('/permissions', ...roleAuth, getPermissionsCatalog);
router.get('/', ...roleAuth, getRoles);
router.post('/', ...roleAuth, createRole);
router.put('/:id', ...roleAuth, updateRole);
router.delete('/:id', ...roleAuth, deleteRole);
router.put('/:id/permissions', ...roleAuth, updateRolePermissions);

export default router;
