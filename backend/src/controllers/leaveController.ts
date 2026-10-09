import { Request, Response } from 'express';
import { z } from 'zod';
import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import { employees } from '../db/schema/employees';
import { departments } from '../db/schema/master';
import {
  leaveHolidayCalendars,
  leaveBalances,
  leaveRequests,
  leaveApprovals,
} from '../db/schema/leaves';
import {
  calculateLeaveWorkingDays,
  calculateLeaveBalances,
  formatLeaveRequestNumber,
} from '../domain/leaveCalculation';

// Zod schemas
const calculateDaysSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  employeeId: z.coerce.number().positive().optional(),
});

const createLeaveRequestSchema = z.object({
  employeeId: z.coerce.number().positive(),
  leaveType: z.enum(['ANNUAL', 'SPECIAL']),
  specialLeaveReason: z.string().max(100).optional().nullable(),
  reason: z.string().min(1, 'Alasan cuti wajib diisi').max(500),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  handoverToEmployeeId: z.coerce.number().positive().optional().nullable(),
  handoverTask: z.string().max(1000).optional().nullable(),
  emergencyPhone: z.string().max(50).optional().nullable(),
});

// Helper: ambil profil ringkas karyawan
async function getEmployeeProfile(empId: number) {
  const [emp] = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      fullName: employees.fullName,
      position: employees.position,
      joinDate: employees.joinDate,
      departmentId: employees.departmentId,
      departmentName: departments.name,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(employees.id, empId));

  return emp || null;
}

// 1. GET /balance-summary
export async function getLeaveBalanceSummary(req: Request, res: Response) {
  try {
    const employeeId = Number(req.query.employeeId);
    const year = Number(req.query.year) || new Date().getUTCFullYear();

    if (!employeeId || isNaN(employeeId)) {
      return res.status(400).json({ error: 'employeeId query parameter is required' });
    }

    const employee = await getEmployeeProfile(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }

    // Ambil hari libur / cuti bersama tahun berjalan
    const holidays = await db
      .select()
      .from(leaveHolidayCalendars)
      .where(eq(leaveHolidayCalendars.year, year));

    // Cuti bersama yang memotong kuota tahunan
    const collectiveLeaves = holidays.filter((h) => h.isCollectiveLeave);
    const collectiveLeaveDays = collectiveLeaves.length;

    // Ambil atau buat record saldo cuti karyawan untuk tahun bersangkutan
    let [balance] = await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));

    if (!balance) {
      const [inserted] = await db
        .insert(leaveBalances)
        .values({
          employeeId,
          year,
          baseQuota: 12,
          collectiveLeaveDeduction: collectiveLeaveDays,
          usedQuota: 0,
          carriedOverQuota: 0,
        })
        .returning();
      balance = inserted;
    } else if (balance.collectiveLeaveDeduction !== collectiveLeaveDays) {
      // Perbarui jika kalender cuti bersama telah diperbarui oleh HR
      const [updated] = await db
        .update(leaveBalances)
        .set({ collectiveLeaveDeduction: collectiveLeaveDays, updatedAt: new Date() })
        .where(eq(leaveBalances.id, balance.id))
        .returning();
      balance = updated;
    }

    // Ambil histori cuti yang sudah diambil sebelumnya (maks 5 item sesuai slot format F4)
    const approvedRequests = await db
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.employeeId, employeeId),
          eq(leaveRequests.balanceYear, year),
          eq(leaveRequests.status, 'APPROVED')
        )
      )
      .orderBy(desc(leaveRequests.startDate))
      .limit(5);

    // Bentuk daftar history items untuk dicetak di seksi Hak & Sisa Cuti
    // Sertakan rincian cuti bersama jika ada
    const historyItems: Array<{ no: number; description: string }> = [];
    
    // Gabungkan entri cuti bersama ke list jika relevan
    collectiveLeaves.slice(0, 2).forEach((cl, idx) => {
      historyItems.push({
        no: historyItems.length + 1,
        description: `1 = ${cl.description}`,
      });
    });

    approvedRequests.forEach((req) => {
      if (historyItems.length < 5) {
        historyItems.push({
          no: historyItems.length + 1,
          description: `${req.durationDays} = Cuti tahunan tgl ${req.startDate}`,
        });
      }
    });

    // Isi slot kosong hingga 5 item jika belum penuh
    while (historyItems.length < 5) {
      historyItems.push({
        no: historyItems.length + 1,
        description: '',
      });
    }

    const calc = calculateLeaveBalances({
      baseQuota: balance.baseQuota,
      collectiveLeaveDays: balance.collectiveLeaveDeduction,
      usedQuota: balance.usedQuota,
      carriedOverQuota: balance.carriedOverQuota,
      requestedDays: 0,
    });

    return res.status(200).json({
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        department: employee.departmentName || '-',
        position: employee.position || '-',
        joinDate: employee.joinDate || null,
      },
      year,
      baseQuota: balance.baseQuota,
      collectiveLeaveDays: balance.collectiveLeaveDeduction,
      cleanAnnualQuota: calc.cleanAnnualQuota,
      usedQuota: balance.usedQuota,
      availableBalance: calc.availableBefore,
      historyItems,
    });
  } catch (error) {
    console.error('Error getLeaveBalanceSummary:', error);
    return res.status(500).json({ error: 'Gagal mengambil ringkasan saldo cuti' });
  }
}

