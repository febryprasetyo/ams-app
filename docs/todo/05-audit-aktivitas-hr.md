# Prioritas 5: Perombakan Aktivitas Absensi untuk Audit Perubahan HR

- **Status**: Rencana (Backlog)
- **Terakhir Diperbarui**: 2026-10-09
- **Referensi Spec**: Belum dibuat (buat di `docs/superpowers/specs/` sebelum implementasi)
- **Referensi Plan**: Belum dibuat (buat di `docs/superpowers/plans/` sebelum implementasi)

## Tujuan
Menyediakan riwayat audit yang lengkap untuk setiap perubahan data yang dilakukan melalui menu HR, sehingga tim HR dapat menelusuri siapa yang melakukan perubahan, kapan terjadi, aksi yang dilakukan, dan objek perubahannya.

## Ruang Lingkup
- Catat seluruh aksi mutasi data dari setiap fitur dalam menu HR (tambah, ubah, hapus, impor, hubungkan, pisahkan, setujui, tolak, batalkan, aksi massal).
- Setiap entri memuat waktu, aksi, pengguna pelaku, dan keterangan objek yang terdampak.
- Impor mencatat ringkasan hasil (sumber, jumlah berhasil, jumlah gagal, alasan kegagalan).
- Aksi hapus mencatat identitas data sebelum dihapus.
- Riwayat audit bersifat hanya-tambah (append-only), tidak dapat diedit atau dihapus dari UI.
- Filter dan pencarian berdasarkan rentang waktu, jenis aksi, pengguna, dan kata kunci objek.

## Kriteria Selesai
- [ ] Semua endpoint mutasi data HR menghasilkan entri audit yang konsisten.
- [ ] Login tidak dicatat pada audit data absensi/HR.
- [ ] Data audit tetap ada meskipun data sumber dihapus (tahan penghapusan relasi).
- [ ] Pengujian automated mencakup setiap jenis aksi utama.

## Checkpoint Git
- [ ] Belum ada commit implementasi.
