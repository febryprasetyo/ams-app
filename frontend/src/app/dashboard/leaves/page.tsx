'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  UserCheck
} from 'lucide-react';

interface LeaveItem {
  id: number;
  requestNumber: string;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  resumeWorkDate: string;
  status: string;
  createdAt: string;
}

export default function LeaveRequestsListPage() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaves() {
      try {
        const res = await fetch('/api/leaves/requests');
        if (res.ok) {
          const data = await res.json();
          setLeaves(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch leaves:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaves();
  }, []);

  const filtered = leaves.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      (item.requestNumber || '').toLowerCase().includes(q) ||
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.employeeCode || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Permohonan Cuti Karyawan</h1>
            <p className="text-xs text-slate-500">
              Formulir Cuti Standar PT Cahaya Mas Cemerlang (Cetak F4 Full Page)
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/leaves/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Ajukan Cuti Baru
        </Link>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor permohonan, nama karyawan, NIP, atau alasan..."
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No. Permohonan</th>
                <th className="py-3.5 px-4">Karyawan</th>
                <th className="py-3.5 px-4">Jenis Cuti</th>
                <th className="py-3.5 px-4">Periode Cuti</th>
                <th className="py-3.5 px-4 text-center">Durasi</th>
                <th className="py-3.5 px-4">Kembali Bekerja</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data permohonan cuti...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Belum ada permohonan cuti.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {item.requestNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.employeeName}</div>
                      <div className="text-xs text-slate-400">{item.employeeCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.leaveType === 'ANNUAL'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {item.leaveType === 'ANNUAL' ? 'Cuti Tahunan' : 'Cuti Khusus'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {item.startDate} s/d {item.endDate}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {item.durationDays} Hari
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-emerald-700">
                      {item.resumeWorkDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'APPROVED'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : item.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {item.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {item.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {item.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/leaves/${item.id}/print`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak F4
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
