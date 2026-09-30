import { Router } from 'express';
import {
  getLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  deleteLicense,
  allocateLicenseSeat,
  revokeLicenseSeat,
} from '../controllers/licenseController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Protect all software license routes with authentication
router.use(authenticateToken);

const viewLicenses = requirePermission('licenses.view');
const manageLicenses = requirePermission('licenses.manage');

router.get('/', viewLicenses, getLicenses);
router.get('/:id', viewLicenses, getLicenseById);
router.post('/', manageLicenses, createLicense);
router.put('/:id', manageLicenses, updateLicense);
router.delete('/:id', manageLicenses, deleteLicense);
router.post('/:id/allocate', manageLicenses, allocateLicenseSeat);
router.post('/:id/revoke', manageLicenses, revokeLicenseSeat);

export default router;
