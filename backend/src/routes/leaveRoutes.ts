import { Router } from 'express';
import {
  getActiveEmployeesForLeaves,
  getLeaveBalanceSummary,
  calculateWorkingDays,
  createLeaveRequest,
  getLeaveRequestById,
  getLeaveRequests,
  getHolidays,
} from '../controllers/leaveController';

const router = Router();

// Endpoint daftar karyawan untuk form cuti
router.get('/employees', getActiveEmployeesForLeaves);

// Endpoint perhitungan & kalender libur
router.get('/balance-summary', getLeaveBalanceSummary);
router.post('/calculate-days', calculateWorkingDays);
router.get('/holidays', getHolidays);

// Endpoint form & dokumen
router.post('/requests', createLeaveRequest);
router.get('/requests', getLeaveRequests);
router.get('/requests/:id', getLeaveRequestById);

export default router;
