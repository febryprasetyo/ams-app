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
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post(
  '/agent/signal',
  createAgentAuthenticator(loadEnv().agentApiKey),
  receiveAccurateAgentSignal,
);

router.use(authenticateToken);

router.post('/accurate/sync', syncAccurateLicenses);
router.get('/accurate', getAccurateLicenses);
router.get('/accurate/database', getAccurateDatabase);
router.get('/servers', getServers);
router.get('/backups', getDbBackups);

export default router;
