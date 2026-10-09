# Prioritas 3: Perhitungan dan Form Pengajuan Cuti Tahunan (F4)

- **Status**: Dalam Verifikasi
- **Terakhir Diperbarui**: 2026-10-09
- **Referensi Spec**: [Design Spec](../superpowers/specs/2026-10-09-leave-request-form-design.md)
- **Referensi Plan**: [Implementation Plan](../superpowers/plans/2026-10-09-leave-request-form.md)

## Tujuan
Mengelola kuota cuti tahunan per karyawan, pengajuan cuti, formulir cetak standar F4, dan sinkronisasi saldo kuota cuti bersama berdasarkan kalender yang diatur HRD.

## Ruang Lingkup
- Konfigurasi kuota dasar (default 12 hari) dan kalender cuti bersama oleh HRD.
- Saldo cuti per karyawan: kuota dasar, cuti bersama, cuti pribadi yang disetujui, dan sisa saldo.
- Form pengajuan cuti karyawan: pilihan rentang tanggal otomatis atau input manual hari cuti.
- Handover tugas dan catatan serah terima (mendukung formulir kosong/tulisan tangan).
- Cetak dokumen resmi format ukuran kertas F4 full-page.
- Alur routing API client melalui v1 proxy.

## Kriteria Selesai
- [x] HRD dapat mengatur kalender cuti dan melihat dampaknya terhadap saldo karyawan.
- [x] Karyawan dapat melihat saldo yang sama dengan perhitungan sistem sebelum mengajukan.
- [x] Cuti bersama dan cuti pribadi tidak dihitung dua kali.
- [x] Form input mendukung tanggal, hitungan hari, dan cetak dokumen F4.
- [ ] Verifikasi menyeluruh end-to-end alur cuti & pengujian sistem.

## Checkpoint Git
- [x] `b6de722` feat(leaves): add database schema and migrations for leave requests and holidays
- [x] `22a530f` feat(leaves): implement leave calculation domain, controller, and routes
- [x] `602c49c` feat(leaves): implement leave request form, management page, and F4 full-page print document
- [x] `ab00d43` fix(leaves): support manual leave days input, blank handwritten handover, and fix employee dropdown
- [x] `11637f3` fix(leaves): route client leave API calls through v1 proxy
- [ ] Verifikasi seluruh kriteria selesai dan pengujian akhir alur cuti.
