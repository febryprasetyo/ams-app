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

const viewEmployee = requirePermission(['master.view', 'attendance.view']);
const manageEmployee = requirePermission(['master.manage', 'attendance.manage', 'attendance.import']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// --- Employee Import & Export Routes (Must be registered before /:id) ---
router.get('/import/template', viewEmployee, downloadEmployeeTemplate);
router.post('/import/preview', manageEmployee, upload.single('file'), previewEmployeeImport);
router.post('/import/commit', manageEmployee, upload.single('file'), commitEmployeeImport);
router.get('/export', viewEmployee, exportEmployeesToExcel);

// --- Employee CRUD Routes ---
router.get('/', viewEmployee, getEmployees);
router.get('/:id', viewEmployee, getEmployeeById);
router.post('/', manageEmployee, createEmployee);
router.put('/:id', manageEmployee, updateEmployee);
router.delete('/:id', manageEmployee, deleteEmployee);

export default router;
