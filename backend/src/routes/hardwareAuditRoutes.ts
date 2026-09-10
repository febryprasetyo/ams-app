import { Router, Request, Response, NextFunction } from 'express';
import {
  ingestHardwareAudit,
  batchSyncHardwareAudits,
  listHardwareAudits,
  linkHardwareAudit,
  createAssetFromHardwareAudit,
  deleteHardwareAuditRecord,
  clearSyncedHardwareAuditsRecord,
} from '../controllers/hardwareAuditController';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { createAgentAuthenticator } from '../middleware/agentAuth';
import { loadEnv } from '../config/env';

const router = Router();
let agentAuthMiddleware: any = null;

function getAgentAuth() {
  if (!agentAuthMiddleware) {
    try {
      const env = loadEnv();
      agentAuthMiddleware = createAgentAuthenticator(env.agentApiKey);
    } catch {
      agentAuthMiddleware = (_req: Request, res: Response) => {
        res.status(500).json({ error: 'AGENT_API_KEY is not configured on server' });
      };
    }
  }
  return agentAuthMiddleware;
}

function agentOrUserAuth(req: Request, res: Response, next: NextFunction) {
  if (req.header('X-Agent-Key')) {
    return getAgentAuth()(req, res, next);
  }
  return authenticateToken(req as any, res, next);
}

// Ingestion endpoints (Agent tool or Web UI)
router.post('/ingest', agentOrUserAuth, ingestHardwareAudit);
router.post('/batch-sync', agentOrUserAuth, batchSyncHardwareAudits);

// Management & Reconciliation endpoints (Web UI for IT staff/admins)
const itStaffRoles = requireRoles('SuperAdmin', 'ITAdmin', 'ITStaff');
const itAdminOnly = requireRoles('SuperAdmin', 'ITAdmin');

router.get('/', authenticateToken, itStaffRoles, listHardwareAudits);
router.post('/:id/link', authenticateToken, itAdminOnly, linkHardwareAudit);
router.post('/:id/create-asset', authenticateToken, itAdminOnly, createAssetFromHardwareAudit);
router.delete('/clear-synced', authenticateToken, itAdminOnly, clearSyncedHardwareAuditsRecord);
router.delete('/:id', authenticateToken, itAdminOnly, deleteHardwareAuditRecord);

export default router;
