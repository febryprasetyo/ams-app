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
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all software license routes with authentication
router.use(authenticateToken);

router.get('/', getLicenses);
router.get('/:id', getLicenseById);
router.post('/', createLicense);
router.put('/:id', updateLicense);
router.delete('/:id', deleteLicense);
router.post('/:id/allocate', allocateLicenseSeat);
router.post('/:id/revoke', revokeLicenseSeat);

export default router;
