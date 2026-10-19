# Design Spec: Refinement Modul Cuti & Rekapitulasi Saldo Karyawan

**Document Version:** 1.0.0  
**Date:** 2026-10-19  
**Status:** DRAFT (Awaiting User Review)

---

## 1. Summary & Problem Statement

Halaman pengaturan cuti (`/dashboard/leaves/settings`) saat ini menggabungkan konfigurasi kebijakan tahunan dan tabel rekapitulasi saldo karyawan ke dalam satu halaman yang padat. Selain itu, terdapat ketidakharmonisan visual (warna bernuansa indigo/purple yang terasa seperti template AI, bukan hijau/emerald khas aplikasi), fitur Carry Over yang tidak sesuai SOP perusahaan, panah scroll (spinner) pada input angka yang mengganggu tampilan, ketiadaan pagination, serta ketiadaan alur aksi manual persetujuan (Approve) dan pembatalan draft oleh HR setelah dokumen fisik dicetak dan disetujui atasan.

Perbaikan ini merevisi modul Cuti secara menyeluruh agar terintegrasi sempurna dengan desain sistem utama aplikasi (Emerald & Slate neutral), memisahkan halaman sesuai peruntukannya, menyelaraskan alur SOP riil perusahaan, dan merapikan struktur menu navigasi.

---

## 2. Goals & Non-Goals

### Goals
1. **Pemisahan Halaman**:
   - Memisahkan pengaturan kebijakan cuti tahunan (`/dashboard/leaves/settings`) dengan rekapitulasi saldo karyawan (`/dashboard/leaves/balances`).
2. **Penyelarasan Warna & Vibe Desain**:
   - Menghilangkan warna ungu/indigo template AI dan merah pada modul cuti; menerapkan palet warna konsisten aplikasi: **Emerald** (`emerald-600`, `emerald-700`, `emerald-50`, `border-emerald-200`) dipadu neutral Slate yang bersih dan elegan.
3. **Pembersihan SOP (Eliminasi Carry Over)**:
   - Menghapus aturan dan tampilan Carry Over / Rollover dari Pengaturan Cuti, Tabel Saldo Karyawan, dan Modal Edit Saldo.
4. **Penyempurnaan Form Input**:
   - Menghilangkan spinner arrow (panah scroll atas/bawah) pada form input angka (tahun kalender, hak dasar cuti, dan cuti bersama).
5. **Penempatan KPI Cards**:
   - Memindahkan 4 kartu statistik KPI (Total Karyawan, Sisa Rata-rata, Cuti Terpakai, Total Kuota) ke halaman baru Rekapitulasi Saldo Cuti (`/dashboard/leaves/balances`) dengan tema Emerald.
6. **Pagination Interaktif**:
   - Menambahkan pagination yang bersih dan rapi pada tabel daftar permohonan cuti dan tabel rekapitulasi saldo karyawan.
7. **Pengelompokan Menu Navigasi**:
   - Membuat menu grup tersendiri **"Cuti"** di sidebar di bawah HR dengan urutan:
     1. **Pengajuan Cuti** (`/dashboard/leaves`)
     2. **Rekap Saldo Cuti** (`/dashboard/leaves/balances`)
     3. **Pengaturan Cuti** (`/dashboard/leaves/settings`)
8. **Alur Persetujuan HR Manual (Approve)**:
   - Menambahkan endpoint dan tombol aksi HR untuk menyetujui permohonan cuti berstatus `PENDING` setelah dokumen fisik disetujui atasan. Status berubah menjadi `APPROVED` dan tahap persetujuan HRD tertandatangani tanggal hari ini.
9. **Penyesuaian Label Aksi**:
   - Mengubah tombol label "Cetak F4" menjadi **"Print"** pada tabel permohonan cuti.
10. **Aksi Hapus Draft Pengajuan**:
    - Menambahkan endpoint dan tombol aksi hapus untuk pengajuan yang berstatus `PENDING`. Jika cuti tahunan, kuota terpakai dikembalikan secara otomatis ke saldo karyawan (`usedQuota` di-refund).

### Non-Goals
- Tidak merombak format cetak F4 dokumen cuti yang sudah ada (`LeaveFormF4Document.tsx`).
- Tidak mengubah skema database secara destruktif (kolom `carried_over_quota` tetap ada di DB untuk kompatibilitas data lama, namun tidak diaktifkan/ditampilkan di UI dan business logic di-bypass).

---

## 3. Architecture & Routing

### 3.1 Sitemap & Rute Modul Cuti
```
/dashboard/leaves                -> Daftar Pengajuan Cuti (List, Search, Pagination, Approve, Delete, Print)
/dashboard/leaves/new            -> Form Pengajuan Cuti Baru (Emerald Theme)
/dashboard/leaves/[id]/print     -> Pratinjau & Cetak Dokumen F4
/dashboard/leaves/balances       -> Rekapitulasi Saldo Karyawan (KPI Cards, Search, Pagination, Edit Saldo)
/dashboard/leaves/settings       -> Pengaturan Cuti Tahunan (Tahun, Hak Dasar, Kalender Cuti Bersama)
```

