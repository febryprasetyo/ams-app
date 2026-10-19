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
  updateLeaveRequest,
  getHolidays,
  getAnnualLeaveConfig,
  saveAnnualLeaveConfig,
  getMasterLeaveBalances,
  updateEmployeeLeaveBalance,
} from '../controllers/leaveController';

const router = Router();

// Middleware autentikasi global untuk semua route cuti
router.use(authenticateToken);

// Endpoint daftar karyawan untuk form cuti (baca)
router.get(
  '/employees',
  requirePermission(['attendance.view', 'attendance.manage']),
  getActiveEmployeesForLeaves
);

// Endpoint perhitungan & kalender libur (baca / calculate)
router.get(
  '/balance-summary',
  requirePermission(['attendance.view', 'attendance.manage']),
  getLeaveBalanceSummary
);
router.post(
  '/calculate-days',
  requirePermission(['attendance.view', 'attendance.manage']),
  calculateWorkingDays
);
router.get(
  '/holidays',
  requirePermission(['attendance.view', 'attendance.manage']),
  getHolidays
);

// Endpoint form & dokumen (baca & mutasi)
router.get(
  '/requests',
  requirePermission(['attendance.view', 'attendance.manage']),
  getLeaveRequests
);
router.get(
  '/requests/:id',
  requirePermission(['attendance.view', 'attendance.manage']),
  getLeaveRequestById
);
router.post(
  '/requests',
  requirePermission(['attendance.manage']),
  createLeaveRequest
);
router.put(
  '/requests/:id',
  requirePermission(['attendance.manage']),
  updateLeaveRequest
);
router.patch(
  '/requests/:id/approve',
  requirePermission(['attendance.manage']),
  approveLeaveRequest
);
router.delete(
  '/requests/:id',
  requirePermission(['attendance.manage']),
  deleteLeaveRequestDraft
);

// Endpoint Master Cuti, Pengaturan Cuti Bersama & Rekap Saldo
router.get(
  '/master/config',
  requirePermission(['attendance.view', 'attendance.manage']),
  getAnnualLeaveConfig
);
router.post(
  '/master/config',
  requirePermission(['attendance.manage']),
  saveAnnualLeaveConfig
);
router.get(
  '/master/balances',
  requirePermission(['attendance.view', 'attendance.manage']),
  getMasterLeaveBalances
);
router.put(
  '/master/balances/:id',
  requirePermission(['attendance.manage']),
  updateEmployeeLeaveBalance
);

export default router;
