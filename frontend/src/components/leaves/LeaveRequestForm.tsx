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
  PenTool
} from 'lucide-react';
import type { LeaveBalanceSummary } from '@/types/leaves';

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [balanceSummary, setBalanceSummary] = useState<LeaveBalanceSummary | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Form Fields
  const [leaveType, setLeaveType] = useState<'ANNUAL' | 'SPECIAL'>('ANNUAL');
  const [specialReason, setSpecialReason] = useState<string>('Menikah');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Revisi 2: Jumlah cuti yang diambil INPUT MANUAL (bukan hasil hitung tanggal)
  const [manualDurationDays, setManualDurationDays] = useState<number | ''>(1);
  const [manualResumeWorkDate, setManualResumeWorkDate] = useState<string>('');

  // Handover (Revisi 3: Opsional / kosongan untuk tulis tangan manual)
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Revisi 1: Memuat daftar karyawan dari /api/v1/leaves/employees dengan fallback
  useEffect(() => {
    async function loadEmployees() {
      try {
        let items: EmployeeOption[] = [];
        
        // Panggil endpoint /api/v1/leaves/employees terlebih dahulu
        const res = await fetch('/api/v1/leaves/employees');
        if (res.ok) {
          items = await res.json();
        } else {
          // Fallback ke token auth jika ada
          const token = localStorage.getItem('token');
          const resV1 = await fetch('/api/v1/employees?status=Active', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (resV1.ok) {
            const dataV1 = await resV1.json();
            items = Array.isArray(dataV1) ? dataV1 : dataV1.data || [];
          }
        }

        if (Array.isArray(items) && items.length > 0) {
          setEmployeesList(items);

          // Default ke Febri Joko Prasetyo jika ada, atau employee pertama
          const defaultEmp = items.find((e) => e.employeeCode === '50079') || items[0];
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

  // 2. Fetch saldo saat karyawan dipilih
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
        console.error('Failed to load balance summary:', err);
      } finally {
        setIsLoadingBalance(false);
      }
    }
    loadBalance();
  }, [selectedEmployeeId]);

  // 3. Rekomendasi otomatis tanggal kembali bekerja saat tanggal selesai berubah (user tetap bisa ganti)
  useEffect(() => {
    if (endDate && !manualResumeWorkDate) {
      // Perkiraan default: hari kalender berikutnya
      try {
        const [y, m, d] = endDate.split('-').map(Number);
        const next = new Date(Date.UTC(y, m - 1, d));
        next.setUTCDate(next.getUTCDate() + 1);
        // Jika jatuh di Sabtu (6), geser ke Senin (+2 hari)
        if (next.getUTCDay() === 6) {
          next.setUTCDate(next.getUTCDate() + 2);
        } else if (next.getUTCDay() === 0) {
          next.setUTCDate(next.getUTCDate() + 1);
        }
        const yStr = next.getUTCFullYear();
        const mStr = String(next.getUTCMonth() + 1).padStart(2, '0');
        const dStr = String(next.getUTCDate()).padStart(2, '0');
        setManualResumeWorkDate(`${yStr}-${mStr}-${dStr}`);
      } catch (e) {
        // ignore
      }
    }
  }, [endDate, manualResumeWorkDate]);

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedEmployeeId) {
      setErrorMessage('Pilih nama karyawan pemohon terlebih dahulu');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Tentukan rentang Dari Tanggal dan s/d Tanggal cuti');
      return;
    }
    if (!manualDurationDays || Number(manualDurationDays) <= 0) {
      setErrorMessage('Jumlah cuti yang diambil harus diisi manual (minimal 1 hari)');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Alasan cuti wajib diisi');
      return;
    }

    const durationNum = Number(manualDurationDays);

    if (leaveType === 'ANNUAL' && balanceSummary) {
      if (durationNum > balanceSummary.availableBalance) {
        setErrorMessage(
          `Saldo cuti tahunan tidak mencukupi. Sisa saldo tersedia: ${balanceSummary.availableBalance} hari, jumlah cuti yang diajukan: ${durationNum} hari.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/leaves/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: Number(selectedEmployeeId),
          leaveType,
          specialLeaveReason: leaveType === 'SPECIAL' ? specialReason : undefined,
          reason,
          startDate,
          endDate,
          durationDays: durationNum, // Input manual!
          resumeWorkDate: manualResumeWorkDate || undefined,
          emergencyPhone: emergencyPhone || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || 'Gagal mengajukan permohonan cuti');
      } else {
        setSuccessMessage('Permohonan cuti berhasil disimpan!');
        if (json.data && json.data.id) {
          setTimeout(() => {
            router.push(`/dashboard/leaves/${json.data.id}/print`);
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimasi realtime sisa saldo berdasarkan input manual
  const durationNum = typeof manualDurationDays === 'number' ? manualDurationDays : 0;
  const remainingAfterEstimate =
    balanceSummary && leaveType === 'ANNUAL'
      ? Math.max(0, balanceSummary.availableBalance - durationNum)
      : balanceSummary?.availableBalance ?? 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Alert Error */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Perhatian</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Alert Sukses */}
      {successMessage && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Sukses</p>
            <p>{successMessage} Membuka dokumen format F4...</p>
          </div>
        </div>
      )}

      {/* 1. DATA KARYAWAN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">1. Data Karyawan</h2>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            Form Number : 001 / REV. 170208-1-W
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Karyawan <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm"
              required
            >
              <option value="">-- Pilih Karyawan --</option>
              {employeesList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode}) {emp.position ? `- ${emp.position}` : ''}
                </option>
              ))}
            </select>
            {employeesList.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Memuat daftar nama karyawan...</p>
            )}
          </div>

          {balanceSummary && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
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

      {/* 2. HAK DAN SISA CUTI KARYAWAN */}
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
              <div className="text-xs text-slate-400">Jumlah Hak Cuti</div>
              <div className="text-2xl font-bold text-white mt-1">
                {balanceSummary.baseQuota} <span className="text-xs font-normal text-slate-400">Hari</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Kuota Dasar</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">Cuti Bersama</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {balanceSummary.collectiveLeaveDays} <span className="text-xs font-normal text-slate-400">Hari</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Memotong Hak Cuti</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">Hak Cuti Bersih</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {balanceSummary.cleanAnnualQuota} <span className="text-xs font-normal text-slate-400">Hari</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {balanceSummary.baseQuota} - {balanceSummary.collectiveLeaveDays} = {balanceSummary.cleanAnnualQuota} Hari
              </div>
            </div>

            <div className="bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-600/50">
              <div className="text-xs text-emerald-300 font-semibold">Sisa Hak Cuti</div>
              <div className="text-2xl font-extrabold text-emerald-300 mt-1">
                {balanceSummary.availableBalance} <span className="text-xs font-normal text-emerald-400">Hari</span>
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                Sisa setelah pengajuan: <strong className="text-white text-xs">{remainingAfterEstimate} Hari</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CUTI YANG AKAN DIAMBIL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">3. Cuti yang Akan Diambil</h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Jumlah cuti diisi manual sesuai kebutuhan
          </span>
        </div>

        {/* Pilihan Jenis Cuti */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase">Jenis Cuti</label>
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
                <div className="text-xs text-slate-500">Mengurangi saldo cuti tahunan karyawan</div>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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

        {/* Input Tanggal & Input Manual Jumlah Hari */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Dari Tanggal <span className="text-red-500">*</span>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              s/d Tanggal <span className="text-red-500">*</span>
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

          {/* Revisi 2: Jumlah Cuti yang Diambil (Input Manual) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Jumlah Cuti Diambil (Hari) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={30}
                value={manualDurationDays}
                onChange={(e) => setManualDurationDays(e.target.value ? Number(e.target.value) : '')}
                placeholder="Misal: 2"
                className="w-full px-3 py-2 text-sm font-bold border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-600 bg-blue-50/30 text-blue-900"
                required
              />
              <span className="absolute right-3 top-2 text-xs font-semibold text-blue-700">Hari</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Input manual (misal: Jumat & Senin dihitung 2 hari).
            </p>
          </div>
        </div>

        {/* Tanggal Kembali Bekerja */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Kembali Bekerja Tanggal
            </label>
            <input
              type="date"
              value={manualResumeWorkDate}
              onChange={(e) => setManualResumeWorkDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">Hari pertama masuk kerja setelah cuti selesai.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nomor Telp Darurat (Selama Cuti)
            </label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="Contoh: 0812-3456-7890"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Alasan Cuti */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Alasan Cuti <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Keperluan Keluarga"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            required
          />
        </div>
      </div>

      {/* 4. Revisi 3: Serah Terima Tugas Dikosongkan untuk Tulis Tangan */}
      <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm flex items-start gap-3">
        <PenTool className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold text-amber-950 mb-0.5">Seksi Serah Terima Tugas Selama Cuti</p>
          <p>
            Sesuai format operasional, bagian serah terima tugas (Kepada, Tugas yang diserahkan, dan Tanda Tangan Penerima) 
            akan dicetak berupa <strong>kolom bergaris titik-titik kosong</strong> pada dokumen F4 agar dapat diisi dan ditandatangani secara <strong>tulis tangan manual</strong> oleh rekan penerima tugas.
          </p>
        </div>
      </div>

      {/* Tombol Aksi */}
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
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-xl shadow-sm transition cursor-pointer"
        >
          {isSubmitting ? 'Menyimpan...' : 'Ajukan Cuti & Cetak Form F4'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
