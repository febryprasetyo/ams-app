import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Protect all employee routes with authentication
router.use(authenticateToken);

const viewMaster = requirePermission('master.view');
const manageMaster = requirePermission('master.manage');

// --- Employee Routes ---
router.get('/', viewMaster, getEmployees);
router.get('/:id', viewMaster, getEmployeeById);
router.post('/', manageMaster, createEmployee);
router.put('/:id', manageMaster, updateEmployee);
router.delete('/:id', manageMaster, deleteEmployee);

export default router;
