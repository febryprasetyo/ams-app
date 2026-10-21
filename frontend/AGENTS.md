<!-- BEGIN:frontend-agent-rules -->
# Frontfront Agent Configuration

This file tells the Antigravity agent that **all operations** (e.g., `npm run dev`, `npm install`, linting, building) should be executed **relative to the `frontend/` directory**.

## How the agent should behave
- **Working directory**: `frontend/`
- **Typical commands**:
  - `npm install` → `npm install --prefix frontend`
  - `npm run dev` → `npm run dev --prefix frontend`
  - `npm run build` → `npm run build --prefix frontend`
- **File paths**: Any file references should be prefixed with `frontend/` unless they are absolute.
- **README guidance**: Follow the project‑wide instructions described in the root `README.md` for overall workflow, but limit actions to this folder.

> **Note**: The frontend uses a custom Next.js setup (see existing `frontend/AGENTS.md` warning). Be sure to consult `node_modules/next/dist/docs/` for version‑specific APIs.

<!-- END:frontend-agent-rules -->

<!-- BEGIN:design-master -->
## Master desain wajib untuk seluruh frontend

Baca `../DESIGN.md` dan `../UI_DESIGN_SYSTEM_GUIDE.md` sebelum membuat atau mengubah UI.
Ini berlaku untuk menu baru, form, tabel, dashboard, modal, halaman GA, dan modul lain.
Tema sudah ditetapkan: GAJIANICH / Emerald Enterprise, berdasarkan aplikasi saat ini.

- Gunakan `DashboardLayout`, font global, dan token yang sudah ada.
- Reuse `ModalShell`, `ConfirmDeleteModal`, dan `StatusBadge` sesuai fungsi dan API aktualnya.
- Ikuti aturan global bagian 2–5 master. Pilih struktur sesuai tugas; `EmployeeDirectoryPage` hanya contoh direktori, bukan template wajib semua halaman.
- Jangan menambah tema per departemen, font, warna brand, ikon dari pustaka lain, atau shell baru.
- Dokumen halaman hanya melengkapi kebutuhan bisnis; tidak boleh mengganti aturan visual master.
- Jika komponen belum tersedia, buat komponen sesuai master; jangan mengarang import komponen.
- Laporkan rujukan pola yang dipakai dan hasil checklist desain saat menyerahkan perubahan UI.
- Ketidaksesuaian lama tidak otomatis menjadi acuan dan tidak perlu diperbaiki di luar cakupan tugas.
<!-- END:design-master -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
