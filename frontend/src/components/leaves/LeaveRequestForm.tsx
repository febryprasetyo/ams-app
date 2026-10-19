'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
} from "lucide-react";
import type { LeaveBalanceSummary } from "@/types/leaves";
import LeaveEmployeePicker, { LeaveEmployeeItem } from "@/components/leaves/LeaveEmployeePicker";

export function LeaveRequestForm() {
  const router = useRouter();

  // State Karyawan - Default KOSONG (null)
  const [selectedEmployee, setSelectedEmployee] = useState<LeaveEmployeeItem | null>(null);
  const [balanceSummary, setBalanceSummary] = useState<LeaveBalanceSummary | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Form Fields
  const [leaveType, setLeaveType] = useState<"ANNUAL" | "SPECIAL">("ANNUAL");
  const [specialReason, setSpecialReason] = useState<string>("Menikah");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Jumlah cuti yang diambil (Input Manual)
  const [manualDurationDays, setManualDurationDays] = useState<number | "">("");
  const [manualResumeWorkDate, setManualResumeWorkDate] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch data saldo rill saat karyawan dipilih
  useEffect(() => {
    if (!selectedEmployee) {
      setBalanceSummary(null);
      return;
    }

    async function loadBalance() {
      setIsLoadingBalance(true);
      try {
        const year = startDate ? Number(startDate.split("-")[0]) : new Date().getFullYear();
        if (!selectedEmployee) return;
        const res = await fetch(`/api/v1/leaves/balance-summary?employeeId=${selectedEmployee.id}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          setBalanceSummary(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Gagal mengambil saldo cuti:", errData);
        }
      } catch (err) {
        console.error("Failed to load balance summary:", err);
      } finally {
        setIsLoadingBalance(false);
      }
    }
    loadBalance();
  }, [selectedEmployee, startDate ? startDate.split("-")[0] : null]);

  // Hitung estimasi hari kerja otomatis saat tanggal dipilih (bisa disesuaikan manual)
  useEffect(() => {
    if (startDate && endDate && manualDurationDays === "") {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end >= start) {
          let count = 0;
          const cur = new Date(start);
          while (cur <= end) {
            const day = cur.getDay();
            if (day !== 0 && day !== 6) {
              count++;
            }
            cur.setDate(cur.getDate() + 1);
          }
          if (count > 0) {
            setManualDurationDays(count);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [startDate, endDate, manualDurationDays]);

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

    if (!selectedEmployee) {
      setErrorMessage("Silakan cari dan pilih nama karyawan terlebih dahulu.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage("Tentukan rentang Dari Tanggal dan s/d Tanggal cuti.");
      return;
    }
    if (!manualDurationDays || Number(manualDurationDays) <= 0) {
      setErrorMessage("Jumlah cuti yang diambil harus diisi (minimal 1 hari).");
      return;
    }
    if (!reason.trim()) {
      setErrorMessage("Alasan permohonan cuti wajib diisi.");
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
          employeeId: Number(selectedEmployee.id),
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
        setErrorMessage(json.error || "Gagal mengajukan permohonan cuti.");
      } else {
        setSuccessMessage("Permohonan cuti berhasil disimpan!");
        if (json.data && json.data.id) {
          setTimeout(() => {
            // Gunakan router.replace agar saat tombol back ditekan di view/print, kembali ke list tabel cuti
            router.replace(`/dashboard/leaves/${json.data.id}/print`);
          }, 400);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses data.");
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-8">
      {/* Alert Error */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Perhatian</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Alert Sukses */}
      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sukses</p>
            <p>{successMessage} Membuka dokumen formulir F4...</p>
          </div>
        </div>
      )}

      {/* === 1. Data Pemohon (Searchable Picker like Assigned Custodian) === */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
          1. Data Pemohon
        </h2>
        <div className="space-y-4">
          <div className="max-w-xl">
            <LeaveEmployeePicker
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              required
              label="Pilih Karyawan"
            />
          </div>

          {selectedEmployee && balanceSummary && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">Departemen</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{balanceSummary.employee.department}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">Jabatan</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{balanceSummary.employee.position}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">NIK / Absen</span>
                <span className="font-semibold text-slate-800 font-mono mt-0.5 block">{balanceSummary.employee.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-mono">Tanggal Bergabung</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{balanceSummary.employee.joinDate || "—"}</span>
              </div>
            </div>
          )}

          {isLoadingBalance && (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memuat data saldo cuti rill karyawan...</span>
            </div>
          )}
        </div>
      </section>

      {/* === 2. Hak dan Sisa Cuti Karyawan (Terintegrasi Pengaturan Cuti Rill) === */}
      {selectedEmployee && balanceSummary && (
        <section>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Hak dan Sisa Cuti Karyawan</span>
            </h2>
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
              <div className="text-[11px] text-amber-600/80 mt-0.5">Potongan Kebijakan</div>
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
                {durationNum > 0 ? (
                  <>
                    Setelah diajukan (-{durationNum} hari): <strong className="text-slate-900">{remainingAfterEstimate} Hari</strong>
                  </>
                ) : (
                  <>
                    Sisa setelah diajukan: <strong className="text-slate-900">{balanceSummary.availableBalance} Hari</strong>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === 3. Detail Permohonan Cuti === */}
      <section>
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
          <FileText className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-700">3. Detail Permohonan Cuti</h2>
        </div>

        <div className="space-y-4">
          {/* Pilihan Jenis Cuti */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2 font-mono">
              Jenis Cuti Yang Dimohon <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
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
              <div className="pt-3 max-w-sm">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-mono">
                  Kategori Cuti Khusus
                </label>
                <select
                  value={specialReason}
                  onChange={(e) => setSpecialReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer"
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

          {/* Grid Periode Cuti & Jumlah Hari */}
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 transition-all font-medium cursor-pointer"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 transition-all font-medium cursor-pointer"
                required
              />
            </div>

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
                  className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
                <span className="absolute right-3.5 top-2 text-xs font-bold text-emerald-700 pointer-events-none">
                  Hari
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Input manual (misal: Jumat & Senin dihitung 2 hari kerja).
              </p>
            </div>
          </div>

          {/* Grid Tanggal Kembali & Telp */}
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 transition-all font-medium cursor-pointer"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 transition-all font-medium"
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
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 transition-all resize-none placeholder:text-slate-400"
              required
            />
          </div>
        </div>
      </section>

      {/* === Footer Actions (Matching EmployeeFormPage standard) === */}
      <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/dashboard/leaves"
          className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer shadow-sm transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan
            </>
          )}
        </button>
      </div>
    </form>
  );
}
