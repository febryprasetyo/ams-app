# Master Desain GAJIANICH / AMS — Emerald Enterprise

> **Golden Rule**: Dilarang keras menggunakan gaya "AI Vibe" (background kartu gelap, gradient ungu/indigo/neon, glow shadow, floating glassmorphism, atau pill badge bertumpuk yang aneh).  
> **Referensi pola halaman**: [`frontend/src/components/master/EmployeeDirectoryPage.tsx`](frontend/src/components/master/EmployeeDirectoryPage.tsx) (Halaman Data Karyawan).
> Seluruh halaman master data, rekapitulasi, pengaturan, dan transaksi di dashboard AMS **wajib** mengikuti struktur, warna, dan komponen di dokumen ini.

---


## 0. Status master dan aturan untuk agen

**Berlaku sejak 19 Oktober 2026.** Dokumen ini adalah acuan normatif tunggal untuk desain aplikasi.
Arah desain berasal dari instruksi pengguna untuk mempertahankan tema yang sudah dipakai.
Tidak diperlukan pemilihan arah visual baru untuk setiap fitur.

Urutan acuan visual:

1. Instruksi eksplisit pengguna untuk perubahan desain pada tugas yang sedang dikerjakan.
2. Master ini, termasuk aturan aksesibilitas pada bagian 10.
3. Komponen referensi pada bagian 8, sesuai jenis halaman.
4. Catatan kebutuhan halaman atau modul yang tetap tunduk pada master.

Contoh kelas di bawah adalah resep tampilan dari aplikasi saat ini, bukan komponen siap pakai.
Saat menyalin resep, terapkan aturan label, fokus, kontras, dan target sentuh pada bagian 10.
Jangan menyalin logika bisnis, autentikasi, atau kekurangan aksesibilitas halaman referensi.

Permintaan fitur baru tidak mengizinkan agen mengubah identitas visual. Jangan mengubah master
atau token global agar desain buatan agen menjadi seolah-olah sesuai. Jika pola baru diperlukan,
susun kontennya dengan token dan komponen existing. Perubahan palet/font/shell memerlukan
permintaan eksplisit pengguna. Perbedaan pada halaman lama bukan preseden untuk gaya baru.

**Cakupan:** master data, HR, IT & aset, GA, transaksi, laporan, pengaturan, dan komponen bersama.
Dokumen cetak mempertahankan ukuran kertas dan struktur dokumen bisnisnya; jangan memaksakan
sidebar atau kartu dashboard ke hasil cetak. Login mempertahankan layout autentikasi existing.

## 1. Skema Warna Standar (Emerald Enterprise)

- **Warna Utama (Brand / Primary)**: Emerald (`emerald-600`, hover `emerald-700`, active `emerald-800`).
- **Warna Latar Permukaan (Surface / Background)**:
  - Page Background: `bg-slate-50/50` atau default layout background.
  - Card & Container: `bg-white border border-slate-200 shadow-sm rounded-2xl`.
  - Input & Form Fields: `bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900`.
- **Warna Teks**:
  - Judul Halaman: `text-2xl font-extrabold text-slate-900 tracking-tight`.
  - Subjudul / Helper: `text-xs text-slate-500`.
  - Label Kolom / Metric: `text-[11px] text-slate-400 uppercase tracking-wider font-mono`.
  - Isi Tabel / Data: `text-xs text-slate-700 font-medium`.
- **Status Tones**:
  - Aktif / Approved / Sukses: `bg-emerald-50 text-emerald-700 border border-emerald-200` (Dot: `bg-emerald-500`).
  - Menunggu / Pending: `bg-amber-50 text-amber-700 border border-amber-200` (Dot: `bg-amber-500`).
  - Nonaktif / Resign / Ditolak: `bg-slate-100 text-slate-600 border border-slate-200` atau `bg-rose-50 text-rose-700 border border-rose-200`.

---

## 2. Struktur Header Halaman