// 2. POST /calculate-days
export async function calculateWorkingDays(req: Request, res: Response) {
  try {
    const parsed = calculateDaysSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validasi gagal', details: parsed.error.issues });
    }

    const { startDate, endDate } = parsed.data;
    const startYear = Number(startDate.split('-')[0]);

    // Ambil hari libur & cuti bersama pada tahun tersebut
    const holidays = await db
      .select({ date: leaveHolidayCalendars.holidayDate })
      .from(leaveHolidayCalendars)
      .where(eq(leaveHolidayCalendars.year, startYear));

    const holidayDates = holidays.map((h) => h.date);

    const result = calculateLeaveWorkingDays({
      startDate,
      endDate,
      holidayDates,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error calculateWorkingDays:', error);
    return res.status(500).json({ error: 'Gagal menghitung hari kerja cuti' });
  }
}

// 3. POST /requests
export async function createLeaveRequest(req: Request, res: Response) {
  try {
    const parsed = createLeaveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validasi form tidak lengkap', details: parsed.error.issues });
    }

    const data = parsed.data;
    const employee = await getEmployeeProfile(data.employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Karyawan pemohon tidak ditemukan' });
    }

    const startYear = Number(data.startDate.split('-')[0]);

    // Ambil hari libur
    const holidays = await db
      .select()
      .from(leaveHolidayCalendars)
      .where(eq(leaveHolidayCalendars.year, startYear));
    const holidayDates = holidays.map((h) => h.holidayDate);

    // Hitung hari kerja efektif
    const daysCalc = calculateLeaveWorkingDays({
      startDate: data.startDate,
      endDate: data.endDate,
      holidayDates,
    });

    if (!daysCalc.isValid || daysCalc.durationDays <= 0) {
      return res.status(400).json({ error: 'Rentang tanggal tidak valid atau tidak memiliki hari kerja efektif' });
    }

    // Ambil saldo
    const collectiveLeaveDays = holidays.filter((h) => h.isCollectiveLeave).length;
    let [balance] = await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.employeeId, data.employeeId), eq(leaveBalances.year, startYear)));

    if (!balance) {
      const [inserted] = await db
        .insert(leaveBalances)
        .values({
          employeeId: data.employeeId,
          year: startYear,
          baseQuota: 12,
          collectiveLeaveDeduction: collectiveLeaveDays,
          usedQuota: 0,
        })
        .returning();
      balance = inserted;
    }

    const balanceCalc = calculateLeaveBalances({
      baseQuota: balance.baseQuota,
      collectiveLeaveDays: balance.collectiveLeaveDeduction,
      usedQuota: balance.usedQuota,
      carriedOverQuota: balance.carriedOverQuota,
      requestedDays: daysCalc.durationDays,
    });

    if (data.leaveType === 'ANNUAL' && !balanceCalc.hasSufficientBalance) {
      return res.status(400).json({
        error: `Saldo cuti tahunan tidak mencukupi. Sisa saldo: ${balanceCalc.availableBefore} hari, pengajuan: ${daysCalc.durationDays} hari.`,
      });
    }

    // Hitung sequence number untuk nomor permohonan
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leaveRequests);
    const seq = (countResult?.count || 0) + 1;
    const requestNumber = formatLeaveRequestNumber(new Date(), seq);

    // Database transaction
    const createdRequest = await db.transaction(async (tx) => {
      const [leaveReq] = await tx
        .insert(leaveRequests)
        .values({
          requestNumber,
          employeeId: data.employeeId,
          leaveType: data.leaveType,
          specialLeaveReason: data.specialLeaveReason || null,
          reason: data.reason,
          startDate: data.startDate,
          endDate: data.endDate,
          durationDays: daysCalc.durationDays,
          resumeWorkDate: daysCalc.resumeWorkDate,
          handoverToEmployeeId: data.handoverToEmployeeId || null,
          handoverTask: data.handoverTask || null,
          emergencyPhone: data.emergencyPhone || null,
          status: 'PENDING',
          balanceYear: startYear,
          snapshotBaseQuota: balance.baseQuota,
          snapshotCollectiveLeave: balance.collectiveLeaveDeduction,
          snapshotAvailableBefore: balanceCalc.availableBefore,
          snapshotRemainingAfter: data.leaveType === 'ANNUAL' ? balanceCalc.remainingAfter : balanceCalc.availableBefore,
        })
        .returning();

      // Jika cuti tahunan, potong kuota terpakai
      if (data.leaveType === 'ANNUAL') {
        await tx
          .update(leaveBalances)
          .set({
            usedQuota: balance.usedQuota + daysCalc.durationDays,
            updatedAt: new Date(),
          })
          .where(eq(leaveBalances.id, balance.id));
      }

      // Buat 4 tahap persetujuan (Pemohon langsung bertanda tangan)
      const todayStr = new Date().toISOString().split('T')[0];
      await tx.insert(leaveApprovals).values([
        {
          leaveRequestId: leaveReq.id,
          stage: 'APPLICANT',
          approverEmployeeId: employee.id,
          approverName: employee.fullName,
          status: 'APPROVED',
          signatureDate: todayStr,
        },
        {
          leaveRequestId: leaveReq.id,
          stage: 'DIRECT_SUPERVISOR',
          status: 'PENDING',
        },
        {
          leaveRequestId: leaveReq.id,
          stage: 'HRD',
          status: 'PENDING',
        },
        {
          leaveRequestId: leaveReq.id,
          stage: 'HIGHER_SUPERVISOR',
          status: 'PENDING',
        },
      ]);

      return leaveReq;
    });

    return res.status(201).json({
      message: 'Permohonan cuti berhasil diajukan',
      data: createdRequest,
    });
  } catch (error) {
    console.error('Error createLeaveRequest:', error);
    return res.status(500).json({ error: 'Gagal mengajukan permohonan cuti' });
  }
}

