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
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Protect all asset routes with authentication
router.use(authenticateToken);

const adminOnly = requireRoles('SuperAdmin', 'ITAdmin');

// --- Asset Categories ---
router.get('/categories', getCategories);
router.post('/categories', adminOnly, createCategory);

// --- Asset Inventory ---
router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/', adminOnly, createAsset);
router.put('/:id', adminOnly, updateAsset);
router.delete('/:id', adminOnly, deleteAsset);

export default router;