Setiap halaman modul memiliki header dengan icon hijau, judul tebal, subjudul kecil, dan tombol aksi di kanan:

```tsx
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
      <Icon className="w-6 h-6 text-emerald-600" />
      <span>{Judul Halaman}</span>
    </h1>
    <p className="text-xs text-slate-500 mt-1">
      {Deskripsi ringkas fungsi halaman untuk operasional.}
    </p>
  </div>

  <div className="flex flex-wrap items-center gap-2.5">
    {/* Tombol Sekunder (Putih Border Abu-abu) */}
    <button
      type="button"
      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
    >
      <RefreshCw className="w-4 h-4 text-emerald-600" />
      Muat Ulang
    </button>

    {/* Tombol Utama (Hijau Emerald Solid) */}
    <Link
      href="/dashboard/.../new"
      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      Tambah Data
    </Link>
  </div>
</div>
```

---

## 3. Kartu Ringkasan / KPI Stats Cards

Gunakan grid 3 atau 4 kolom dengan kotak icon berwarna pastel lembut di sebelah kiri dan angka besar di sebelah kanan:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    { label: 'KARYAWAN AKTIF', value: 242, icon: <Users className="w-5 h-5" />, tone: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    { label: 'DEPARTEMEN', value: 24, icon: <Building2 className="w-5 h-5" />, tone: 'bg-amber-50 border-amber-100 text-amber-600' },
    { label: 'LOKASI', value: 5, icon: <MapPin className="w-5 h-5" />, tone: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
  ].map((s) => (
    <div key={s.label} className="p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200 shadow-sm">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.tone}`}>
        {s.icon}
      </div>
      <div>
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">{s.label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5">{s.value}</p>
      </div>
    </div>
  ))}
</div>
```

---

## 4. Toolbar Pencarian & Filter

Bilah filter tunggal memanjang dengan background putih, rounded-2xl, border abu-abu tipis:

```tsx
<div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center gap-3 shadow-sm">
  <div className="relative flex-1 min-w-48">
    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      placeholder="Cari data..."
      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
    />
  </div>
  <div className="flex items-center gap-2">
    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    <select className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-400 transition-all cursor-pointer">
      <option value="">Semua Filter</option>
    </select>
  </div>
  <span className="text-xs text-slate-500 ml-auto hidden sm:inline">
    Menampilkan <strong className="text-slate-900">{filteredCount}</strong> dari {totalCount} data
  </span>
</div>
```

---

## 5. Tabel Data Standar

Tabel wajib dibungkus kontainer putih `rounded-2xl border border-slate-200 overflow-hidden shadow-sm`:

```tsx
<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs border-collapse">
      <thead>
        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-mono">
          <th className="py-3.5 px-4">KODE / NIK</th>
          <th className="py-3.5 px-4">NAMA</th>
          <th className="py-3.5 px-4">STATUS</th>
          <th className="py-3.5 px-4 text-right">AKSI</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        <tr className="hover:bg-emerald-50/30 transition-colors group">
          <td className="py-3.5 px-4 font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[11px]">
              {kode}
            </span>
          </td>
          <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
            {nama}
          </td>
          <td className="py-3.5 px-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Aktif
            </span>
          </td>
          <td className="py-3.5 px-4 text-right">
            <div className="flex items-center justify-end gap-1">
              <button className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer">
                <Pencil className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 6. Aturan Input Angka (Form Numbers)

Hilangkan spin buttons default browser yang mengganggu:
```tsx
<input
  type="number"
  className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold"
/>
```

---

## 7. Hal Yang Dilarang (DON'T)

❌ Jangan menggunakan tema gelap terpisah (`dark:bg-slate-950`, `dark:border-slate-800`) di komponen modul jika halaman master lainnya adalah light ERP.  
❌ Jangan gunakan background header yang tebal atau card header gelap dengan gradien.  
❌ Jangan gunakan aksen ungu (violet), indigo, atau neon glow. Gunakan selalu keluarga **Emerald**.  
❌ Jangan biarkan spin arrow (up/down counter) default browser muncul di input angka form cuti/kehadiran.  
❌ Jangan membuat card yang melengkung berlebihan atau mengambang (floating) tanpa border pemisah yang jelas. Gunakan `rounded-2xl border border-slate-200 shadow-sm`.

## 8. Peta sumber dan komponen wajib

Semua path di bawah relatif terhadap root proyek dan menunjuk sumber yang sudah ada.

| Kebutuhan | Referensi / komponen | Ketentuan |
|---|---|---|
| Identitas brand | `frontend/src/lib/gajianichBrand.ts` | Pakai konstanta brand, jangan mengetik brand baru di setiap modul. |
| Token dan font global | `frontend/src/app/globals.css` | Gunakan token yang ada; jangan menimpa dari CSS modul. |
| Shell, sidebar, topbar, breadcrumb | `frontend/src/components/layout/DashboardLayout.tsx` | Gunakan shell existing; pertahankan collapse, drawer mobile, dan izin menu. |
| Master/list/transaksi | `frontend/src/components/master/EmployeeDirectoryPage.tsx` | Acuan header, toolbar, tabel, kartu ringkasan, loading, dan empty state. |
| Form master | `frontend/src/components/master/EmployeeFormPage.tsx`, `EmployeeFormFields.tsx` pada direktori yang sama | Ikuti pengelompokan field dan hierarki aksi; isi field sesuai domain baru. |
| Form transaksi | `frontend/src/components/leaves/LeaveRequestForm.tsx` | Acuan pengelompokan informasi dan proses simpan; aturan bisnis cuti tidak dipindahkan. |
| Modal umum | `frontend/src/components/ui/ModalShell.tsx` | Pakai prop aktual: `isOpen`, `onClose`, `title`, `children`, `footer`, `isLoading`; jangan membuat overlay sendiri. |
| Konfirmasi hapus/aksi berisiko | `frontend/src/components/ui/ConfirmDeleteModal.tsx` | Tampilkan nama objek, alasan, loading/error, dan aksi spesifik; jangan gunakan `window.confirm` / `alert`. |
| Status umum | `frontend/src/components/ui/StatusBadge.tsx` | Pakai variant semantik aktual: `success`, `warning`, `danger`, `slate`, `default`, atau `info`. |
| HR khusus absensi | `frontend/src/components/attendance/shared.tsx`, `attendance.css` pada direktori yang sama | Reuse untuk kebutuhan absensi; jangan menjadikannya stylesheet global modul GA/IT. |
| Proteksi navigasi | `frontend/src/lib/access/routes.ts`, `frontend/src/lib/access/permissions.ts` | Menu baru mengikuti pemeriksaan izin, rute aktif, dan landing existing. |

`StatusBadge` memiliki alias kompatibilitas `purple` yang saat ini menghasilkan warna amber.
Jangan gunakan nama alias itu untuk merancang status baru. Nama utilitas lama seperti
`.glass-panel` atau `.text-gradient-red` juga tidak berarti izin membuat glassmorphism atau tema merah.
Acuannya adalah token aktual dan master ini.

## 9. Token yang dikunci dan struktur halaman

Nilai hex berikut berasal dari `globals.css` dan `gajianichBrand.ts`. Ini mendokumentasikan
nilai CSS variable yang sudah ada; jangan membuat set token paralel dalam setiap fitur.
Tailwind utility dalam resep mengikuti konfigurasi Tailwind aktif; CSS variable dan utility
bernama serupa tidak harus menghasilkan nilai hex persis sama.

| Peran | Token global | Nilai CSS variable saat ini |
|---|---|---|
| Primary | `--color-primary` | `#059669` |
| Mint pendamping | `--color-mint` | `#10B981` |
| Teks di primary | `--color-on-primary` | `#FFFFFF` |
| Secondary lembut | `--color-secondary` | `#D1FAE5` |
| Accent/perhatian | `--color-accent` | `#F59E0B` |
| Canvas | `--color-background` | `#F8FAFC` |
| Teks utama | `--color-foreground` | `#0F172A` |
| Muted surface | `--color-muted` | `#F1F5F9` |
| Border | `--color-border` | `#E2E8F0` |
| Destructive | `--color-destructive` | `#B91C1C` |

- Font teks dan heading: **Plus Jakarta Sans**, mengikuti font global.
- Font kode, ID, dan angka operasional yang memerlukan monospace: **JetBrains Mono**.
- Ikon: **lucide-react** yang sudah terpasang. Ukuran aksi 16px, ikon judul 24px,
  ikon kartu 20px. Pilih ikon berdasarkan fungsi; jangan mengganti pustaka per departemen.
- Panel utama: `rounded-2xl`; input/tombol `rounded-xl`; aksi ikon `rounded-lg`.
  `rounded-full` tetap untuk status/avatar, bukan semua elemen.
- Pemisah bagian: `space-y-6`; gap umum `gap-3` / `gap-4`; padding panel `p-4`,
  form/modal mengikuti komponen referensi. Jangan menambah whitespace ala landing page.
- Bayangan panel `shadow-sm`; bayangan modal mengikuti `ModalShell`. Jangan menambah glow,
  gradien dekoratif, atau efek melayang pada setiap kartu operasional.
- Animasi hanya untuk feedback, transisi singkat, dan loading. Hormati reduced motion.
- Light ERP adalah tema operasional aktif. Jangan menambah dark mode khusus modul.

### Susunan halaman list/master/transaksi

1. `DashboardLayout` menyediakan shell dan padding halaman. Jangan menggandakan shell/padding.
2. Wrapper konten `space-y-6`.
3. Header: judul kiri, deskripsi ringkas, aksi kanan yang membungkus di layar kecil.
4. Kartu ringkasan hanya bila membantu keputusan dan memiliki sumber data nyata.
   Jangan mengarang 3–4 KPI agar halaman terlihat penuh.
5. Tab jika ada kategori kerja nyata; toolbar filter/pencarian yang terkait dengan tabel.
6. Panel tabel/list, lalu pagination bila memang diperlukan data.

Untuk detail dan form, pertahankan header, panel, label, warna, dan hierarki tombol yang sama;
susunan field menyesuaikan tugas pengguna. Jangan memaksakan KPI dan tabel pada semua form.
Gunakan satu aksi utama yang jelas dalam satu kelompok tugas; aksi lain sekunder.

### Penambahan menu

Gunakan `navGroups` pada `DashboardLayout` dan aturan akses existing. Tambahkan menu pada
kelompok bisnis yang benar, dengan nama, ikon fungsional, tujuan rute nyata, dan izin yang sesuai.
Pertahankan menu aktif berwarna emerald, accordion, breadcrumb, dan perilaku drawer mobile.
Jangan membuat sidebar sendiri atau mengganti urutan menu lain tanpa kebutuhan tugas.

## 10. Interaksi, aksesibilitas, dan responsive

Aturan pada bagian ini mengoreksi kekurangan pada contoh atau komponen lama, bukan mengubah tema.

- Kondisi wajib: loading, data kosong, hasil filter kosong, error dengan pemulihan,
  disabled/submitting, sukses, dan akses ditolak/read-only jika relevan.
- Data kosong berbeda dengan API gagal. Jangan menampilkan contoh angka sebagai data nyata.
- Tombol simpan menampilkan proses dan mencegah submit ganda; error tidak menghapus input pengguna.
- Setiap field punya label yang terhubung. Placeholder bukan pengganti label.
- Tombol hanya ikon punya nama aksesibel (`aria-label`); label status harus berupa teks,
  tidak bergantung pada warna atau titik saja.
- Pertahankan `:focus-visible` global (outline 3px primary, offset 3px).
  Jangan menghapus outline tanpa pengganti yang terlihat.
- Teks normal wajib memiliki kontras minimal 4.5:1; teks besar minimal 3:1.
  Resep lama `text-slate-400` untuk teks kecil dan teks putih pada primary harus diperiksa
  pada warna hasil render yang sebenarnya. Jika tidak cukup, gunakan tone lebih gelap dari
  keluarga yang sama, misalnya slate-600 atau emerald-700; jangan mengganti palet aplikasi.
- Target sentuh minimal 40×40px, disarankan 44×44px. Ikon boleh 16px di dalam target lebih besar.
- Verifikasi di lebar 360px, 390px, 768px, dan 1280px. Halaman tidak boleh overflow horizontal;
  tabel lebar boleh bergulir di panel `overflow-x-auto`. Jangan mengandalkan `body overflow-x:hidden`
  untuk menyembunyikan layout yang rusak.
- Form satu kolom di ponsel; kolom tambahan hanya bila ruang cukup. Toolbar dan aksi membungkus.
- Modal memakai `ModalShell`: backdrop existing, header/footer tetap, body scroll,
  `max-h-[92dvh] sm:max-h-[88vh]`. Pastikan judul aksesibel, fokus berada di dialog,
  Escape sesuai keadaan proses, dan fokus kembali setelah ditutup.
- Untuk komponen konfirmasi existing, uji kebutuhan keyboard/fokus pada alur yang dipakai;
  jangan menganggap semua komponen lama sudah lolos aksesibilitas hanya karena reusable.

## 11. Penerapan untuk departemen GA

Pengajuan pembelian GA wajib menjadi bagian visual dari aplikasi yang sama:

- Shell dan sidebar existing; identitas GA tidak diberi warna brand atau font sendiri.
- List pengajuan mengikuti pola direktori: header, filter, status, tabel, dan aksi.
- Form mengikuti panel/form existing: rincian pemohon, daftar barang, estimasi harga,
  bukti harga, dan aksi simpan/ajukan sesuai aturan bisnis yang disepakati.
- Area paste screenshot memakai panel putih, border slate, radius existing, petunjuk singkat,
  pratinjau, serta aksi hapus/ganti dengan pola tombol aplikasi.
- Status Draft/Diajukan/Disetujui/Ditolak memakai tone semantik slate/amber/emerald/rose.
- Upload, kompresi, error, dan retry tampil sebagai keadaan proses; tidak menambah gaya halaman baru.

Ini adalah batas visual untuk implementasi mendatang, bukan klaim fitur GA sudah tersedia.

## 12. Checklist wajib sebelum menyerahkan perubahan UI

Agen mencatat rujukan pola dan bukti pemeriksaan yang benar-benar dilakukan.

- [ ] Master ini dibaca; halaman/komponen referensi yang dipakai disebutkan dalam laporan.
- [ ] Font, primary, canvas, border, radius, kepadatan, dan ikon mengikuti master.
- [ ] Shell dan komponen bersama digunakan sesuai API aktual; tidak ada tema per modul.
- [ ] Susunan halaman mengikuti tugas pengguna; tidak ada KPI atau dekorasi tanpa fungsi.
- [ ] Label, keyboard, fokus, kontras, dan target sentuh diperiksa.
- [ ] Mobile dan desktop diperiksa; tabel dan modal tidak memotong kontrol.
- [ ] Loading, kosong, error, submitting, sukses, dan izin diperiksa sesuai alur fitur.
- [ ] Menu baru punya rute dan izin yang benar; active state dan breadcrumb diperiksa.
- [ ] Pemeriksaan kode yang relevan dijalankan; hasil visual hanya diklaim jika benar-benar diperiksa.
- [ ] Perubahan tema global atau penyimpangan memiliki instruksi eksplisit pengguna sebagai dasar.

Dokumen desain khusus halaman hanya boleh menambah kebutuhan domain, pemetaan komponen,
dan layout konten yang belum tercakup. Tidak boleh membuat token atau master tema alternatif.
