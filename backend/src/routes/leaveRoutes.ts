import { Router } from 'express';
import {
  getLeaveBalanceSummary,
  calculateWorkingDays,
  createLeaveRequest,
  getLeaveRequestById,
  getLeaveRequests,
  getHolidays,
} from '../controllers/leaveController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Endpoint publik / helper perhitungan (bisa dipanggil saat preview kalkulasi)
router.get('/balance-summary', getLeaveBalanceSummary);
router.post('/calculate-days', calculateWorkingDays);
router.get('/holidays', getHolidays);

// Endpoint form & dokumen
router.post('/requests', createLeaveRequest);
router.get('/requests', getLeaveRequests);
router.get('/requests/:id', getLeaveRequestById);

export default router;
