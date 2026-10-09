# Roadmap & Todo Pengembangan Fitur AMS

Dokumen ini adalah **indeks utama roadmap**. Setiap item prioritas dipecah ke berkas terpisah untuk efisiensi konteks dan token. Rincian arsitektur teknis merujuk langsung ke dokumen [Design Spec](../superpowers/specs/) dan [Implementation Plan](../superpowers/plans/).

---

## Ringkasan Prioritas & Status

| No | Inisiatif / Fitur | Status | File Detail | Spec / Plan |
|---|---|---|---|---|
| **01** | Asset Management Dashboard & Role Landing | **Selesai** | [01-asset-management-dashboard.md](./01-asset-management-dashboard.md) | [Spec](../superpowers/specs/2026-10-08-asset-dashboard-role-landing-design.md) \| [Plan](../superpowers/plans/2026-10-08-asset-dashboard-role-landing.md) |
| **02** | HR Reconciliation Manual Employee Filter | **Selesai** | [02-hr-reconciliation-filter.md](./02-hr-reconciliation-filter.md) | [Spec](../superpowers/specs/2026-10-08-hr-reconciliation-manual-user-filter-design.md) \| [Plan](../superpowers/plans/2026-10-08-hr-reconciliation-manual-user-filter.md) |
| **03** | Perhitungan & Form Pengajuan Cuti Tahunan (F4) | **Dalam Verifikasi** | [03-pengajuan-cuti-tahunan.md](./03-pengajuan-cuti-tahunan.md) | [Spec](../superpowers/specs/2026-10-09-leave-request-form-design.md) \| [Plan](../superpowers/plans/2026-10-09-leave-request-form.md) |
| **04** | Attendance Engine Hardening, DB Sync & Strict Toggle | **Selesai** | [04-attendance-engine-hardening.md](./04-attendance-engine-hardening.md) | [Spec](../superpowers/specs/2026-10-09-attendance-db-persistence-design.md) \| [Plan](../superpowers/plans/2026-10-09-attendance-db-persistence.md) |
| **05** | Perombakan Aktivitas Absensi untuk Audit HR | **Rencana** | [05-audit-aktivitas-hr.md](./05-audit-aktivitas-hr.md) | *Menunggu tahap perancangan* |

---

## Petunjuk Penggunaan (Token-Efficient Workflow)

1. **Melihat status global**: Cukup buka file indeks ini ([README.md](./README.md)).
2. **Mengerjakan fitur tertentu**: Buka HANYA file detail fitur tersebut (misal [03-pengajuan-cuti-tahunan.md](./03-pengajuan-cuti-tahunan.md)) untuk menghemat token dan fokus pada checklist & checkpoint yang sedang aktif.
3. **Aturan Checkpoint Git**:
   - Beri tanda `[x]` pada checkpoint hanya setelah commit Git terverifikasi secara lokal.
   - Status berubah menjadi **Selesai** bila semua kriteria selesai telah diuji.
