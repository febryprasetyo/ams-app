import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import {
  getSystemSetting,
  getAllSystemSettings,
  setSystemSetting,
} from '../controllers/systemSettingController';

const router = Router();

// Reading system settings: any authenticated user
router.get('/:key', authenticateToken, getSystemSetting);
router.get('/', authenticateToken, getAllSystemSettings);

// Updating system settings: requires admin / management permissions
router.put(
  '/:key',
  authenticateToken,
  requirePermission(['attendance.manage', 'master.manage', 'access.users.manage']),
  setSystemSetting
);

export default router;
