import type { AttendanceCommand, AttendanceDataset, AttendanceRecord, ImportBatch, ImportRow } from './types';
import { DEFAULT_OFFICE_SHIFT, DEFAULT_PRODUCTION_SHIFT, resolveEmployeeShift, getScheduleForDate } from './scheduleShift.ts';

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
  const employee = identity
    ? data.employees.find(e => e.id === identity.employeeId)
    : data.employees.find(e => {
        const ext = (row.externalNoId || '').trim();
        const empCode = (e.employeeCode || '').trim();
        const barcode = ((e as any).barcode || '').trim();
        const rowCode = (row.employeeCode || '').trim();
        const rowName = (row.employeeName || '').trim().toLowerCase();
        const empName = (e.fullName || '').trim().toLowerCase();

        if (empCode && ext && empCode.toLowerCase() === ext.toLowerCase()) return true;
        if (barcode && ext && barcode.toLowerCase() === ext.toLowerCase()) return true;
        if (empCode && rowCode && empCode.toLowerCase() === rowCode.toLowerCase()) return true;
        if (empName && rowName && empName === rowName) return true;

        const numExt = parseInt(ext, 10);
        const numCode = parseInt(empCode, 10);
        if (!isNaN(numExt) && !isNaN(numCode) && numExt === numCode) return true;

        return false;
      });
  const employeeId = row.employeeId ?? employee?.id ?? null;
  if (row.attendanceStatus && row.attendanceStatus !== 'PRESENT') {
    if (!employeeId) return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Karyawan tidak ditemukan di Master Data.' };
    if (data.records.some(r => r.employeeId === employeeId && r.workDate === row.workDate)
      || batch.rows.some(r => r.id !== row.id && r.reviewStatus !== 'SKIPPED' && r.externalNoId === row.externalNoId && r.workDate === row.workDate)) {
      return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Catatan duplikat. Lewati baris dan koreksi catatan final jika diperlukan.' };
    }
    return { ...row, employeeId, reviewStatus: 'READY', note: row.note || `Status ketidakhadiran: ${row.attendanceStatus}` };
  }
  if (!row.scanIn && !row.scanOut) return { ...row, employeeId, reviewStatus: 'SKIPPED', note: 'Kedua scan kosong; tidak disimpulkan alpha.' };
  if (!employeeId) return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Karyawan tidak ditemukan di Master Data.' };
  if (data.records.some(r => r.employeeId === employeeId && r.workDate === row.workDate)
    || batch.rows.some(r => r.id !== row.id && r.reviewStatus !== 'SKIPPED' && r.externalNoId === row.externalNoId && r.workDate === row.workDate)) return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Catatan duplikat. Lewati baris dan koreksi catatan final jika diperlukan.' };
  if (!row.scanIn || !row.scanOut) return { ...row, employeeId, reviewStatus: 'BLOCKED', note: 'Scan belum lengkap. Lengkapi file; normalisasi BIFF tersedia saat integrasi backend.' };
  return { ...row, employeeId, reviewStatus: row.reviewStatus === 'READY' ? 'READY' : 'NEEDS_REVIEW', note: row.normalized ? 'Data Excel tidak lengkap, sudah dinormalisasi' : 'Periksa identitas dan nilai sebelum menyimpan.' };
}
export function applyCommand(input: AttendanceDataset, command: AttendanceCommand): AttendanceDataset {
  const admin = input.meta.role === 'HR_ADMIN';
  const canManage = admin || input.meta.role === 'HR_STAFF';
  if ((command.type === 'grant' || command.type === 'delete_grant') ? !input.meta.canManageAccess : input.meta.role === 'REPORT_VIEWER') throw new Error('Tidak memiliki akses untuk perubahan ini.');
  if (!admin && ['employee', 'master', 'identity', 'lock', 'toggle_strict_integrity', 'set_strict_integrity'].includes(command.type)) throw new Error('Perubahan ini memerlukan akses HR Admin.');
  if (!canManage && ['correct', 'batch', 'delete_batch', 'record_attendance', 'shift', 'assign_shift'].includes(command.type)) throw new Error('Perubahan ini memerlukan akses HR.');
  const data = structuredClone(input);
  const now = new Date().toISOString();
  let action = ''; let detail = '';
  switch (command.type) {
    case 'correct': {
      const reasonText = (command.reason || '').trim() || 'Koreksi absensi oleh HR';
      const r = data.records.find(r => r.id === command.recordId);
      if (!r) throw new Error('Catatan tidak ditemukan.');
      unlocked(data, r.workDate);
      if (r.revision !== command.expectedRevision) throw new Error('Data sudah berubah. Muat ulang sebelum menyimpan.');
      for (const n of [command.values.lateMinutes, command.values.overtimeMinutes]) if (!Number.isSafeInteger(n) || n < 0) throw new Error('Durasi harus berupa menit nonnegatif.');
      for (const time of [command.values.scanIn, command.values.scanOut]) if (time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Jam harus dalam format HH:mm.');
      const before = structuredClone(r);
      Object.assign(r, command.values, { revision: r.revision + 1 });
      if (r.attendanceStatus !== 'PRESENT') Object.assign(r, { scanIn: null, scanOut: null, lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0 });
      data.revisions.push({ id: nextId(data.revisions), recordId: r.id, reason: reasonText, createdAt: now, actor: data.meta.actor, before, after: structuredClone(r) });
      action = 'Koreksi absensi'; detail = `${r.workDate} · ${reasonText}`; break;
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
      if (command.action === 'delete') {
        const target = data.grants.find(g => g.id === command.value.id);
        if (!target) throw new Error('Akses tidak ditemukan.');
        data.grants = data.grants.filter(g => g.id !== command.value.id);
        action = 'Akses demo dihapus'; detail = target.displayName; break;
      }
      const v = { ...command.value, principalKey: command.value.principalKey.trim(), displayName: command.value.displayName.trim() };
      if (!v.principalKey || !v.displayName) throw new Error('Akun dan nama wajib diisi.');
      if (data.grants.some(g => g.id !== v.id && g.principalKey === v.principalKey)) throw new Error('Akun sudah mempunyai grant.');
      if (!v.id) { v.id = nextId(data.grants); data.grants.push(v); }
      else data.grants = data.grants.map(g => g.id === v.id ? v : g);
      action = 'Akses demo diperbarui'; detail = v.displayName; break;
    }
    case 'delete_grant': {
      const target = data.grants.find(g => g.id === command.id);
      if (!target) throw new Error('Akses tidak ditemukan.');
      data.grants = data.grants.filter(g => g.id !== command.id);
      action = 'Akses demo dihapus'; detail = target.displayName; break;
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
        if (command.employeeId) {
          row.employeeId = command.employeeId;
        }

        if (command.values) {
          if (command.values.scanIn !== undefined) {
            const rawIn = (command.values.scanIn || '').trim();
            const valIn = /^\d:[0-5]\d$/.test(rawIn) ? '0' + rawIn : rawIn.slice(0, 5);
            row.scanIn = valIn || null;
          }
          if (command.values.scanOut !== undefined) {
            const rawOut = (command.values.scanOut || '').trim();
            const valOut = /^\d:[0-5]\d$/.test(rawOut) ? '0' + rawOut : rawOut.slice(0, 5);
            row.scanOut = valOut || null;
          }
          if (command.values.lateMinutes !== undefined) {
            row.lateMinutes = Math.max(0, Math.floor(Number(command.values.lateMinutes) || 0));
          }
          if (command.values.overtimeMinutes !== undefined) {
            row.overtimeMinutes = Math.max(0, Math.floor(Number(command.values.overtimeMinutes) || 0));
          }
          row.issues = undefined;
        }

        if (row.scanIn && !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.scanIn)) {
          throw new Error('Format jam masuk harus HH:mm (contoh: 08:00)');
        }
        if (row.scanOut && !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.scanOut)) {
          throw new Error('Format jam pulang harus HH:mm (contoh: 17:00)');
        }

        if (!command.values && (row.issues?.length || (/Durasi|Scan atau jadwal|No\. ID/.test(row.note) && row.reviewStatus === 'BLOCKED'))) {
          throw new Error(row.issues?.[0] || row.note);
        }

        const resolved = resolveRow(data, batch, { ...row, reviewStatus: 'NEEDS_REVIEW', attendanceStatus: command.attendanceStatus || row.attendanceStatus });
        if (command.employeeId) {
          resolved.employeeId = command.employeeId;
        }

        if (resolved.reviewStatus === 'BLOCKED') {
          if ((command.attendanceStatus && command.attendanceStatus !== 'PRESENT') || (row.scanIn && row.scanOut && (row.employeeId || resolved.employeeId))) {
            resolved.reviewStatus = 'READY';
          } else {
            throw new Error(resolved.note);
          }
        }
        if (resolved.reviewStatus === 'SKIPPED') throw new Error(resolved.note);

        const attStatus = command.attendanceStatus || row.attendanceStatus || 'PRESENT';
        Object.assign(row, resolved, {
          scanIn: attStatus !== 'PRESENT' ? null : row.scanIn,
          scanOut: attStatus !== 'PRESENT' ? null : row.scanOut,
          lateMinutes: attStatus !== 'PRESENT' ? 0 : row.lateMinutes,
          overtimeMinutes: attStatus !== 'PRESENT' ? 0 : row.overtimeMinutes,
          reviewStatus: 'READY',
          attendanceStatus: attStatus,
          note: command.reason.trim(),
        });
      }
      action = 'Baris impor direview'; detail = `${batch.filename} · baris ${row.id}`; break;
    }
    case 'delete_batch': {
      const batch = data.batches.find(b => b.id === command.batchId);
      if (!batch) throw new Error('Batch tidak ditemukan.');
      if (batch.status === 'COMMITTED') throw new Error('Batch yang sudah tersimpan final tidak dapat dihapus.');
      data.batches = data.batches.filter(b => b.id !== command.batchId);
      action = 'Draft impor dihapus'; detail = batch.filename; break;
    }
    case 'batch': {
      const batch = data.batches.find(b => b.id === command.batchId);
      if (!batch) throw new Error('Batch tidak ditemukan.');
      if (command.action === 'delete') {
        if (batch.status === 'COMMITTED') throw new Error('Batch yang sudah tersimpan final tidak dapat dihapus.');
        data.batches = data.batches.filter(b => b.id !== command.batchId);
        action = 'Draft impor dihapus'; detail = batch.filename; break;
      }
      if (command.action === 'commit' && batch.status === 'COMMITTED') return input;
      if (command.action === 'reopen') {
        if (batch.status !== 'CANCELLED') throw new Error('Hanya batch dibatalkan yang dapat dibuka ulang.');
        batch.status = 'DRAFT'; batch.rows = batch.rows.map(r => resolveRow(data, batch, { ...r, reviewStatus: 'NEEDS_REVIEW' }));
      } else {
        if (batch.status !== 'DRAFT') throw new Error('Batch sudah tidak dapat diubah.');
        if (command.action === 'cancel') batch.status = 'CANCELLED';
        else {
          const isStrict = command.strictIntegrity !== undefined ? command.strictIntegrity : (data.meta.strictIntegrity !== false);
          if (isStrict) {
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
              const record: AttendanceRecord = { id: nextId(data.records), employeeId: row.employeeId!, workDate: row.workDate, shift: row.shift ?? null, scheduleIn: row.scheduleIn ?? null, scheduleOut: row.scheduleOut ?? null, scanIn: row.scanIn, scanOut: row.scanOut, rawScanIn: row.rawScanIn === undefined ? row.scanIn : row.rawScanIn, rawScanOut: row.rawScanOut === undefined ? row.scanOut : row.rawScanOut, lateMinutes: row.lateMinutes, earlyMinutes: row.earlyMinutes, overtimeMinutes: row.overtimeMinutes, attendanceStatus: row.attendanceStatus || 'PRESENT', isDayOff: false, normalized: row.normalized ?? false, revision: 1, sourceBatchId: batch.id };
              data.records.push(record);
            }
            batch.status = 'COMMITTED';
          } else {
            const keys = new Set<string>();
            const toCommit: ImportRow[] = [];
            for (const row of batch.rows) {
              if (row.reviewStatus === 'SKIPPED') continue;
              const resolved = resolveRow(data, batch, row);
              const employeeId = row.employeeId ?? resolved.employeeId;
              if (!employeeId) {
                row.reviewStatus = 'SKIPPED';
                row.note = 'Dilewati otomatis (karyawan tidak terdaftar di master data)';
                continue;
              }
              const key = `${employeeId}:${row.workDate}`;
              const existsInRecords = data.records.some(r => r.employeeId === employeeId && r.workDate === row.workDate);
              if (existsInRecords || keys.has(key)) {
                row.reviewStatus = 'SKIPPED';
                row.note = 'Dilewati otomatis karena catatan duplikat pada tanggal yang sama.';
                continue;
              }
              keys.add(key);
              unlocked(data, row.workDate);
              row.employeeId = employeeId;
              row.reviewStatus = 'READY';
              toCommit.push(row);
            }
            if (!toCommit.length) {
              throw new Error('Tidak ada baris data valid yang dapat disimpan.');
            }
            for (const row of toCommit) {
              const record: AttendanceRecord = { id: nextId(data.records), employeeId: row.employeeId!, workDate: row.workDate, shift: row.shift ?? null, scheduleIn: row.scheduleIn ?? null, scheduleOut: row.scheduleOut ?? null, scanIn: row.scanIn, scanOut: row.scanOut, rawScanIn: row.rawScanIn === undefined ? row.scanIn : row.rawScanIn, rawScanOut: row.rawScanOut === undefined ? row.scanOut : row.rawScanOut, lateMinutes: row.lateMinutes, earlyMinutes: row.earlyMinutes, overtimeMinutes: row.overtimeMinutes, attendanceStatus: row.attendanceStatus || 'PRESENT', isDayOff: false, normalized: row.normalized ?? false, revision: 1, sourceBatchId: batch.id };
              data.records.push(record);
            }
            batch.status = 'COMMITTED';
          }
        }
      }
      action = command.action === 'commit' ? 'Impor disimpan' : command.action === 'cancel' ? 'Impor dibatalkan' : 'Draft dibuka ulang'; detail = batch.filename; break;
    }
    case 'toggle_strict_integrity': {
      const batch = data.batches.find(b => b.id === command.batchId);
      if (!batch) throw new Error('Batch tidak ditemukan.');
      batch.strictIntegrity = command.enabled;
      action = command.enabled ? 'Integritas ketat diaktifkan' : 'Integritas ketat dinonaktifkan';
      detail = `${batch.filename} · ${command.enabled ? 'Strict ON' : 'Strict OFF'}`;
      break;
    }
    case 'set_strict_integrity': {
      data.meta.strictIntegrity = command.enabled;
      for (const b of data.batches) {
        b.strictIntegrity = command.enabled;
      }
      action = command.enabled ? 'Integritas ketat sistem diaktifkan' : 'Integritas ketat sistem dinonaktifkan';
      detail = command.enabled ? 'Strict ON (Produksi)' : 'Strict OFF (Uji Coba)';
      break;
    }
        case 'record_attendance': {
      const emp = data.employees.find(e => e.id === command.employeeId);
      if (!emp) throw new Error('Karyawan tidak ditemukan.');
      unlocked(data, command.workDate);

      if (!data.shifts) data.shifts = [DEFAULT_OFFICE_SHIFT, DEFAULT_PRODUCTION_SHIFT];
      if (!data.shiftAssignments) data.shiftAssignments = [];

      const activeShift = command.shiftId
        ? data.shifts.find(s => s.id === command.shiftId) || resolveEmployeeShift(emp, data.shifts, data.shiftAssignments)
        : resolveEmployeeShift(emp, data.shifts, data.shiftAssignments);

      const schedule = getScheduleForDate(command.workDate, activeShift);
      const isNonPresent = command.attendanceStatus !== 'PRESENT';
      const scanIn = isNonPresent ? null : (command.scanIn || null);
      const scanOut = isNonPresent ? null : (command.scanOut || null);

      let lateMinutes = 0;
      let earlyMinutes = 0;
      let overtimeMinutes = 0;

      if (!isNonPresent && scanIn && schedule.scheduleIn) {
        const [inH, inM] = scanIn.split(':').map(Number);
        const [schedH, schedM] = schedule.scheduleIn.split(':').map(Number);
        const diff = (inH * 60 + inM) - (schedH * 60 + schedM);
        if (diff > 0) lateMinutes = diff;
      }

      if (!isNonPresent && scanOut && schedule.scheduleOut) {
        const [outH, outM] = scanOut.split(':').map(Number);
        const [schedH, schedM] = schedule.scheduleOut.split(':').map(Number);
        const diff = (schedH * 60 + schedM) - (outH * 60 + outM);
        if (diff > 0) earlyMinutes = diff;
        else if (diff < 0) overtimeMinutes = -diff;
      }

      const reasonText = (command.reason || '').trim() || `Pencatatan status ${command.attendanceStatus}`;
      const r = data.records.find(rec => rec.employeeId === command.employeeId && rec.workDate === command.workDate);

      if (r) {
        const before = structuredClone(r);
        r.attendanceStatus = command.attendanceStatus;
        r.scanIn = scanIn;
        r.scanOut = scanOut;
        r.rawScanIn = scanIn;
        r.rawScanOut = scanOut;
        r.lateMinutes = lateMinutes;
        r.earlyMinutes = earlyMinutes;
        r.overtimeMinutes = overtimeMinutes;
        r.shift = activeShift.name;
        r.scheduleIn = schedule.scheduleIn;
        r.scheduleOut = schedule.scheduleOut;
        r.isDayOff = isNonPresent ? r.isDayOff : schedule.isDayOff;
        r.revision = r.revision + 1;
        data.revisions.push({
          id: nextId(data.revisions),
          recordId: r.id,
          reason: reasonText,
          createdAt: now,
          actor: data.meta.actor,
          before,
          after: structuredClone(r),
        });
      } else {
        const newRecord: AttendanceRecord = {
          id: nextId(data.records),
          employeeId: command.employeeId,
          workDate: command.workDate,
          shift: activeShift.name,
          scheduleIn: schedule.scheduleIn,
          scheduleOut: schedule.scheduleOut,
          scanIn,
          scanOut,
          rawScanIn: scanIn,
          rawScanOut: scanOut,
          lateMinutes,
          earlyMinutes,
          overtimeMinutes,
          attendanceStatus: command.attendanceStatus,
          isDayOff: schedule.isDayOff,
          normalized: false,
          revision: 1,
          sourceBatchId: null,
        };
        data.records.push(newRecord);
      }

      action = 'Pencatatan absensi';
      detail = `${emp.fullName} · ${command.workDate} (${command.attendanceStatus})`;
      break;
    }
    case 'shift': {
      if (!data.shifts) data.shifts = [DEFAULT_OFFICE_SHIFT, DEFAULT_PRODUCTION_SHIFT];
      const v = { ...command.shift, name: command.shift.name.trim(), code: command.shift.code.trim() };
      if (!v.name || !v.code) throw new Error('Nama dan kode shift wajib diisi.');
      if (command.action === 'create') {
        if (data.shifts.some(s => s.code === v.code)) throw new Error('Kode shift sudah digunakan.');
        v.id = nextId(data.shifts);
        data.shifts.push(v);
        action = 'Shift kerja dibuat';
        detail = v.name;
      } else if (command.action === 'update') {
        const idx = data.shifts.findIndex(s => s.id === v.id);
        if (idx === -1) throw new Error('Shift tidak ditemukan.');
        if (data.shifts.some(s => s.id !== v.id && s.code === v.code)) throw new Error('Kode shift sudah digunakan.');
        data.shifts[idx] = v;
        action = 'Shift kerja diperbarui';
        detail = v.name;
      } else if (command.action === 'delete') {
        if (v.isDefault) throw new Error('Shift default tidak dapat dihapus.');
        data.shifts = data.shifts.filter(s => s.id !== v.id);
        if (data.shiftAssignments) {
          data.shiftAssignments = data.shiftAssignments.filter(a => a.shiftId !== v.id);
        }
        action = 'Shift kerja dihapus';
        detail = v.name;
      }
      break;
    }
    case 'assign_shift': {
      if (!data.shiftAssignments) data.shiftAssignments = [];
      const { shiftId, departmentId, employeeId } = command.assignment;
      if (!data.shifts) data.shifts = [DEFAULT_OFFICE_SHIFT, DEFAULT_PRODUCTION_SHIFT];
      if (!data.shifts.some(s => s.id === shiftId)) throw new Error('Shift tidak ditemukan.');

      if (employeeId) {
        const existingIdx = data.shiftAssignments.findIndex(a => a.employeeId === employeeId);
        if (existingIdx !== -1) {
          data.shiftAssignments[existingIdx].shiftId = shiftId;
        } else {
          data.shiftAssignments.push({ id: nextId(data.shiftAssignments), shiftId, employeeId, departmentId: null });
        }
        const empName = data.employees.find(e => e.id === employeeId)?.fullName || `Karyawan #${employeeId}`;
        action = 'Penugasan shift karyawan';
        detail = `${empName}`;
      } else if (departmentId) {
        const existingIdx = data.shiftAssignments.findIndex(a => a.departmentId === departmentId && !a.employeeId);
        if (existingIdx !== -1) {
          data.shiftAssignments[existingIdx].shiftId = shiftId;
        } else {
          data.shiftAssignments.push({ id: nextId(data.shiftAssignments), shiftId, departmentId, employeeId: null });
        }
        const deptName = data.departments.find(d => d.id === departmentId)?.name || `Dept #${departmentId}`;
        action = 'Penugasan shift departemen';
        detail = `${deptName}`;
      } else {
        throw new Error('Penugasan shift harus menentukan departemen atau karyawan.');
      }
      break;
    }
    case 'sync_employees': {
      if (Array.isArray(command.employees)) {
        data.employees = command.employees;
      }
      if (Array.isArray(command.departments) && command.departments.length > 0) {
        data.departments = command.departments;
      }
      action = 'Sinkronisasi master karyawan';
      detail = `${data.employees.length} karyawan, ${data.departments.length} departemen`;
      break;
    }
  }
  data.audit.push({ id: nextId(data.audit), createdAt: now, actor: data.meta.actor, action, detail });
  return data;
}
