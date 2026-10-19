'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  FileText,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { LeaveBalanceSummary } from "@/types/leaves";

interface EmployeeOption {
  id: number;
  fullName: string;
  employeeCode: string;
  position?: string;
  departmentName?: string;
}

export function LeaveRequestForm() {
  const router = useRouter();

  // State Karyawan
  const [employeesList, setEmployeesList] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");
  const [balanceSummary, setBalanceSummary] = useState<LeaveBalanceSummary | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Form Fields
  const [leaveType, setLeaveType] = useState<"ANNUAL" | "SPECIAL">("ANNUAL");
  const [specialReason, setSpecialReason] = useState<string>("Menikah");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Jumlah cuti yang diambil (Input Manual)
  const [manualDurationDays, setManualDurationDays] = useState<number | "">(1);
  const [manualResumeWorkDate, setManualResumeWorkDate] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load daftar karyawan
  useEffect(() => {
    async function loadEmployees() {
      try {
        let items: EmployeeOption[] = [];
        const res = await fetch("/api/v1/leaves/employees");
        if (res.ok) {
          items = await res.json();
        } else {
          const token = localStorage.getItem("token");
          const resV1 = await fetch("/api/v1/employees?status=Active", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (resV1.ok) {
            const dataV1 = await resV1.json();
            items = Array.isArray(dataV1) ? dataV1 : dataV1.data || [];
          }
        }

        if (Array.isArray(items) && items.length > 0) {
          setEmployeesList(items);
          const defaultEmp = items.find((e) => e.employeeCode === "50079") || items[0];
          if (defaultEmp) {
            setSelectedEmployeeId(defaultEmp.id);
          }
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
      }
    }
    loadEmployees();
  }, []);

  // Fetch saldo saat karyawan dipilih
  useEffect(() => {
    if (!selectedEmployeeId) return;

    async function loadBalance() {
      setIsLoadingBalance(true);
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`/api/v1/leaves/balance-summary?employeeId=${selectedEmployeeId}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          setBalanceSummary(data);
        }
      } catch (err) {
        console.error("Failed to load balance summary:", err);
      } finally {
        setIsLoadingBalance(false);
      }
    }
    loadBalance();
  }, [selectedEmployeeId]);

  // Rekomendasi otomatis tanggal kembali bekerja saat tanggal selesai berubah
  useEffect(() => {
    if (endDate && !manualResumeWorkDate) {
      try {
        const [y, m, d] = endDate.split("-").map(Number);
        const next = new Date(Date.UTC(y, m - 1, d));
        next.setUTCDate(next.getUTCDate() + 1);
        if (next.getUTCDay() === 6) {
          next.setUTCDate(next.getUTCDate() + 2);
        } else if (next.getUTCDay() === 0) {
          next.setUTCDate(next.getUTCDate() + 1);
        }
        const yStr = next.getUTCFullYear();
        const mStr = String(next.getUTCMonth() + 1).padStart(2, "0");
        const dStr = String(next.getUTCDate()).padStart(2, "0");
        setManualResumeWorkDate(`${yStr}-${mStr}-${dStr}`);
      } catch (e) {
        // ignore
      }
    }
  }, [endDate, manualResumeWorkDate]);

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedEmployeeId) {
      setErrorMessage("Pilih nama karyawan pemohon terlebih dahulu");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage("Tentukan rentang Dari Tanggal dan s/d Tanggal cuti");
      return;
    }
    if (!manualDurationDays || Number(manualDurationDays) <= 0) {
      setErrorMessage("Jumlah cuti yang diambil harus diisi manual (minimal 1 hari)");
      return;
    }
    if (!reason.trim()) {
      setErrorMessage("Alasan cuti wajib diisi");
      return;
    }

    const durationNum = Number(manualDurationDays);

    if (leaveType === "ANNUAL" && balanceSummary) {
      if (durationNum > balanceSummary.availableBalance) {
        setErrorMessage(
          `Saldo cuti tahunan tidak mencukupi. Sisa saldo tersedia: ${balanceSummary.availableBalance} hari, jumlah cuti yang diajukan: ${durationNum} hari.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/leaves/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: Number(selectedEmployeeId),
          leaveType,
          specialLeaveReason: leaveType === "SPECIAL" ? specialReason : undefined,
          reason,
          startDate,
          endDate,
          durationDays: durationNum,
          resumeWorkDate: manualResumeWorkDate || undefined,
          emergencyPhone: emergencyPhone || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Gagal mengajukan permohonan cuti");
      } else {
        setSuccessMessage("Permohonan cuti berhasil disimpan!");
        if (json.data && json.data.id) {
          setTimeout(() => {
            router.push(`/dashboard/leaves/${json.data.id}/print`);
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimasi realtime sisa saldo berdasarkan input manual
  const durationNum = typeof manualDurationDays === "number" ? manualDurationDays : 0;
  const remainingAfterEstimate =
    balanceSummary && leaveType === "ANNUAL"
      ? Math.max(0, balanceSummary.availableBalance - durationNum)
      : balanceSummary?.availableBalance ?? 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Alert Error */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Perhatian</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Alert Sukses */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sukses</p>
            <p>{successMessage} Membuka dokumen format F4...</p>
          </div>
        </div>
      )}

      {/* 1. DATA KARYAWAN (Template Standard Container) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">1. Data Karyawan</h2>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-mono">
            Form Number: 001 / REV. 170208-1-W
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 font-mono">
              Nama Karyawan <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer transition-all"
              required
            >
              <option value="">-- Pilih Karyawan --</option>
              {employeesList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode}) {emp.position ? `- ${emp.position}` : ""}
                </option>
              ))}
            </select>
            {employeesList.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">Memuat daftar nama karyawan...</p>
            )}
          </div>

          {balanceSummary && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">Departemen</span>
                <span className="font-semibold text-slate-800">{balanceSummary.employee.department}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">Jabatan</span>
                <span className="font-semibold text-slate-800">{balanceSummary.employee.position}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">NIK / Absen</span>
                <span className="font-semibold text-slate-800 font-mono">{balanceSummary.employee.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">Tanggal Join</span>
                <span className="font-semibold text-slate-800">{balanceSummary.employee.joinDate || "-"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. HAK DAN SISA CUTI KARYAWAN (Template Standard KPI Cards) */}
      {balanceSummary && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">2. Hak dan Sisa Cuti Karyawan</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Tahun Kalender {balanceSummary.year}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Kuota Dasar</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {balanceSummary.baseQuota} <span className="text-xs font-normal text-slate-500">Hari</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Hak Awal Tahun</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-[11px] text-amber-600 uppercase font-mono tracking-wider">Cuti Bersama</div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {balanceSummary.collectiveLeaveDays} <span className="text-xs font-normal text-amber-600">Hari</span>
              </div>
              <div className="text-[11px] text-amber-600/80 mt-0.5">Potongan Pemerintah</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[11px] text-emerald-600 uppercase font-mono tracking-wider">Hak Cuti Bersih</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {balanceSummary.cleanAnnualQuota} <span className="text-xs font-normal text-emerald-600">Hari</span>
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">
                {balanceSummary.baseQuota} - {balanceSummary.collectiveLeaveDays} = {balanceSummary.cleanAnnualQuota} Hari
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-300">
              <div className="text-[11px] text-emerald-700 uppercase font-mono tracking-wider font-bold">Sisa Hak Cuti</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {balanceSummary.availableBalance} <span className="text-xs font-normal text-emerald-600">Hari</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                Setelah diajukan: <strong className="text-slate-900">{remainingAfterEstimate} Hari</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DETAIL PERMOHONAN CUTI (Template Standard Form Fields) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">3. Detail Permohonan Cuti</h2>
        </div>

        {/* Jenis Cuti Radio Button Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-2 font-mono">
            Jenis Cuti Yang Dimohon <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                leaveType === "ANNUAL"
                  ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="leaveType"
                value="ANNUAL"
                checked={leaveType === "ANNUAL"}
                onChange={() => setLeaveType("ANNUAL")}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">Cuti Tahunan *)</div>
                <div className="text-[11px] text-slate-500">Mengurangi saldo cuti tahunan karyawan</div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                leaveType === "SPECIAL"
                  ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="leaveType"
                value="SPECIAL"
                checked={leaveType === "SPECIAL"}
                onChange={() => setLeaveType("SPECIAL")}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">Cuti Khusus **)</div>
                <div className="text-[11px] text-slate-500">Menikah, Melahirkan, Kematian, Khitanan, dll</div>
              </div>
            </label>
          </div>

          {leaveType === "SPECIAL" && (
            <div className="pt-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-mono">
                Kategori Cuti Khusus
              </label>
              <select
                value={specialReason}
                onChange={(e) => setSpecialReason(e.target.value)}
                className="w-full sm:w-72 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="Menikah">Menikah (3 Hari)</option>
                <option value="Melahirkan">Melahirkan / Keguguran</option>
                <option value="Kematian">Kematian Keluarga Inti (2 Hari)</option>
                <option value="Khitanan/Baptis">Khitanan / Pembaptisan Anak (2 Hari)</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
          )}
        </div>

        {/* Input Tanggal & Input Manual Jumlah Hari */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 font-mono">
              Dari Tanggal <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-medium cursor-pointer transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 font-mono">
              s/d Tanggal <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-medium cursor-pointer transition-all"
              required
            />
          </div>

          {/* Jumlah Cuti yang Diambil (Input Manual) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 font-mono">
              Jumlah Cuti Diambil <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={30}
                value={manualDurationDays}
                onChange={(e) => setManualDurationDays(e.target.value ? Number(e.target.value) : "")}
                placeholder="Misal: 2"
                className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-emerald-700 pointer-events-none">
                Hari
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Input manual (misal: Jumat & Senin dihitung 2 hari).
            </p>
          </div>
        </div>

        {/* Tanggal Kembali Bekerja & Telepon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 font-mono">
              Kembali Bekerja Tanggal
            </label>
            <input
              type="date"
              value={manualResumeWorkDate}
              onChange={(e) => setManualResumeWorkDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-medium cursor-pointer transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">Hari pertama masuk kerja setelah cuti selesai.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 font-mono">
              Nomor Telp Darurat (Selama Cuti)
            </label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="Contoh: 0812-3456-7890"
              className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-medium transition-all"
            />
          </div>
        </div>

        {/* Alasan Cuti */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 font-mono">
            Alasan Cuti <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Keperluan Keluarga"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            required
          />
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/leaves")}
          className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              Ajukan Cuti & Cetak Form F4
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
