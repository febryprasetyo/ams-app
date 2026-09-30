import type { AttendanceCommand, AttendanceDataset, AttendanceRecord, ImportBatch, ImportRow } from './types';

const nextId = (rows: { id: number }[]) => Math.max(0, ...rows.map(r => r.id)) + 1;
function requireReason(reason: string) { if (!reason.trim()) throw new Error('Alasan wajib diisi.'); }
function unlocked(data: AttendanceDataset, date: string) {
  if (data.locks.some(lock => lock.workDate === date)) throw new Error('Data tanggal ini dikunci. Buka kunci sebelum mengubah data.');
}
function resolveRow(data: AttendanceDataset, batch: ImportBatch, row: ImportRow): ImportRow {
  if (row.reviewStatus === 'SKIPPED') return row;
  if (row.issues?.length) return { ...row, reviewStatus: 'BLOCKED', note: row.issues[0] };
  if (row.reviewStatus === 'BLOCKED' && /Durasi|Scan atau jadwal|No\. ID/.test(row.note)) return row;
  const identity = data.identities.find(i => (i.sourceId === batch.sourceId || !i.sourceId) && i.externalNoId === row.externalNoId) ?? data.identities.find(i => i.externalNoId === row.externalNoId);
  const employeeId = identity?.employeeId ?? null;
  if (!row.scanIn && !row.scanOut) return { ...row, employeeId, reviewStatus: 'SKIPPED', note: 'Kedua scan kosong; tidak disimpulkan alpha.' };
  if (!employeeId) return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Nomor mesin belum dipetakan.' };
  if (data.records.some(r => r.employeeId === employeeId && r.workDate === row.workDate)
    || batch.rows.some(r => r.id !== row.id && r.reviewStatus !== 'SKIPPED' && r.externalNoId === row.externalNoId && r.workDate === row.workDate)) return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Catatan duplikat. Lewati baris dan koreksi catatan final jika diperlukan.' };
  if (!row.scanIn || !row.scanOut) return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Scan belum lengkap. Lengkapi file; normalisasi BIFF tersedia saat integrasi backend.' };
  return { ...row, employeeId, reviewStatus: row.reviewStatus === 'READY' ? 'READY' : 'NEEDS_REVIEW', note: row.normalized ? 'Data Excel tidak lengkap, sudah dinormalisasi' : 'Periksa identitas dan nilai sebelum menyimpan.' };
}
export function applyCommand(input: AttendanceDataset, command: AttendanceCommand): AttendanceDataset {
  const admin = input.meta.role === 'HR_ADMIN';
  if (command.type === 'grant' ? !input.meta.canManageAccess : input.meta.role === 'REPORT_VIEWER') throw new Error('Tidak memiliki akses untuk perubahan ini.');
  if (!admin && ['correct', 'employee', 'master', 'identity', 'lock', 'batch'].includes(command.type)) throw new Error('Perubahan ini memerlukan akses HR Admin.');
  const data = structuredClone(input);
  const now = new Date().toISOString();
  let action = ''; let detail = '';
  switch (command.type) {
    case 'correct': {
      requireReason(command.reason);
      const r = data.records.find(r => r.id === command.recordId);
      if (!r) throw new Error('Catatan tidak ditemukan.');
      unlocked(data, r.workDate);
      if (r.revision !== command.expectedRevision) throw new Error('Data sudah berubah. Muat ulang sebelum menyimpan.');
      for (const n of [command.values.lateMinutes, command.values.overtimeMinutes]) if (!Number.isSafeInteger(n) || n < 0) throw new Error('Durasi harus berupa menit nonnegatif.');
      for (const time of [command.values.scanIn, command.values.scanOut]) if (time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Jam harus dalam format HH:mm.');
      const before = structuredClone(r);
      Object.assign(r, command.values, { revision: r.revision + 1 });
      if (r.attendanceStatus !== 'PRESENT') Object.assign(r, { scanIn: null, scanOut: null, lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0 });
      data.revisions.push({ id: nextId(data.revisions), recordId: r.id, reason: command.reason.trim(), createdAt: now, actor: data.meta.actor, before, after: structuredClone(r) });
      action = 'Koreksi absensi'; detail = `${r.workDate} · ${command.reason.trim()}`; break;
    }
    case 'employee': {
      const v = { ...command.value, fullName: command.value.fullName.trim(), employeeCode: command.value.employeeCode.trim() };
      if (!v.fullName) throw new Error('Nama karyawan wajib diisi.');
      if (v.employeeCode && data.employees.some(e => e.id !== v.id && e.employeeCode === v.employeeCode)) throw new Error('Kode karyawan sudah digunakan.');
      if (!data.departments.some(d => d.id === v.departmentId) || (v.locationId !== null && !data.locations.some(l => l.id === v.locationId))) throw new Error('Pilih departemen dan lokasi absensi yang valid.');
      if (!v.id) { v.id = nextId(data.employees); data.employees.push(v); }
      else data.employees = data.employees.map(e => e.id === v.id ? v : e);
      action = 'Master karyawan diperbarui'; detail = v.fullName; break;
    }
    case 'master': {
      const v = { ...command.value, name: command.value.name.trim(), code: command.value.code.trim() };
      if (!v.name || !v.code) throw new Error('Kode dan nama wajib diisi.');
      const rows = data[command.collection];
      if (rows.some(r => r.id !== v.id && r.code === v.code)) throw new Error('Kode sudah digunakan.');
      if (!v.id) { v.id = nextId(rows); rows.push(v); }
      else data[command.collection] = rows.map(r => r.id === v.id ? v : r);
      action = 'Master absensi diperbarui'; detail = v.name; break;
    }
    case 'identity': {
      const v = { ...command.value, externalNoId: command.value.externalNoId.trim() };
      if (!v.externalNoId || !data.employees.some(e => e.id === v.employeeId) || !data.sources.some(s => s.id === v.sourceId)) throw new Error('Nomor mesin, sumber, dan karyawan wajib valid.');
      if (data.identities.some(i => i.id !== v.id && i.sourceId === v.sourceId && i.externalNoId === v.externalNoId)) throw new Error('Nomor mesin pada sumber ini sudah dipetakan.');
      const old = data.identities.find(i => i.id === v.id);
      if (old && data.records.some(r => r.employeeId === old.employeeId) && (old.employeeId !== v.employeeId || old.externalNoId !== v.externalNoId || old.sourceId !== v.sourceId)) throw new Error('Identitas yang sudah dipakai catatan final tidak dapat dialihkan.');
      if (!v.id) { v.id = nextId(data.identities); data.identities.push(v); }
      else data.identities = data.identities.map(i => i.id === v.id ? v : i);
      for (const batch of data.batches.filter(b => b.status === 'DRAFT')) batch.rows = batch.rows.map(r => resolveRow(data, batch, { ...r, reviewStatus: r.reviewStatus === 'SKIPPED' ? 'SKIPPED' : 'NEEDS_REVIEW' }));
      action = 'Pemetaan identitas diperbarui'; detail = v.externalNoId; break;
    }
    case 'grant': {
      const v = { ...command.value, principalKey: command.value.principalKey.trim(), displayName: command.value.displayName.trim() };
      if (!v.principalKey || !v.displayName) throw new Error('Akun dan nama wajib diisi.');
      if (data.grants.some(g => g.id !== v.id && g.principalKey === v.principalKey)) throw new Error('Akun sudah mempunyai grant.');
      if (!v.id) { v.id = nextId(data.grants); data.grants.push(v); }
      else data.grants = data.grants.map(g => g.id === v.id ? v : g);
      action = 'Akses demo diperbarui'; detail = v.displayName; break;
    }
    case 'lock': {
      requireReason(command.reason);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(command.workDate)) throw new Error('Tanggal wajib diisi.');
      data.locks = data.locks.filter(l => l.workDate !== command.workDate);
      if (command.locked) data.locks.push({ workDate: command.workDate, reason: command.reason.trim(), createdAt: now });
      action = command.locked ? 'Data dikunci' : 'Kunci dibuka'; detail = `${command.workDate} · ${command.reason.trim()}`; break;
    }
    case 'import': {
      const activeSource = (command.sourceId ? data.sources.find(s => s.id === command.sourceId && s.isActive) : null)
        ?? data.sources.find(s => s.isActive)
        ?? data.sources[0];
      const sourceId = activeSource?.id ?? command.sourceId ?? 1;
      if (data.sources.length > 0 && !activeSource && command.sourceId) throw new Error('Pilih sumber aktif.');
      if (command.fileHash) {
        const existing = data.batches.find(b => b.sourceId === sourceId && b.fileHash === command.fileHash);
        if (existing) {
          action = 'Impor ditemukan kembali';
          detail = `${command.filename} · batch ${existing.id}`;
          break;
        }
      }
      const batch: ImportBatch = { id: nextId(data.batches), filename: command.filename, sourceId, fileHash: command.fileHash, createdAt: now, status: 'DRAFT', rows: command.rows };
      batch.rows = batch.rows.map(r => resolveRow(data, batch, r));
      data.batches.push(batch); action = 'Impor dibuat'; detail = `${batch.filename} · ${batch.rows.length} baris`; break;
    }
    case 'review': {
      requireReason(command.reason);
      const batch = data.batches.find(b => b.id === command.batchId);
      const row = batch?.rows.find(r => r.id === command.rowId);
      if (!batch || !row || batch.status !== 'DRAFT') throw new Error('Draft tidak dapat diubah.');
      if (command.skipped) Object.assign(row, { reviewStatus: 'SKIPPED', note: command.reason.trim() });
      else {
        if (row.issues?.length || (/Durasi|Scan atau jadwal|No\. ID/.test(row.note) && row.reviewStatus === 'BLOCKED')) {
          throw new Error(row.issues?.[0] || row.note);
        }
        const resolved = resolveRow(data, batch, { ...row, reviewStatus: 'NEEDS_REVIEW' });
        if (resolved.reviewStatus === 'BLOCKED' || resolved.reviewStatus === 'SKIPPED') throw new Error(resolved.note);
        if (resolved.employeeId !== command.employeeId) throw new Error('Pemetaan berubah. Muat ulang draft.');
        Object.assign(row, resolved, { reviewStatus: 'READY', note: command.reason.trim() });
      }
      action = 'Baris impor direview'; detail = `${batch.filename} · baris ${row.id}`; break;
    }
    case 'batch': {
      const batch = data.batches.find(b => b.id === command.batchId);
      if (!batch) throw new Error('Batch tidak ditemukan.');
      if (command.action === 'commit' && batch.status === 'COMMITTED') return input;
      if (command.action === 'reopen') {
        if (batch.status !== 'CANCELLED') throw new Error('Hanya batch dibatalkan yang dapat dibuka ulang.');
        batch.status = 'DRAFT'; batch.rows = batch.rows.map(r => resolveRow(data, batch, { ...r, reviewStatus: 'NEEDS_REVIEW' }));
      } else {
        if (batch.status !== 'DRAFT') throw new Error('Batch sudah tidak dapat diubah.');
        if (command.action === 'cancel') batch.status = 'CANCELLED';
        else {
          const rows = batch.rows.filter(r => r.reviewStatus !== 'SKIPPED');
          if (!rows.length || rows.some(r => r.reviewStatus !== 'READY' || resolveRow(data, batch, r).reviewStatus !== 'READY')) throw new Error('Selesaikan review seluruh baris sebelum menyimpan.');
          const keys = new Set<string>();
          for (const row of rows) {
            unlocked(data, row.workDate);
            const key = `${row.employeeId}:${row.workDate}`;
            if (keys.has(key)) throw new Error('Catatan duplikat untuk karyawan dan tanggal yang sama.');
            keys.add(key);
          }
          for (const row of rows) {
            const record: AttendanceRecord = { id: nextId(data.records), employeeId: row.employeeId!, workDate: row.workDate, shift: row.shift ?? null, scheduleIn: row.scheduleIn ?? null, scheduleOut: row.scheduleOut ?? null, scanIn: row.scanIn, scanOut: row.scanOut, rawScanIn: row.rawScanIn === undefined ? row.scanIn : row.rawScanIn, rawScanOut: row.rawScanOut === undefined ? row.scanOut : row.rawScanOut, lateMinutes: row.lateMinutes, earlyMinutes: row.earlyMinutes, overtimeMinutes: row.overtimeMinutes, attendanceStatus: 'PRESENT', isDayOff: false, normalized: row.normalized ?? false, revision: 1, sourceBatchId: batch.id };
            data.records.push(record);
          }
          batch.status = 'COMMITTED';
        }
      }
      action = command.action === 'commit' ? 'Impor disimpan' : command.action === 'cancel' ? 'Impor dibatalkan' : 'Draft dibuka ulang'; detail = batch.filename; break;
    }
  }
  data.audit.push({ id: nextId(data.audit), createdAt: now, actor: data.meta.actor, action, detail });
  return data;
}
