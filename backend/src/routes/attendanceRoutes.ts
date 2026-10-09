import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import {
  getAttendanceRecords,
  getAttendanceBatches,
  commitAttendanceBatch,
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

// Commit batch import operation
router.post(
  '/commit-batch',
  authenticateToken,
  requirePermission(['attendance.import', 'attendance.manage']),
  commitAttendanceBatch
);

export default router;