### 3.2 Sidebar Menu Structure (`DashboardLayout.tsx`)
```ts
{
  title: 'HR',
  items: [
    {
      name: 'Attendance',
      icon: CalendarCheck,
      children: [
        { name: 'Ringkasan HR', href: '/dashboard/attendance/overview', ... },
        { name: 'Data Absensi', href: '/dashboard/attendance', ... },
        { name: 'Impor Absensi', href: '/dashboard/attendance/imports', ... },
        ...
      ],
    },
    {
      name: 'Cuti',
      icon: CalendarDays,
      children: [
        { name: 'Pengajuan Cuti', href: '/dashboard/leaves', icon: FileText, permission: 'attendance.view' },
        { name: 'Rekap Saldo Cuti', href: '/dashboard/leaves/balances', icon: Users, permission: 'attendance.view' },
        { name: 'Pengaturan Cuti', href: '/dashboard/leaves/settings', icon: Settings, permission: 'attendance.manage' },
      ],
    },
    {
      name: 'Master Data',
      icon: Database,
      ...
    }
  ]
}
```

---

## 4. API Specifications

### 4.1 `PATCH /api/v1/leaves/requests/:id/approve`
- **Tujuan**: Menyetujui permohonan cuti secara manual oleh HR.
- **Permission**: `attendance.manage`
- **Request Params**: `id` (number)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Permohonan cuti berhasil disetujui oleh HRD",
    "data": { "id": 12, "status": "APPROVED" }
  }
  ```
- **Database Logic**:
  - Validasi bahwa permohonan berstatus `PENDING`.
  - Update `leaveRequests.status = 'APPROVED'`.
  - Update `leaveApprovals` (stage: `'HRD'`) dengan `status = 'APPROVED'`, `signatureDate = today()`, dan approver dari sesi pengguna HR.

### 4.2 `DELETE /api/v1/leaves/requests/:id`
- **Tujuan**: Menghapus draft pengajuan cuti yang belum disetujui.
- **Permission**: `attendance.manage` (atau pemohon jika draft)
- **Request Params**: `id` (number)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Draft permohonan cuti berhasil dihapus dan saldo telah dipulihkan"
  }
  ```
- **Database Logic**:
  - Cek `status === 'PENDING'`. Jika bukan `PENDING`, tolak penghapusan (400 Bad Request).
  - Jika `leaveType === 'ANNUAL'`, kembalikan kuota:
    `UPDATE leave_balances SET used_quota = GREATEST(0, used_quota - durationDays) WHERE employee_id = request.employeeId AND year = request.balanceYear`.
  - Hapus data `leaveApprovals` (cascading) dan `leaveRequests`.

---

## 5. Frontend & UI/UX Specifications

### 5.1 Standar Warna Aplikasi
- **Primary / Brand Action**: Emerald-600 (`#059669`), hover Emerald-700 (`#047857`), soft background Emerald-50 (`#ecfdf5`), border Emerald-200 (`#a7f3d0`).
- **Surface**: Background `bg-white dark:bg-slate-900`, card `border-slate-200 dark:border-slate-800`, text `text-slate-800 dark:text-slate-100`.
- **Hapus Seluruh Aksen**: Hapus kelas CSS `indigo-*`, `purple-*`, `red-*` pada tombol aksi utama dan header.

### 5.2 Form Input Spinner Removal
- Pada input `type="number"` (tahun, hak dasar, cuti bersama), terapkan class:
  `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`.

### 5.3 Komponen Pagination Standar
- Tampilkan navigasi pagination:
  - Info: "Menampilkan 1 - 10 dari 45 data"
  - Tombol: "Sebelumnya", "1, 2, 3...", "Berikutnya"
  - Dropdown limit baris per halaman (10, 25, 50).

### 5.4 Aksi Tabel Pengajuan Cuti
- Kolom Aksi berisi:
  - Tombol **"Print"** (Ikon Printer, warna abu/slate neutral, membuka pratinjau F4).
  - Tombol **"Approve"** (Hanya tampil jika status `PENDING`, ikon CheckCircle warna Emerald).
  - Tombol **"Hapus"** (Hanya tampil jika status `PENDING`, ikon Trash2 warna Rose lembut dengan konfirmasi modal).

---

## 6. Security & Audit Trail

- Endpoint persetujuan dan penghapusan draft dilindungi middleware autentikasi dan otorisasi hak akses `attendance.manage`.
- Perubahan saldo dicatat dengan timestamp `updated_at`.
- Penolakan penghapusan untuk dokumen yang sudah `APPROVED` menjaga integritas audit historis cuti.

---

## 7. Verification & Testing

- Unit test logic kalkulasi saldo cuti tanpa carry over.
- Integrasi endpoint approve dan delete draft cuti.
- TypeScript static check (`tsc --noEmit`) pada backend dan frontend.
- Verifikasi visual alur UI pada viewport desktop dan mobile.
