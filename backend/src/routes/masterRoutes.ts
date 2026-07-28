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
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Protect all master data routes with authentication
router.use(authenticateToken);

const adminOnly = requireRoles('SuperAdmin', 'ITAdmin');

// --- Departments ---
router.get('/departments', getDepartments);
router.post('/departments', adminOnly, createDepartment);
router.put('/departments/:id', adminOnly, updateDepartment);
router.delete('/departments/:id', adminOnly, deleteDepartment);

// --- Locations ---
router.get('/locations', getLocations);
router.post('/locations', adminOnly, createLocation);
router.put('/locations/:id', adminOnly, updateLocation);
router.delete('/locations/:id', adminOnly, deleteLocation);

// --- Vendors ---
router.get('/vendors', getVendors);
router.post('/vendors', adminOnly, createVendor);
router.put('/vendors/:id', adminOnly, updateVendor);
router.delete('/vendors/:id', adminOnly, deleteVendor);

export default router;
