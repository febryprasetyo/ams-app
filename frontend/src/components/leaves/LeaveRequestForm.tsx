'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  CalendarCheck,
  Printer
} from 'lucide-react';
import type { LeaveBalanceSummary, CalculateLeaveDurationOutput } from '@/types/leaves';

interface EmployeeOption {
  id: number;
  fullName: string;
  employeeCode: string;
  position?: string;
  departmentName?: string;
}

export function LeaveRequestForm() {
  const router = useRouter();

  // State
  const [employeesList, setEmployeesList] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [balanceSummary, setBalanceSummary] = useState<LeaveBalanceSummary | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Form Fields
  const [leaveType, setLeaveType] = useState<'ANNUAL' | 'SPECIAL'>('ANNUAL');
  const [specialReason, setSpecialReason] = useState<string>('Menikah');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Handover Fields
  const [handoverToId, setHandoverToId] = useState<number | ''>('');
  const [handoverTask, setHandoverTask] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Calculation State
  const [daysCalculation, setDaysCalculation] = useState<CalculateLeaveDurationOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Load active employees list
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch('/api/v1/employees?status=Active');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.data || [];
          setEmployeesList(items);

          // Default ke Febri Joko Prasetyo jika ada, atau employee pertama
          const defaultEmp = items.find((e: any) => e.employeeCode === '50079') || items[0];
          if (defaultEmp) {
            setSelectedEmployeeId(defaultEmp.id);
          }
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    }
    loadEmployees();
  }, []);

  // 2. Fetch balance when selectedEmployeeId changes
  useEffect(() => {
    if (!selectedEmployeeId) return;

    async function loadBalance() {
      setIsLoadingBalance(true);
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`/api/leaves/balance-summary?employeeId=${selectedEmployeeId}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          setBalanceSummary(data);
        }
      } catch (err) {
        console.error('Failed to load balance summary:', err);
      } finally {
        setIsLoadingBalance(false);
      }
    }
    loadBalance();
  }, [selectedEmployeeId]);

  // 3. Reactive calculation when startDate or endDate changes
  useEffect(() => {
    if (!startDate || !endDate) {
      setDaysCalculation(null);
      return;
    }

    async function computeDays() {
      setIsCalculating(true);
      try {
        const res = await fetch('/api/leaves/calculate-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate,
            endDate,
            employeeId: selectedEmployeeId || undefined,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          setDaysCalculation(result);
        }
      } catch (err) {
        console.error('Failed to calculate days:', err);
      } finally {
        setIsCalculating(false);
      }
    }
    computeDays();
  }, [startDate, endDate, selectedEmployeeId]);

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedEmployeeId) {
      setErrorMessage('Pilih karyawan pemohon terlebih dahulu');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Tentukan rentang tanggal mulai dan selesai');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Alasan cuti wajib diisi');
      return;
    }
    if (!daysCalculation || !daysCalculation.isValid || daysCalculation.durationDays <= 0) {
      setErrorMessage('Rentang tanggal tidak memiliki hari kerja efektif');
      return;
    }

    if (leaveType === 'ANNUAL' && balanceSummary) {
      if (daysCalculation.durationDays > balanceSummary.availableBalance) {
        setErrorMessage(
          `Saldo cuti tahunan tidak mencukupi. Sisa saldo: ${balanceSummary.availableBalance} hari, permohonan: ${daysCalculation.durationDays} hari.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leaves/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: Number(selectedEmployeeId),
          leaveType,
          specialLeaveReason: leaveType === 'SPECIAL' ? specialReason : undefined,
          reason,
          startDate,
          endDate,
          handoverToEmployeeId: handoverToId ? Number(handoverToId) : undefined,
          handoverTask: handoverTask || undefined,
          emergencyPhone: emergencyPhone || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || 'Gagal mengajukan permohonan cuti');
      } else {
        setSuccessMessage('Permohonan cuti berhasil diajukan!');
        // Buka langsung tampilan dokumen F4 untuk pratinjau / cetak
        if (json.data && json.data.id) {
          setTimeout(() => {
            router.push(`/dashboard/leaves/${json.data.id}/print`);
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingAfterEstimate =
    balanceSummary && daysCalculation && leaveType === 'ANNUAL'
      ? Math.max(0, balanceSummary.availableBalance - daysCalculation.durationDays)
      : balanceSummary?.availableBalance ?? 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Perhatian</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Sukses</p>
            <p>{successMessage} Mengalihkan ke dokumen cetak F4...</p>
          </div>
        </div>
      )}

      {/* 1. Pemilihan Karyawan & Ringkasan Identitas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">1. Data Karyawan Pemohon</h2>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            Form Number : 001
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Pilih Karyawan
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              {employeesList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode}) {emp.position ? `- ${emp.position}` : ''}
                </option>
              ))}
            </select>
          </div>

          {balanceSummary && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Departemen:</span>
                <span className="font-semibold text-slate-800">{balanceSummary.employee.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jabatan:</span>
                <span className="font-semibold text-slate-800">{balanceSummary.employee.position}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NIP / Absen:</span>
                <span className="font-semibold text-slate-800">{balanceSummary.employee.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tanggal Join:</span>
                <span className="font-semibold text-slate-800">{balanceSummary.employee.joinDate || '-'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Kartu Hak dan Sisa Cuti Karyawan */}
      {balanceSummary && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">2. Hak dan Sisa Cuti Karyawan</h2>
            </div>
            <span className="text-xs text-slate-300">
              Periode: Januari {balanceSummary.year} - Desember {balanceSummary.year}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">Hak Cuti Dasar</div>
              <div className="text-2xl font-bold text-white mt-1">{balanceSummary.baseQuota} <span className="text-xs font-normal text-slate-400">Hari</span></div>
              <div className="text-[11px] text-slate-400 mt-0.5">Sesuai Peraturan</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">Cuti Bersama Resmi</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{balanceSummary.collectiveLeaveDays} <span className="text-xs font-normal text-slate-400">Hari</span></div>
              <div className="text-[11px] text-slate-400 mt-0.5">Memotong Kuota</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">Hak Cuti Bersih</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {balanceSummary.cleanAnnualQuota} <span className="text-xs font-normal text-slate-400">Hari</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">12 - {balanceSummary.collectiveLeaveDays} Hari</div>
            </div>

            <div className="bg-emerald-950/50 p-3.5 rounded-xl border border-emerald-600/40">
              <div className="text-xs text-emerald-300 font-medium">Sisa Siap Ambil</div>
              <div className="text-2xl font-extrabold text-emerald-300 mt-1">
                {balanceSummary.availableBalance} <span className="text-xs font-normal text-emerald-400">Hari</span>
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">
                {daysCalculation && daysCalculation.durationDays > 0 ? (
                  <span>Sisa akhir: <strong className="text-white">{remainingAfterEstimate} Hari</strong></span>
                ) : (
                  'Tersedia saat ini'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detail Cuti yang Akan Diambil */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">3. Cuti yang Akan Diambil</h2>
          </div>
          {daysCalculation && daysCalculation.durationDays > 0 && (
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">
              {daysCalculation.durationDays} Hari Kerja Efektif
            </span>
          )}
        </div>

        {/* Pilihan Jenis Cuti */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-600 uppercase">Jenis Cuti</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                leaveType === 'ANNUAL'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="leaveType"
                value="ANNUAL"
                checked={leaveType === 'ANNUAL'}
                onChange={() => setLeaveType('ANNUAL')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-bold">Cuti Tahunan *)</div>
                <div className="text-xs text-slate-500">Mengurangi saldo cuti tahunan mandiri karyawan</div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                leaveType === 'SPECIAL'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="leaveType"
                value="SPECIAL"
                checked={leaveType === 'SPECIAL'}
                onChange={() => setLeaveType('SPECIAL')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-sm font-bold">Cuti Khusus **)</div>
                <div className="text-xs text-slate-500">Menikah, Melahirkan, Kematian, Khitanan, dll</div>
              </div>
            </label>
          </div>

          {leaveType === 'SPECIAL' && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Kategori Cuti Khusus
              </label>
              <select
                value={specialReason}
                onChange={(e) => setSpecialReason(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
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

        {/* Rentang Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              s/d Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>
        </div>

        {/* Hasil Perhitungan Hari Kerja & Tanggal Masuk */}
        {daysCalculation && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-emerald-800 font-semibold block uppercase">
                Hari Kerja Efektif:
              </span>
              <span className="text-xl font-bold text-emerald-950">
                {daysCalculation.durationDays} Hari
              </span>
            </div>

            <div>
              <span className="text-xs text-emerald-800 font-semibold block uppercase">
                Kembali Bekerja Tanggal:
              </span>
              <span className="text-base font-bold text-emerald-950">
                {daysCalculation.resumeWorkDate}
              </span>
            </div>
          </div>
        )}

        {/* Alasan Cuti */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
            Alasan Cuti
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Keperluan Keluarga / Mudik Tahunan"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            required
          />
        </div>
      </div>

      {/* 4. Serah Terima Tugas Selama Cuti (Handover) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-slate-800">4. Serah Terima Tugas Selama Cuti</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Kepada (Rekan Kerja Pengganti)
            </label>
            <select
              value={handoverToId}
              onChange={(e) => setHandoverToId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">-- Pilih Rekan Penerima Tugas (Opsional) --</option>
              {employeesList
                .filter((e) => e.id !== selectedEmployeeId)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.position || emp.departmentName || '-'})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Nomor Telp yang Bisa Dihubungi Selama Cuti
            </label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="Contoh: 0812-3456-7890"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
            Tugas yang Akan Diserahkan
          </label>
          <textarea
            rows={2}
            value={handoverTask}
            onChange={(e) => setHandoverTask(e.target.value)}
            placeholder="Rincian pekerjaan operasional yang didelegasikan selama cuti"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/leaves')}
          className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-sm transition cursor-pointer"
        >
          {isSubmitting ? 'Memproses...' : 'Ajukan & Buat Form F4'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
