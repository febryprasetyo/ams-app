import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { createAttendanceReportWorkbook } from "./excelExport.ts";

const dummyRows = [
  {
    employee: { id: 1, employeeCode: "EMP-001", fullName: "Budi Santoso", departmentId: 10, email: "budi@test.com", isActive: true },
    recordCount: 20,
    lateMinutes: 45,
    overtimeMinutes: 120,
  },
  {
    employee: { id: 2, employeeCode: "EMP-002", fullName: "Siti Rahma", departmentId: 20, email: "siti@test.com", isActive: true },
    recordCount: 22,
    lateMinutes: 0,
    overtimeMinutes: 60,
  },
];

const dummyFilter = {
  startDate: "2026-09-01",
  endDate: "2026-09-30",
};

test("creates Excel workbook with Rekap Absensi Payroll sheet and formatted data", () => {
  const wb = createAttendanceReportWorkbook(dummyRows, dummyFilter, {
    departmentLookup: id => (id === 10 ? "Finance" : "IT"),
  });

  assert.ok(wb.SheetNames.includes("Rekap Absensi Payroll"));
  const sheet = wb.Sheets["Rekap Absensi Payroll"];
  const rows = XLSX.utils.sheet_to_json(sheet);

  assert.equal(rows.length, 2);
  assert.equal(rows[0]["ID Karyawan"], "EMP-001");
  assert.equal(rows[0]["Nama Karyawan"], "Budi Santoso");
  assert.equal(rows[0]["Departemen"], "Finance");
  assert.equal(rows[0]["Hari Hadir"], 20);
  assert.equal(rows[0]["Keterlambatan (Menit)"], 45);
  assert.equal(rows[0]["Lembur (Menit)"], 120);

  assert.equal(rows[1]["ID Karyawan"], "EMP-002");
  assert.equal(rows[1]["Nama Karyawan"], "Siti Rahma");
  assert.equal(rows[1]["Departemen"], "IT");
});

test("creates anonymous Excel workbook with Ringkasan Laporan sheet", () => {
  const wb = createAttendanceReportWorkbook(dummyRows, dummyFilter, {
    anonymous: true,
  });

  assert.ok(wb.SheetNames.includes("Ringkasan Laporan"));
  const sheet = wb.Sheets["Ringkasan Laporan"];
  const rows = XLSX.utils.sheet_to_json(sheet);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]["Total Karyawan"], 2);
  assert.equal(rows[0]["Total Kehadiran (Hari)"], 42);
  assert.equal(rows[0]["Total Keterlambatan (Menit)"], 45);
  assert.equal(rows[0]["Total Lembur (Menit)"], 180);
});

test("includes Rincian Harian sheet when dailyRecords are provided", () => {
  const dailyRecords = [
    {
      id: 101,
      employeeId: 1,
      workDate: "2026-09-01",
      shift: "Regular",
      scheduleIn: "08:00",
      scheduleOut: "17:00",
      scanIn: "08:15",
      scanOut: "18:00",
      lateMinutes: 15,
      earlyMinutes: 0,
      overtimeMinutes: 60,
      attendanceStatus: "PRESENT",
      isDayOff: false,
    },
  ];

  const wb = createAttendanceReportWorkbook(dummyRows.slice(0, 1), dummyFilter, {
    dailyRecords,
  });

  assert.ok(wb.SheetNames.includes("Rekap Absensi Payroll"));
  assert.ok(wb.SheetNames.includes("Rincian Harian"));

  const dailySheet = wb.Sheets["Rincian Harian"];
  const dailyRows = XLSX.utils.sheet_to_json(dailySheet);
  assert.equal(dailyRows.length, 1);
  assert.equal(dailyRows[0]["Tanggal"], "2026-09-01");
  assert.equal(dailyRows[0]["Scan Masuk"], "08:15");
  assert.equal(dailyRows[0]["Terlambat (Menit)"], 15);
  assert.equal(dailyRows[0]["Lembur (Menit)"], 60);
});
