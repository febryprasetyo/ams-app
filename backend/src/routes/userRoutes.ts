import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
  deleteUser,
} from '../controllers/userController';

const router = Router();

router.get('/', authenticateToken, requirePermission('access.users.view'), getUsers);
router.post('/', authenticateToken, requirePermission('access.users.manage'), createUser);
router.put('/:id', authenticateToken, requirePermission('access.users.manage'), updateUser);
router.patch('/:id/status', authenticateToken, requirePermission('access.users.manage'), toggleUserStatus);
router.post('/:id/reset-password', authenticateToken, requirePermission('access.users.manage'), resetPassword);
router.delete('/:id', authenticateToken, requirePermission('access.users.manage'), deleteUser);

export default router;
