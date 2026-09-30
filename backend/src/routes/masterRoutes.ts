import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../controllers/masterController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Protect all master data routes with authentication
router.use(authenticateToken);

const viewMaster = requirePermission('master.view');
const manageMaster = requirePermission('master.manage');

// --- Departments ---
router.get('/departments', viewMaster, getDepartments);
router.post('/departments', manageMaster, createDepartment);
router.put('/departments/:id', manageMaster, updateDepartment);
router.delete('/departments/:id', manageMaster, deleteDepartment);

// --- Locations ---
router.get('/locations', viewMaster, getLocations);
router.post('/locations', manageMaster, createLocation);
router.put('/locations/:id', manageMaster, updateLocation);
router.delete('/locations/:id', manageMaster, deleteLocation);

// --- Vendors ---
router.get('/vendors', viewMaster, getVendors);
router.post('/vendors', manageMaster, createVendor);
router.put('/vendors/:id', manageMaster, updateVendor);
router.delete('/vendors/:id', manageMaster, deleteVendor);

export default router;
