import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import {
  getAttendanceRecords,
  getAttendanceBatches,
  commitAttendanceBatch,
  saveAttendanceRecord,
  getAttendanceActivity,
} from '../controllers/attendanceController';

const router = Router();

// Read operations
router.get(
  '/records',
  authenticateToken,
  requirePermission(['attendance.view', 'attendance.manage', 'attendance.import']),
  getAttendanceRecords
);

router.get(
  '/batches',
  authenticateToken,
  requirePermission(['attendance.view', 'attendance.manage', 'attendance.import']),
  getAttendanceBatches
);

router.get(
  '/activity',
  authenticateToken,
  requirePermission(['attendance.view', 'attendance.manage', 'attendance.import']),
  getAttendanceActivity
);

router.put(
  '/records',
  authenticateToken,
  requirePermission(['attendance.manage']),
  saveAttendanceRecord
);

// Commit batch import operation
router.post(
  '/commit-batch',
  authenticateToken,
  requirePermission(['attendance.import', 'attendance.manage']),
  commitAttendanceBatch
);

export default router;
