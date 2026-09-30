import { Router } from 'express';
import { loadEnv } from '../config/env';
import {
  getAccurateDatabase,
  getAccurateLicenses,
  getDbBackups,
  getServers,
  receiveAccurateAgentSignal,
  syncAccurateLicenses,
} from '../controllers/infrastructureController';
import { createAgentAuthenticator } from '../middleware/agentAuth';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.post(
  '/agent/signal',
  createAgentAuthenticator(loadEnv().agentApiKey),
  receiveAccurateAgentSignal,
);

router.use(authenticateToken);

const viewInfra = requirePermission('infrastructure.view');
const manageInfra = requirePermission('infrastructure.manage');

router.post('/accurate/sync', manageInfra, syncAccurateLicenses);
router.get('/accurate', viewInfra, getAccurateLicenses);
router.get('/accurate/database', viewInfra, getAccurateDatabase);
router.get('/servers', viewInfra, getServers);
router.get('/backups', viewInfra, getDbBackups);

export default router;
