import { Router } from 'express';
import {
  getCategories,
  createCategory,
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../controllers/assetController';
import {
  assignAsset,
  logMaintenance,
  disposeAsset,
  getAssetHistory,
} from '../controllers/assetLifecycleController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Protect all asset routes with authentication
router.use(authenticateToken);

const adminOnly = requireRoles('SuperAdmin', 'ITAdmin');
const lifecycleRoles = requireRoles('SuperAdmin', 'ITAdmin', 'ITStaff');

// --- Asset Categories ---
router.get('/categories', getCategories);
router.post('/categories', adminOnly, createCategory);

// --- Asset Inventory ---
router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/', adminOnly, createAsset);
router.put('/:id', adminOnly, updateAsset);
router.delete('/:id', adminOnly, deleteAsset);

// --- Asset Lifecycle, Maintenance & History ---
router.post('/:id/assign', lifecycleRoles, assignAsset);
router.post('/:id/maintenance', lifecycleRoles, logMaintenance);
router.post('/:id/dispose', lifecycleRoles, disposeAsset);
router.get('/:id/history', lifecycleRoles, getAssetHistory);

export default router;
