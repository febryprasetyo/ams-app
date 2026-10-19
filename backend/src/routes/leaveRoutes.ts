import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import {
  getActiveEmployeesForLeaves,
  getLeaveBalanceSummary,
  calculateWorkingDays,
  createLeaveRequest,
  getLeaveRequestById,
  getLeaveRequests,
  approveLeaveRequest,
  deleteLeaveRequestDraft,
  getHolidays,
  getAnnualLeaveConfig,
  saveAnnualLeaveConfig,
  getMasterLeaveBalances,
  updateEmployeeLeaveBalance,
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
router.patch(
  '/requests/:id/approve',
  authenticateToken,
  requirePermission(['attendance.manage']),
  approveLeaveRequest
);
router.delete(
  '/requests/:id',
  authenticateToken,
  requirePermission(['attendance.manage']),
  deleteLeaveRequestDraft
);

// Endpoint Master Cuti, Pengaturan Cuti Bersama & Rekap Saldo
router.get(
  '/master/config',
  authenticateToken,
  requirePermission(['attendance.view', 'attendance.manage']),
  getAnnualLeaveConfig
);

router.post(
  '/master/config',
  authenticateToken,
  requirePermission(['attendance.manage']),
  saveAnnualLeaveConfig
);

router.get(
  '/master/balances',
  authenticateToken,
  requirePermission(['attendance.view', 'attendance.manage']),
  getMasterLeaveBalances
);

router.put(
  '/master/balances/:id',
  authenticateToken,
  requirePermission(['attendance.manage']),
  updateEmployeeLeaveBalance
);

export default router;
