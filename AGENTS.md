# Aturan Agen Proyek AMS

## Master desain wajib

Sebelum merencanakan atau mengimplementasikan menu, fitur, halaman, komponen, atau CSS:

1. Baca `DESIGN.md` dan `UI_DESIGN_SYSTEM_GUIDE.md` di root proyek.
2. Baca `frontend/AGENTS.md` untuk pekerjaan frontend.
3. Periksa komponen referensi yang tercantum pada master, lalu pilih pola terdekat.
4. Gunakan tema GAJIANICH / Emerald Enterprise dan shell yang sudah ada.
5. Ikuti checklist kesesuaian desain pada master sebelum menyatakan pekerjaan selesai.

Arah desain telah ditetapkan pengguna. Jangan memulai pemilihan tema, font, palet,
atau desain alternatif untuk penambahan fitur biasa. Jangan mengubah master untuk
membenarkan desain baru. Perubahan identitas visual hanya boleh dilakukan jika
pengguna secara eksplisit meminta perubahan itu.

Urutan acuan visual: instruksi eksplisit pengguna untuk tugas saat ini →
`UI_DESIGN_SYSTEM_GUIDE.md` → komponen referensi yang disebut master →
catatan khusus halaman. Catatan halaman dan panduan lama tidak boleh menimpa master.
Perbedaan pada kode lama adalah utang konsistensi, bukan izin menambah gaya baru.

## Batas pekerjaan dan verifikasi

- Pertahankan perubahan pengguna dan pekerjaan lain yang sudah ada di checkout.
- Jangan merombak halaman lain hanya karena ditemukan ketidaksesuaian desain.
- Untuk perubahan produk, jalankan pemeriksaan yang relevan dengan cakupannya.
- Untuk perubahan dokumentasi saja, periksa tautan lokal, rujukan komponen,
  konsistensi token, dan diff; jangan mengklaim verifikasi visual yang tidak dilakukan.
- Ikuti aturan direktori pada `backend/AGENTS.md` dan `frontend/AGENTS.md`.
