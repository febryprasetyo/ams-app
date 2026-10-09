# Rencana Pengembangan Fitur

Status: draft

Dokumen ini mencatat prioritas pengembangan berikutnya. Detail implementasi yang sudah tersedia tetap dirujuk dari dokumen desain dan rencana teknis terkait.

## Prioritas 1: Asset Management Dashboard dan Role-Based Super App Landing (Selesai)

Tujuan: menyediakan halaman awal yang relevan untuk setiap peran, serta dashboard aset operasional untuk tim Admin dan IT.

Ruang lingkup:

- Dashboard aset untuk Admin dan IT: total aset, status aset, tren pengadaan, distribusi aset menurut departemen dan kategori, serta daftar aset terbaru.
- Landing page berdasarkan peran:
  - Admin, IT Admin, dan IT Staff menuju dashboard aset.
  - HR menuju dashboard absensi.
  - Employee menuju workspace karyawan.
  - Management menuju workspace manajemen.
  - Peran yang belum dipetakan menuju halaman sambutan yang aman.
- Menu Dashboard di sidebar menyesuaikan peran pengguna.
- Tambahan data operasional aset: tanggal pembelian dan tanggal berakhirnya garansi.

Kriteria selesai:

- Pengguna mendarat di dashboard yang sesuai setelah masuk aplikasi.
- Data ringkasan dashboard berasal dari API dan data aset aktual, bukan data contoh.
- Halaman inventaris aset yang ada tetap dapat digunakan.
- Tampilan dashboard dapat digunakan di desktop dan perangkat seluler.

Referensi:

- [Design spec](../superpowers/specs/2026-10-08-asset-dashboard-role-landing-design.md)
- [Implementation plan](../superpowers/plans/2026-10-08-asset-dashboard-role-landing.md)

## Prioritas 2: HR Reconciliation Manual User/Employee Filter dan Selection (Selesai)

Tujuan: memberi HR cara untuk menemukan dan memilih karyawan secara manual saat hasil rekonsiliasi custodian tidak menemukan kecocokan yang tepat.

Ruang lingkup:

- Tab untuk berpindah antara rekomendasi sistem dan pencarian karyawan manual.
- Pencarian berdasarkan nama, NIP, dan departemen.
- Pemilihan satu karyawan dari daftar hasil pencarian.
- Penanda bila karyawan yang dipilih sudah memiliki custodian aktif.
- Aksi lanjutan yang jelas: menghubungkan custodian ke karyawan atau menggunakan proses merge saat terjadi konflik.

Kriteria selesai:

- HR dapat mencari dan memilih karyawan aktif tanpa bergantung pada rekomendasi otomatis.
- Konflik custodian aktif terlihat sebelum HR menyimpan perubahan.
- Nilai seleksi manual dipakai oleh proses link atau merge yang sudah ada.
- Interaksi tab, pencarian, pemilihan, dan penanganan konflik tercakup oleh pengujian.

Referensi:

- [Design spec](../superpowers/specs/2026-10-08-hr-reconciliation-manual-user-filter-design.md)
- [Implementation plan](../superpowers/plans/2026-10-08-hr-reconciliation-manual-user-filter.md)

## Prioritas 3: Perhitungan dan Form Pengajuan Cuti Tahunan

Tujuan: mengelola kuota cuti tahunan per karyawan, pengajuan cuti, dan pengurangan kuota cuti bersama berdasarkan kalender yang diatur HRD.

Aturan bisnis awal:

- Pada awal setiap tahun kalender, kuota cuti tahunan setiap karyawan direset menjadi 12 hari.
- HRD mengisi kalender cuti bersama untuk tahun berjalan, termasuk tanggal dan jumlah hari yang berlaku.
- Jumlah hari cuti bersama mengurangi kuota cuti tahunan. Contoh: bila HRD menetapkan 4 hari cuti bersama, saldo awal yang tersedia untuk cuti pribadi adalah 8 hari.
- Cuti pribadi yang telah disetujui juga mengurangi saldo yang tersedia.
- Sistem menolak pengajuan yang melebihi saldo tersedia atau bertabrakan dengan tanggal yang sudah berstatus cuti bersama.

Ruang lingkup rilis awal:

- Konfigurasi tahun cuti oleh HRD: tahun, kuota dasar (default 12), dan daftar tanggal cuti bersama.
- Saldo cuti per karyawan yang menampilkan kuota dasar, pemakaian cuti bersama, pemakaian cuti pribadi yang disetujui, dan sisa saldo.
- Form pengajuan cuti karyawan: tanggal mulai, tanggal selesai, alasan, jumlah hari kerja, dan status pengajuan.
- Alur persetujuan HRD atau atasan yang ditetapkan, beserta riwayat keputusan.
- Integrasi dengan data absensi agar tanggal cuti yang disetujui tercatat sebagai `CUTI`.
- Pengingat kepada HRD untuk melengkapi kalender cuti bersama sebelum periode pengajuan dibuka.

Kriteria selesai:

- HRD dapat mengatur kalender cuti dan melihat dampaknya terhadap saldo seluruh karyawan.
- Karyawan dapat melihat saldo yang sama dengan perhitungan sistem sebelum mengajukan cuti.
- Cuti bersama dan cuti pribadi tidak dihitung dua kali.
- Reset tahunan dapat dijalankan dengan aman, terdokumentasi, dan tidak mengubah histori tahun sebelumnya.
- Perubahan kalender cuti bersama setelah ada pengajuan dapat ditelusuri melalui riwayat perubahan.

Keputusan yang perlu ditetapkan sebelum implementasi:

- Apakah karyawan baru di tengah tahun mendapat kuota penuh, proporsional, atau diatur manual oleh HRD?
- Apakah sisa cuti dapat dibawa ke tahun berikutnya?
- Siapa pemberi persetujuan untuk setiap karyawan: atasan, HRD, atau keduanya?
- Apakah Sabtu, Minggu, hari libur nasional, dan cuti bersama dikecualikan dari hitungan durasi cuti pribadi?
- Bagaimana penanganan cuti yang sudah disetujui jika HRD mengubah kalender cuti bersama?

Catatan teknis awal:

- Perlu memisahkan cuti pribadi dan cuti bersama pada sumber data agar laporan absensi tidak salah menghitung keduanya sebagai pemakaian cuti pribadi.
- Kuota tahunan, kalender cuti bersama, saldo per karyawan, pengajuan, dan riwayat persetujuan perlu memiliki data historis per tahun.
- Aturan reset perlu bersifat idempoten agar proses yang dijalankan ulang tidak menggandakan kuota.

## Urutan Pelaksanaan yang Disarankan

1. Selesaikan dashboard aset dan landing berbasis role karena fondasi rute serta halaman awalnya telah memiliki design spec dan implementation plan.
2. Selesaikan pencarian manual rekonsiliasi HR karena ruang lingkupnya terisolasi pada alur custodian yang sudah ada.
3. Tetapkan keputusan kebijakan cuti, lalu buat design spec dan implementation plan sebelum mulai mengubah skema, API, atau antarmuka.
