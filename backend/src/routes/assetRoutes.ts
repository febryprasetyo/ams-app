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
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Protect all asset routes with authentication
router.use(authenticateToken);

const viewAssets = requirePermission('assets.view');
const createAssets = requirePermission('assets.create');
const editAssets = requirePermission('assets.edit');
const deleteAssets = requirePermission('assets.delete');
const assignAssets = requirePermission('assets.assign');

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
router.get('/categories', viewAssets, getCategories);
router.post('/categories', createAssets, createCategory);
router.put('/categories/:id', editAssets, updateCategory);
router.delete('/categories/:id', deleteAssets, deleteCategory);

// --- Asset Import (must be registered before /:id) ---
router.get('/import/template', createAssets, downloadAssetImportTemplate);
router.post('/import/preview', createAssets, uploadXlsx.single('file'), previewAssetImport);
router.post('/import/commit', createAssets, uploadXlsx.single('file'), commitAssetImportUpload);

// --- Asset Inventory ---
router.get('/', viewAssets, getAssets);
router.get('/:id', viewAssets, getAssetById);
router.post('/', createAssets, createAsset);
router.put('/:id', editAssets, updateAsset);
router.delete('/:id', deleteAssets, deleteAsset);

// --- Asset Lifecycle, Maintenance & History ---
router.post('/:id/assign', assignAssets, assignAsset);
router.post('/:id/unassign', assignAssets, unassignAsset);
router.post('/:id/maintenance', editAssets, logMaintenance);
router.post('/:id/dispose', deleteAssets, disposeAsset);
router.get('/:id/history', viewAssets, getAssetHistory);

export default router;
