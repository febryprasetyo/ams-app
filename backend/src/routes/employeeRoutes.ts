import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Protect all employee routes with authentication
router.use(authenticateToken);

const adminOnly = requireRoles('SuperAdmin', 'ITAdmin');

// --- Employee Routes ---
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', adminOnly, createEmployee);
router.put('/:id', adminOnly, updateEmployee);
router.delete('/:id', adminOnly, deleteEmployee);

export default router;
