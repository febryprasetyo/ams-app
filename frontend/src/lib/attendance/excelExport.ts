import * as XLSX from "xlsx";
function durationLabel(minutes: number): string {
  if (!minutes) return "0 m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h} j ${m} m` : `${h} j`) : `${m} m`;
}

function dateLabel(date: string): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-").map(Number);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${d} ${months[m - 1] ?? ""} ${y}`;
}
import type { EmployeeReport, RecordFilter, AttendanceRecord } from "./types";

export interface ExportReportOptions {
  anonymous?: boolean;
  departmentLookup?: (deptId?: number | null) => string | undefined;
  filename?: string;
  dailyRecords?: AttendanceRecord[];
}

export function createAttendanceReportWorkbook(
  rows: EmployeeReport[],
  filter: RecordFilter,
  options?: ExportReportOptions
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const anonymous = Boolean(options?.anonymous);

  if (anonymous) {
    const summaryData = [
      {
        "Periode Mulai": filter.startDate,
        "Periode Selesai": filter.endDate,
        "Total Karyawan": rows.length,
        "Total Kehadiran (Hari)": rows.reduce((v, r) => v + r.recordCount, 0),
        "Total Keterlambatan (Menit)": rows.reduce((v, r) => v + r.lateMinutes, 0),
        "Total Lembur (Menit)": rows.reduce((v, r) => v + r.overtimeMinutes, 0),
      },
    ];
    const ws = XLSX.utils.json_to_sheet(summaryData);
    ws["!cols"] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 22 },
      { wch: 26 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(workbook, ws, "Ringkasan Laporan");
    return workbook;
  }

  // Rekap Absensi Sheet (All filtered employees)
  const reportData = rows.map((r, idx) => ({
    "No": idx + 1,
    "ID Karyawan": r.employee.employeeCode || "-",
    "Nama Karyawan": r.employee.fullName || "-",
    "Departemen": options?.departmentLookup ? (options.departmentLookup(r.employee.departmentId) || "-") : "-",
    "Periode Mulai": filter.startDate,
    "Periode Selesai": filter.endDate,
    "Hari Hadir": r.recordCount,
    "Keterlambatan (Menit)": r.recordCount ? r.lateMinutes : 0,
    "Durasi Terlambat": r.recordCount ? durationLabel(r.lateMinutes) : "0 m",
    "Lembur (Menit)": r.recordCount ? r.overtimeMinutes : 0,
    "Durasi Lembur": r.recordCount ? durationLabel(r.overtimeMinutes) : "0 m",
  }));

  const wsSummary = XLSX.utils.json_to_sheet(reportData);
  wsSummary["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 28 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Rekap Absensi Payroll");

  // If daily records are provided (e.g. single employee detail or full daily view)
  if (options?.dailyRecords && options.dailyRecords.length > 0) {
    const dailyData = options.dailyRecords.map((r, idx) => ({
      "No": idx + 1,
      "Tanggal": r.workDate,
      "Label Tanggal": dateLabel(r.workDate),
      "Shift": r.shift || "-",
      "Jadwal Masuk": r.scheduleIn || "-",
      "Jadwal Pulang": r.scheduleOut || "-",
      "Scan Masuk": r.scanIn || "-",
      "Scan Pulang": r.scanOut || "-",
      "Status": r.attendanceStatus,
      "Terlambat (Menit)": r.lateMinutes,
      "Pulang Cepat (Menit)": r.earlyMinutes,
      "Lembur (Menit)": r.overtimeMinutes,
      "Durasi Lembur": durationLabel(r.overtimeMinutes),
    }));
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    wsDaily["!cols"] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsDaily, "Rincian Harian");
  }

  return workbook;
}

export function downloadAttendanceExcel(workbook: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportAttendanceReportToExcel(
  rows: EmployeeReport[],
  filter: RecordFilter,
  options?: ExportReportOptions
) {
  const workbook = createAttendanceReportWorkbook(rows, filter, options);
  const defaultFilename = options?.filename || `rekap-absensi-${filter.startDate}-${filter.endDate}.xlsx`;
  downloadAttendanceExcel(workbook, defaultFilename);
}