// 4. GET /requests/:id (Untuk Tampilan Form F4 & Pratinjau Cetak)
export async function getLeaveRequestById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID tidak valid' });
    }

    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));

    if (!request) {
      return res.status(404).json({ error: 'Data permohonan cuti tidak ditemukan' });
    }

    const employee = await getEmployeeProfile(request.employeeId);
    let handoverEmployee = null;
    if (request.handoverToEmployeeId) {
      handoverEmployee = await getEmployeeProfile(request.handoverToEmployeeId);
    }

    // Ambil persetujuan 4 tahap
    const approvalsList = await db
      .select()
      .from(leaveApprovals)
      .where(eq(leaveApprovals.leaveRequestId, id));

    const applicantApproval = approvalsList.find((a) => a.stage === 'APPLICANT') || null;
    const directSupApproval = approvalsList.find((a) => a.stage === 'DIRECT_SUPERVISOR') || null;
    const hrdApproval = approvalsList.find((a) => a.stage === 'HRD') || null;
    const higherSupApproval = approvalsList.find((a) => a.stage === 'HIGHER_SUPERVISOR') || null;

    // Ambil histori cuti snapshot
    const prevLeaves = await db
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.employeeId, request.employeeId),
          eq(leaveRequests.balanceYear, request.balanceYear),
          eq(leaveRequests.status, 'APPROVED')
        )
      )
      .orderBy(desc(leaveRequests.startDate))
      .limit(5);

    const historyItems: Array<{ no: number; description: string }> = [];
    prevLeaves.forEach((pl, i) => {
      historyItems.push({
        no: i + 1,
        description: `${pl.durationDays} = Cuti tahunan tgl ${pl.startDate}`,
      });
    });
    while (historyItems.length < 5) {
      historyItems.push({
        no: historyItems.length + 1,
        description: '',
      });
    }

    const cleanAnnualQuota = Math.max(0, request.snapshotBaseQuota - request.snapshotCollectiveLeave);

    return res.status(200).json({
      id: request.id,
      requestNumber: request.requestNumber,
      formNumber: '001',
      revisionCode: 'REV. 170208-1-W',
      createdAt: request.createdAt,
      employee: {
        id: employee?.id || request.employeeId,
        employeeCode: employee?.employeeCode || '-',
        fullName: employee?.fullName || '-',
        department: employee?.departmentName || '-',
        position: employee?.position || '-',
        joinDate: employee?.joinDate || null,
      },
      balanceYear: request.balanceYear,
      baseQuota: request.snapshotBaseQuota,
      collectiveLeaveDays: request.snapshotCollectiveLeave,
      cleanAnnualQuota,
      historyItems,
      availableBefore: request.snapshotAvailableBefore,
      leaveDaysRequested: request.durationDays,
      remainingAfter: request.snapshotRemainingAfter,
      leaveType: request.leaveType,
      specialLeaveReason: request.specialLeaveReason,
      reason: request.reason,
      startDate: request.startDate,
      endDate: request.endDate,
      resumeWorkDate: request.resumeWorkDate,
      hrdNotes: request.hrdNotes || '',
      handover: {
        recipientId: request.handoverToEmployeeId,
        recipientName: handoverEmployee?.fullName || '-',
        taskDescription: request.handoverTask || '-',
        emergencyPhone: request.emergencyPhone || '-',
      },
      approvals: {
        applicant: {
          name: applicantApproval?.approverName || employee?.fullName || '-',
          date: applicantApproval?.signatureDate || null,
          status: applicantApproval?.status || 'PENDING',
        },
        directSupervisor: {
          name: directSupApproval?.approverName || '',
          date: directSupApproval?.signatureDate || null,
          status: directSupApproval?.status || 'PENDING',
        },
        hrd: {
          name: hrdApproval?.approverName || '',
          date: hrdApproval?.signatureDate || null,
          status: hrdApproval?.status || 'PENDING',
        },
        higherSupervisor: {
          name: higherSupApproval?.approverName || '',
          date: higherSupApproval?.signatureDate || null,
          status: higherSupApproval?.status || 'PENDING',
        },
      },
    });
  } catch (error) {
    console.error('Error getLeaveRequestById:', error);
    return res.status(500).json({ error: 'Gagal mengambil detail form cuti' });
  }
}

