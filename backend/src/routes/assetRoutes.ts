import { Router } from 'express';
import multer from 'multer';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../controllers/assetController';
import {
  downloadAssetImportTemplate,
  previewAssetImport,
  commitAssetImportUpload,
} from '../controllers/assetImportController';
import {
  assignAsset,
  unassignAsset,
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

const uploadXlsx = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      return callback(new Error('Only .xlsx files are supported'));
    }
    callback(null, true);
  },
});

// --- Asset Categories ---
router.get('/categories', getCategories);
router.post('/categories', adminOnly, createCategory);
router.put('/categories/:id', adminOnly, updateCategory);
router.delete('/categories/:id', adminOnly, deleteCategory);

// --- Asset Import (must be registered before /:id) ---
router.get('/import/template', adminOnly, downloadAssetImportTemplate);
router.post('/import/preview', adminOnly, uploadXlsx.single('file'), previewAssetImport);
router.post('/import/commit', adminOnly, uploadXlsx.single('file'), commitAssetImportUpload);

// --- Asset Inventory ---
router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/', adminOnly, createAsset);
router.put('/:id', adminOnly, updateAsset);
router.delete('/:id', adminOnly, deleteAsset);

// --- Asset Lifecycle, Maintenance & History ---
router.post('/:id/assign', lifecycleRoles, assignAsset);
router.post('/:id/unassign', lifecycleRoles, unassignAsset);
router.post('/:id/maintenance', lifecycleRoles, logMaintenance);
router.post('/:id/dispose', lifecycleRoles, disposeAsset);
router.get('/:id/history', lifecycleRoles, getAssetHistory);

export default router;
