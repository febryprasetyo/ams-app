# Implementation Plan: Refinement Modul Cuti & Rekapitulasi Saldo Karyawan

**Plan File:** `docs/superpowers/plans/2026-10-19-leave-module-refinement.md`  
**Design Spec:** `docs/superpowers/specs/2026-10-19-leave-module-refinement-design.md`  
**Date:** 2026-10-19  
**Status:** DRAFT (Awaiting Approval)

---

## 1. Shared Types & Contract Baseline

### 1.1 Types Update (`frontend/src/types/leaves.ts`)
- Update `AnnualLeaveConfig`: `allowCarryForward` and `maxCarryForwardDays` marked optional / deprecated (defaults to false / 0).
- Update `MasterLeaveBalanceItem`: `carriedOverQuota` marked optional / deprecated.
- Add interfaces for Approve & Delete responses:
  ```ts
  export interface ApproveLeaveResponse {
    success: boolean;
    message: string;
    data: { id: number; status: string };
  }

  export interface DeleteLeaveResponse {
    success: boolean;
    message: string;
  }
  ```

---

## 2. Phase-by-Phase Tasks

### Phase 1: Backend Routes, Controllers & Unit Tests (TDD)
- [ ] **Task 1.1**: Tulis failing test di `backend/src/controllers/leaveController.test.ts` untuk:
  - `approveLeaveRequest`: Menyetujui request berstatus `PENDING` -> status `APPROVED`, update `leaveApprovals` stage `HRD`.
  - `deleteLeaveRequestDraft`: Menghapus request berstatus `PENDING` dan mengembalikan kuota terpakai (`usedQuota`) jika jenis `ANNUAL`. Menolak penghapusan jika status bukan `PENDING`.
- [ ] **Task 1.2**: Implementasi fungsi `approveLeaveRequest` dan `deleteLeaveRequestDraft` di `backend/src/controllers/leaveController.ts`.
- [ ] **Task 1.3**: Daftarkan routes baru di `backend/src/routes/leaveRoutes.ts`:
  - `PATCH /requests/:id/approve`
  - `DELETE /requests/:id`
- [ ] **Task 1.4**: Jalankan test backend dan pastikan semua lulus (GREEN).

### Phase 2: Navigation & Separation of Pages
- [ ] **Task 2.1**: Update `frontend/src/components/layout/DashboardLayout.tsx`:
  - Tambahkan grup menu `Cuti` di bawah `HR` dengan 3 submenu berurutan:
    1. Pengajuan Cuti (`/dashboard/leaves`)
    2. Rekap Saldo Cuti (`/dashboard/leaves/balances`)
    3. Pengaturan Cuti (`/dashboard/leaves/settings`)
  - Hapus entri lama `Pengajuan Cuti` dan `Pengaturan Cuti` dari dropdown `Attendance`.
  - Tambahkan permission prefix guard untuk `/dashboard/leaves/balances`.
- [ ] **Task 2.2**: Buat halaman baru `frontend/src/app/dashboard/leaves/balances/page.tsx`:
  - Render `AnnualLeaveStatsCards` (4 KPI card) dengan styling Emerald.
  - Render `MasterLeaveBalancesTable` dengan fitur search, pagination, dan filter tahun.
  - Integrasikan `LeaveBalanceEditModal` untuk penyesuaian manual kuota dasar.
- [ ] **Task 2.3**: Rapikan `frontend/src/app/dashboard/leaves/settings/page.tsx`:
  - Fokus eksklusif pada `AnnualLeaveConfigCard` (pengaturan hak dasar, cuti bersama, tahun kalender).
  - Hapus tabel rekapitulasi dan KPI cards dari halaman ini.

### Phase 3: SOP Alignment (Eliminasi Carry Over) & Input Polish
- [ ] **Task 3.1**: Modifikasi `frontend/src/components/leaves/AnnualLeaveConfigCard.tsx`:
  - Hapus switch toggle dan input Carry Over / Rollover.
  - Tambahkan CSS utility `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none` pada input angka (tahun, hak dasar, cuti bersama).
  - Perbarui tema warna header & badge menjadi Emerald.
- [ ] **Task 3.2**: Modifikasi `frontend/src/components/leaves/MasterLeaveBalancesTable.tsx`:
  - Hapus kolom `Sisa Tahun Lalu` / Carry Over.
  - Terapkan pagination interaktif (10 baris per halaman dengan nomor halaman & info jumlah data).
  - Perbarui aksen badge dan tombol ke Emerald.
- [ ] **Task 3.3**: Modifikasi `frontend/src/components/leaves/LeaveBalanceEditModal.tsx`:
  - Hapus input field Carry Over.
  - Tambahkan no-spinner styling pada input kuota dasar.
- [ ] **Task 3.4**: Modifikasi `frontend/src/lib/leaves/masterLeaveUtils.ts`:
  - Pastikan perhitungan sisa saldo mengabaikan carry over (`cleanQuota = baseQuota - collectiveLeaveDays`, `remaining = cleanQuota - usedQuota`).
  - Update unit test `masterLeaveUtils.test.mjs`.

### Phase 4: Permohonan Cuti List Page (Redesign & Actions)
- [ ] **Task 4.1**: Modifikasi `frontend/src/app/dashboard/leaves/page.tsx`:
  - Ubah skema warna dari merah (`red-600`, `red-50`) menjadi **Emerald** (`emerald-600`, `emerald-50`, `text-emerald-700`, `border-emerald-200`).
  - Ganti label tombol aksi "Cetak F4" menjadi **"Print"**.
  - Tambahkan aksi **"Approve"** (HR Manual) untuk permohonan berstatus `PENDING` dengan modal konfirmasi.
  - Tambahkan aksi **"Hapus"** (Delete Draft) untuk permohonan berstatus `PENDING` dengan modal konfirmasi.
  - Tambahkan kontrol pagination interaktif di bagian bawah tabel.
- [ ] **Task 4.2**: Sesuaikan `frontend/src/app/dashboard/leaves/new/page.tsx` & `LeaveRequestForm.tsx`:
  - Pastikan tombol simpan / ajukan dan aksen visual konsisten menggunakan palet Emerald.

### Phase 5: Verification & Quality Gate
- [ ] **Task 5.1**: Jalankan unit test backend (`cd backend && npm test`).
- [ ] **Task 5.2**: Jalankan frontend typecheck (`cd frontend && npx tsc --noEmit`).
- [ ] **Task 5.3**: Jalankan linter dan pastikan clean.
- [ ] **Task 5.4**: Lakukan review visual responsif (desktop & mobile).

---

## 3. Verification Commands
- Backend Tests: `cd backend && npm test`
- Frontend Typecheck: `cd frontend && npx tsc --noEmit`
- Frontend Build Check: `cd frontend && npm run build` (atau linter)
