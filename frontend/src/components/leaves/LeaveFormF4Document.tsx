'use client';

import React from 'react';
import type { FullLeaveDocumentData } from '@/types/leaves';
import { Printer, ArrowLeft, Check, Download } from 'lucide-react';
import Link from 'next/link';

interface LeaveFormF4DocumentProps {
  data: FullLeaveDocumentData;
  backHref?: string;
}

export function LeaveFormF4Document({ data, backHref = '/dashboard/leaves' }: LeaveFormF4DocumentProps) {
  const handlePrint = () => {
    window.print();
  };

  const formatDateIndo = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-black font-sans">
      {/* Action Bar (Hanya Tampil di Layar / Hidden saat Print) */}
      <div className="max-w-[215mm] mx-auto mb-4 flex items-center justify-between no-print bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-800">Form Permohonan Cuti - No: {data.requestNumber}</h1>
            <p className="text-xs text-slate-500">Standar Cetak Kertas F4 (Folio 215 mm × 330 mm) - 1 Halaman Penuh</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Form F4 / PDF
          </button>
        </div>
      </div>

      {/* Dokumen F4 Single Full Page Container */}
      <div
        className="f4-page mx-auto bg-white border border-slate-300 shadow-md print:shadow-none print:border-none print:m-0 box-border"
        style={{
          width: '215mm',
          minHeight: '320mm',
          maxHeight: '330mm',
          padding: '10mm 12mm 8mm 12mm',
          fontSize: '11px',
          lineHeight: '1.25',
          fontFamily: 'Calibri, Arial, sans-serif',
        }}
      >
        <style jsx global>{`
          @page {
            size: 215mm 330mm;
            margin: 8mm 10mm 8mm 10mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: transparent !important;
            }
            .no-print {
              display: none !important;
            }
            .f4-page {
              width: 100% !important;
              max-height: 314mm !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }
          }
          .table-f4 {
            width: 100%;
            border-collapse: collapse;
          }
          .table-f4 th, .table-f4 td {
            border: 1px solid #000;
            padding: 3px 5px;
            vertical-align: middle;
          }
          .section-title {
            background-color: #f2f2f2 !important;
            font-weight: bold;
            font-size: 11.5px;
            border: 1px solid #000;
            padding: 3px 6px;
            letter-spacing: 0.3px;
          }
        `}</style>

        {/* 1. Header Dokumen (Logo, Company, Form No, Rev) */}
        <div className="flex items-center justify-between pb-2 border-b border-black mb-2">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-cmc.png"
              alt="Logo CMC"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Fallback jika logo tidak ter-render
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <span className="text-base font-bold tracking-tight text-black block">Cahaya Mas Cemerlang</span>
            </div>
          </div>
          <div className="text-right text-[10.5px] leading-tight font-sans">
            <div>Form Number : <span className="font-semibold">{data.formNumber || '001'}</span></div>
            <div className="text-[9.5px] text-gray-700">{data.revisionCode || 'REV. 170208-1-W'}</div>
          </div>
        </div>

        {/* Judul Utama Box */}
        <div className="border-2 border-black py-1 text-center font-bold text-sm tracking-wider uppercase mb-2 bg-[#f8f8f8]">
          PERMOHONAN CUTI KARYAWAN
        </div>

        {/* 2. Seksi DATA KARYAWAN */}
        <div className="mb-2">
          <div className="section-title">DATA KARYAWAN</div>
          <table className="table-f4 text-[10.5px] border-t-0">
            <tbody>
              <tr>
                <td className="w-[18%] font-medium">Nama</td>
                <td className="w-[1%] text-center border-l-0 border-r-0">:</td>
                <td className="w-[39%] border-l-0 font-semibold">{data.employee.fullName}</td>
                <td className="w-[18%] font-medium">Dept/Divisi</td>
                <td className="w-[1%] text-center border-l-0 border-r-0">:</td>
                <td className="w-[23%] border-l-0 font-semibold">{data.employee.department}</td>
              </tr>
              <tr>
                <td className="font-medium">NIP/Absen</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0">{data.employee.employeeCode}</td>
                <td className="font-medium">Jabatan</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0">{data.employee.position}</td>
              </tr>
              <tr>
                <td className="font-medium">Tanggal Join Cahaya Mas Cemerlang</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td colSpan={4} className="border-l-0 font-medium">{formatDateIndo(data.employee.joinDate) || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Seksi HAK DAN SISA CUTI KARYAWAN */}
        <div className="mb-2">
          <div className="section-title">HAK DAN SISA CUTI KARYAWAN</div>
          <table className="table-f4 text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[60%]">Periode Cuti Tahunan</td>
                <td className="w-[2%] text-center border-l-0 border-r-0">:</td>
                <td className="w-[38%] border-l-0" colSpan={2}>Januari {data.balanceYear} - Desember {data.balanceYear}</td>
              </tr>
              <tr>
                <td>Jumlah Hak Cuti Tahunan</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-medium">
                  {data.baseQuota} - {data.collectiveLeaveDays} = {data.cleanAnnualQuota}
                </td>
                <td className="w-[15%] text-right font-medium">Hari</td>
              </tr>
              <tr>
                <td>Jumlah Cuti yang sudah diambil sebelumnya</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-medium">
                  {data.historyItems.filter(h => h.description).length > 0 ? '-' : '0'}
                </td>
                <td className="text-right font-medium">Hari</td>
              </tr>

              {/* Rincian 1 - 5 */}
              {(data.historyItems && data.historyItems.length > 0
                ? data.historyItems.slice(0, 5)
                : [1, 2, 3, 4, 5].map(n => ({ no: n, description: '' }))
              ).map((item, idx) => (
                <tr key={idx} className="h-[18px]">
                  <td colSpan={4} className="pl-4 text-[10px]">
                    <span className="inline-block w-4 font-semibold">{idx + 1}.</span>{' '}
                    <span>{item.description || ''}</span>
                  </td>
                </tr>
              ))}

              <tr>
                <td>Sisa Hak Cuti yang bisa diambil</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-bold">{data.availableBefore}</td>
                <td className="text-right font-medium">Hari</td>
              </tr>
              <tr>
                <td>Cuti yang akan diambil sekarang</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-bold">{data.leaveDaysRequested}</td>
                <td className="text-right font-medium">Hari</td>
              </tr>
              <tr>
                <td className="font-semibold">Sisa Hak Cuti setelah dikurangi Cuti yang akan diambil</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-bold text-base">{data.remainingAfter}</td>
                <td className="text-right font-medium">Hari</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Seksi CUTI YANG AKAN DIAMBIL */}
        <div className="mb-2">
          <div className="section-title">CUTI YANG AKAN DIAMBIL</div>
          <table className="table-f4 text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[20%]">Alasan Cuti</td>
                <td className="w-[2%] text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-medium" colSpan={4}>{data.reason}</td>
              </tr>
              <tr>
                <td rowSpan={2} className="align-top pt-1">Cuti yang diambil</td>
                <td rowSpan={2} className="text-center border-l-0 border-r-0 align-top pt-1">:</td>
                <td className="border-l-0" colSpan={4}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-4 h-4 border border-black text-xs font-bold">
                      {data.leaveType === 'ANNUAL' ? '✓' : ''}
                    </span>
                    <span>Cuti Tahunan *)</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border-l-0" colSpan={4}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-4 h-4 border border-black text-xs font-bold">
                      {data.leaveType === 'SPECIAL' ? '✓' : ''}
                    </span>
                    <span>
                      Cuti Khusus (Menikah/Melahirkan/Kematian/Lain-lain) **)
                      {data.specialLeaveReason && ` : ${data.specialLeaveReason}`}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Dari Tanggal</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-semibold">{formatDateIndo(data.startDate)}</td>
                <td className="w-[14%] text-center">s/d Tanggal :</td>
                <td className="font-semibold">{formatDateIndo(data.endDate)}</td>
                <td className="w-[14%] text-right font-bold">( {data.leaveDaysRequested} Hari )</td>
              </tr>
              <tr>
                <td>Kembali Bekerja Tgl</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td colSpan={4} className="border-l-0 font-bold text-green-800">
                  {formatDateIndo(data.resumeWorkDate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Seksi CATATAN HRD */}
        <div className="mb-2">
          <div className="section-title">CATATAN HRD</div>
          <div className="border border-black border-t-0 p-2 min-h-[42px] text-[10px]">
            {data.hrdNotes || <span className="text-transparent">.</span>}
          </div>
        </div>

        {/* 6. Seksi SERAH TERIMA TUGAS SELAMA CUTI */}
        <div className="mb-2">
          <div className="section-title">SERAH TERIMA TUGAS SELAMA CUTI</div>
          <table className="table-f4 text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-[30%]">Kepada</td>
                <td className="w-[2%] text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-medium">{data.handover.recipientName || '-'}</td>
              </tr>
              <tr>
                <td>Tugas yang akan diserahkan</td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-medium">{data.handover.taskDescription || '-'}</td>
              </tr>
              <tr>
                <td>
                  <div>Nomor Telp yang bisa dihubungi</div>
                  <div className="text-[9.5px] italic text-gray-700">(selama cuti)</div>
                </td>
                <td className="text-center border-l-0 border-r-0">:</td>
                <td className="border-l-0 font-semibold">{data.handover.emergencyPhone || '-'}</td>
              </tr>
              <tr>
                <td className="h-[28px] align-bottom">Tanda Tangan Penerima</td>
                <td className="text-center border-l-0 border-r-0 align-bottom">:</td>
                <td className="border-l-0 align-bottom italic text-[9.5px] text-gray-600">
                  ( ............................................................ )
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 7. Seksi KOLOM TANDA TANGAN PERSETUJUAN */}
        <div className="mb-2">
          <div className="section-title text-center">KOLOM TANDA TANGAN PERSETUJUAN</div>
          <table className="table-f4 text-[10px] text-center border-t-0">
            <thead>
              <tr className="bg-slate-50 font-semibold">
                <td className="w-[25%] py-1">Pemohon</td>
                <td className="w-[25%] py-1">Atasan Langsung</td>
                <td className="w-[25%] py-1">HRD</td>
                <td className="w-[25%] py-1">Atasan dari Atasan Langsung</td>
              </tr>
            </thead>
            <tbody>
              {/* Kotak Tanda Tangan */}
              <tr className="h-[52px]">
                <td className="align-middle">
                  {data.approvals.applicant.status === 'APPROVED' ? (
                    <div className="inline-block border border-green-700 text-green-800 px-2 py-0.5 text-[9px] font-bold rounded">
                      ✓ SUBMITTED
                    </div>
                  ) : null}
                </td>
                <td className="align-middle">
                  {data.approvals.directSupervisor.status === 'APPROVED' ? (
                    <div className="inline-block border border-blue-700 text-blue-800 px-2 py-0.5 text-[9px] font-bold rounded">
                      ✓ APPROVED
                    </div>
                  ) : null}
                </td>
                <td className="align-middle">
                  {data.approvals.hrd.status === 'APPROVED' ? (
                    <div className="inline-block border border-indigo-700 text-indigo-800 px-2 py-0.5 text-[9px] font-bold rounded">
                      ✓ APPROVED
                    </div>
                  ) : null}
                </td>
                <td className="align-middle">
                  {data.approvals.higherSupervisor.status === 'APPROVED' ? (
                    <div className="inline-block border border-purple-700 text-purple-800 px-2 py-0.5 text-[9px] font-bold rounded">
                      ✓ APPROVED
                    </div>
                  ) : null}
                </td>
              </tr>
              {/* Nama & Tanggal */}
              <tr className="text-left text-[9.5px] leading-tight">
                <td className="p-1">
                  <div>Nama : <span className="font-semibold">{data.approvals.applicant.name || data.employee.fullName}</span></div>
                  <div>Tanggal : <span>{formatDateIndo(data.approvals.applicant.date) || '-'}</span></div>
                </td>
                <td className="p-1">
                  <div>Nama : <span className="font-semibold">{data.approvals.directSupervisor.name || ''}</span></div>
                  <div>Tanggal : <span>{formatDateIndo(data.approvals.directSupervisor.date) || ''}</span></div>
                </td>
                <td className="p-1">
                  <div>Nama : <span className="font-semibold">{data.approvals.hrd.name || ''}</span></div>
                  <div>Tanggal : <span>{formatDateIndo(data.approvals.hrd.date) || ''}</span></div>
                </td>
                <td className="p-1">
                  <div>Nama : <span className="font-semibold">{data.approvals.higherSupervisor.name || ''}</span></div>
                  <div>Tanggal : <span>{formatDateIndo(data.approvals.higherSupervisor.date) || ''}</span></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 8. Footer Catatan Kaki */}
        <div className="text-[9px] text-gray-700 pt-1 border-t border-dotted border-gray-400">
          <div>*) Check List yang diperlukan</div>
          <div>**) Check List dan Lingkari Yang Diperlukan</div>
        </div>
      </div>
    </div>
  );
}
