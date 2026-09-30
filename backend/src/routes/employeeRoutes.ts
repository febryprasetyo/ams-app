import { Router } from 'express';
import multer from 'multer';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController';
import {
  downloadEmployeeTemplate,
  previewEmployeeImport,
  commitEmployeeImport,
} from '../controllers/employeeImportController';
import { exportEmployeesToExcel } from '../controllers/employeeExportController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Protect all employee routes with authentication
router.use(authenticateToken);

const viewMaster = requirePermission('master.view');
const manageMaster = requirePermission('master.manage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// --- Employee Import & Export Routes (Must be registered before /:id) ---
router.get('/import/template', viewMaster, downloadEmployeeTemplate);
router.post('/import/preview', manageMaster, upload.single('file'), previewEmployeeImport);
router.post('/import/commit', manageMaster, upload.single('file'), commitEmployeeImport);
router.get('/export', viewMaster, exportEmployeesToExcel);

// --- Employee CRUD Routes ---
router.get('/', viewMaster, getEmployees);
router.get('/:id', viewMaster, getEmployeeById);
router.post('/', manageMaster, createEmployee);
router.put('/:id', manageMaster, updateEmployee);
router.delete('/:id', manageMaster, deleteEmployee);

export default router;
