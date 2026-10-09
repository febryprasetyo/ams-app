import { db, closeDatabase } from '../db';
import { leaveHolidayCalendars, leaveBalances, leaveRequests, leaveApprovals } from '../db/schema/leaves';
import { employees } from '../db/schema/employees';
import { eq, and } from 'drizzle-orm';
import { calculateLeaveBalances, calculateLeaveWorkingDays, formatLeaveRequestNumber } from '../domain/leaveCalculation';

async function seed() {
  console.log('Seeding leave holidays and initial balance...');

  // 1. Seed holidays 2024
  const holidays2024 = [
    { year: 2024, holidayDate: '2024-04-08', description: 'Cuti bersama Idul Fitri', isCollectiveLeave: true },
    { year: 2024, holidayDate: '2024-04-09', description: 'Cuti bersama Idul Fitri', isCollectiveLeave: true },
    { year: 2024, holidayDate: '2024-04-10', description: 'Hari Raya Idul Fitri 1445 H', isCollectiveLeave: false },
    { year: 2024, holidayDate: '2024-04-11', description: 'Hari Raya Idul Fitri 1445 H', isCollectiveLeave: false },
    { year: 2024, holidayDate: '2024-04-12', description: 'Cuti bersama Idul Fitri', isCollectiveLeave: true },
    { year: 2024, holidayDate: '2024-04-15', description: 'Cuti bersama Idul Fitri', isCollectiveLeave: true },
    { year: 2024, holidayDate: '2024-06-17', description: 'Idul Adha 2024', isCollectiveLeave: false },
    { year: 2024, holidayDate: '2024-06-18', description: 'Cuti bersama Idul Adha 2024', isCollectiveLeave: true },
  ];

  for (const h of holidays2024) {
    const [exist] = await db
      .select()
      .from(leaveHolidayCalendars)
      .where(and(eq(leaveHolidayCalendars.year, h.year), eq(leaveHolidayCalendars.holidayDate, h.holidayDate)));
    if (!exist) {
      await db.insert(leaveHolidayCalendars).values(h);
    }
  }

  // 2. Find Febri Joko Prasetyo
  const [febri] = await db
    .select()
    .from(employees)
    .where(eq(employees.employeeCode, '50079'));

  if (febri) {
    console.log('Found employee:', febri.fullName, 'ID:', febri.id);
    
    // Check or insert balance 2024
    let [balance] = await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.employeeId, febri.id), eq(leaveBalances.year, 2024)));

    if (!balance) {
      [balance] = await db
        .insert(leaveBalances)
        .values({
          employeeId: febri.id,
          year: 2024,
          baseQuota: 12,
          collectiveLeaveDeduction: 10,
          usedQuota: 1,
          carriedOverQuota: 0,
        })
        .returning();
    }

    // Check if sample request already exists
    const [existReq] = await db
      .select()
      .from(leaveRequests)
      .where(and(eq(leaveRequests.employeeId, febri.id), eq(leaveRequests.requestNumber, 'LV-202405-0001')));

    if (!existReq) {
      const [newReq] = await db
        .insert(leaveRequests)
        .values({
          requestNumber: 'LV-202405-0001',
          employeeId: febri.id,
          leaveType: 'ANNUAL',
          reason: 'Keperluan Keluarga',
          startDate: '2024-05-10',
          endDate: '2024-05-11',
          durationDays: 1,
          resumeWorkDate: '2024-05-13',
          handoverTask: 'Monitoring server dan backup harian',
          emergencyPhone: '081234567890',
          status: 'APPROVED',
          balanceYear: 2024,
          snapshotBaseQuota: 12,
          snapshotCollectiveLeave: 10,
          snapshotAvailableBefore: 2,
          snapshotRemainingAfter: 1,
        })
        .returning();

      // Approvals
      await db.insert(leaveApprovals).values([
        {
          leaveRequestId: newReq.id,
          stage: 'APPLICANT',
          approverEmployeeId: febri.id,
          approverName: 'Febri Joko P',
          status: 'APPROVED',
          signatureDate: '2024-05-08',
        },
        {
          leaveRequestId: newReq.id,
          stage: 'DIRECT_SUPERVISOR',
          approverName: 'Atasan IT',
          status: 'APPROVED',
          signatureDate: '2024-05-08',
        },
        {
          leaveRequestId: newReq.id,
          stage: 'HRD',
          approverName: 'HRD Manager',
          status: 'APPROVED',
          signatureDate: '2024-05-08',
        },
        {
          leaveRequestId: newReq.id,
          stage: 'HIGHER_SUPERVISOR',
          approverName: 'Direktur Ops',
          status: 'APPROVED',
          signatureDate: '2024-05-08',
        },
      ]);
      console.log('Sample leave request seeded:', newReq.requestNumber);
    }
  }

  await closeDatabase();
  console.log('Seeding done!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
