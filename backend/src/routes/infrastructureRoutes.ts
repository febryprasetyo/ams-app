import { Router } from 'express';
import {
  syncAccurateLicenses,
  getAccurateLicenses,
  getServers,
  getDbBackups,
} from '../controllers/infrastructureController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all infrastructure routes with authentication middleware
router.use(authenticateToken);

router.post('/accurate/sync', syncAccurateLicenses);
router.get('/accurate', getAccurateLicenses);
router.get('/servers', getServers);
router.get('/backups', getDbBackups);

export default router;