// 5. GET /requests (List)
export async function getLeaveRequests(req: Request, res: Response) {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    let query = db
      .select({
        id: leaveRequests.id,
        requestNumber: leaveRequests.requestNumber,
        employeeId: leaveRequests.employeeId,
        employeeName: employees.fullName,
        employeeCode: employees.employeeCode,
        leaveType: leaveRequests.leaveType,
        reason: leaveRequests.reason,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        durationDays: leaveRequests.durationDays,
        resumeWorkDate: leaveRequests.resumeWorkDate,
        status: leaveRequests.status,
        createdAt: leaveRequests.createdAt,
      })
      .from(leaveRequests)
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .orderBy(desc(leaveRequests.createdAt));

    const records = await query;
    return res.status(200).json(records);
  } catch (error) {
    console.error('Error getLeaveRequests:', error);
    return res.status(500).json({ error: 'Gagal memuat daftar permohonan cuti' });
  }
}

// 6. GET /holidays
export async function getHolidays(req: Request, res: Response) {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getUTCFullYear();
    const holidays = await db
      .select()
      .from(leaveHolidayCalendars)
      .where(eq(leaveHolidayCalendars.year, year))
      .orderBy(leaveHolidayCalendars.holidayDate);

    return res.status(200).json(holidays);
  } catch (error) {
    console.error('Error getHolidays:', error);
    return res.status(500).json({ error: 'Gagal mengambil data kalender libur' });
  }
}
