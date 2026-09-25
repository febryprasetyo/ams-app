'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useAttendance } from './AttendanceWorkspace';
import { Heading, SearchInput, Empty, EmployeeName, FormDialog, Pagination, type Field } from './shared';
import { roleLabels } from '@/lib/attendance/domain';
import type { AttendanceGrant, Employee, Identity, MasterItem } from '@/lib/attendance/types';

type Mode = 'employees' | 'departments' | 'locations' | 'identities' | 'sources' | 'access' | 'cards';
const titles: Record<Mode, string> = { employees: 'Master Karyawan Absensi', departments: 'Departemen Absensi', locations: 'Lokasi Absensi', identities: 'Pemetaan Identitas', sources: 'Sumber Absensi', access: 'Akses Absensi', cards: 'Kartu Absensi' };
const descriptions: Record<Mode, string> = { employees: 'Master karyawan khusus HR, terpisah dari master karyawan aset AMS.', departments: 'Kelola departemen yang digunakan oleh karyawan absensi.', locations: 'Kelola lokasi kerja absensi. Lokasi yang tidak tersedia pada file sumber tetap kosong.', identities: 'Hubungkan nomor mesin ke karyawan. Angka nol di depan nomor tetap dipertahankan.', sources: 'Sumber file menjadi pembeda nomor identitas mesin.', access: 'Simulasi grant modul HR. Perubahan di sini tidak mengubah akun atau hak akses login AMS.', cards: 'Pilih karyawan untuk melihat catatan harian, total durasi, dan riwayat koreksi.' };
type Entry = Employee | MasterItem | Identity | AttendanceGrant;
export default function AttendanceDirectoryPage({ mode }: { mode: Mode }) {
  const { data, execute, canWrite } = useAttendance();
  const [q, setQ] = useState(''), [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined);
  const allowed = mode === 'access' ? data.meta.canManageAccess : canWrite;
  const entries: Entry[] = mode === 'cards' || mode === 'employees' ? data.employees : mode === 'access' ? data.grants : data[mode];
  const titleOf = (entry: Entry): string => 'fullName' in entry ? entry.fullName : 'name' in entry ? entry.name : 'displayName' in entry ? entry.displayName : `${entry.externalNoId} ${data.employees.find(e => e.id === entry.employeeId)?.fullName ?? ''}`;
  const filtered = entries.filter(e => `${titleOf(e)} ${'employeeCode' in e ? e.employeeCode : 'code' in e ? e.code : ''}`.toLowerCase().includes(q.toLowerCase()));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const existingEmployee = editing && 'fullName' in editing ? editing : null;
  const existingMaster = editing && 'name' in editing ? editing : null;
  const existingIdentity = editing && 'externalNoId' in editing ? editing : null;
  const existingGrant = editing && 'principalKey' in editing ? editing : null;
  const activeField: Field = { name: 'isActive', label: 'Status', type: 'select', value: editing && 'isActive' in editing && !editing.isActive ? 'false' : 'true', options: [{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }] };
  let fields: Field[];
  if (mode === 'employees') fields = [
    { name: 'fullName', label: 'Nama lengkap', value: existingEmployee?.fullName, required: true },
    { name: 'employeeCode', label: 'Kode karyawan', value: existingEmployee?.employeeCode },
    { name: 'email', label: 'Email', type: 'email', value: existingEmployee?.email },
    { name: 'departmentId', label: 'Departemen absensi', type: 'select', required: true, value: existingEmployee?.departmentId ?? '', options: [{ value: '', label: 'Pilih departemen' }, ...data.departments.map(d => ({ value: d.id, label: d.name }))] },
    { name: 'locationId', label: 'Lokasi absensi', type: 'select', value: existingEmployee?.locationId ?? '', options: [{ value: '', label: 'Belum ditentukan' }, ...data.locations.map(l => ({ value: l.id, label: l.name }))] },
    { name: 'position', label: 'Jabatan', value: existingEmployee?.position }, activeField,
  ];
  else if (mode === 'identities') fields = [
    { name: 'sourceId', label: 'Sumber', type: 'select', value: existingIdentity?.sourceId ?? data.sources[0]?.id, required: true, options: data.sources.map(s => ({ value: s.id, label: s.name })) },
    { name: 'externalNoId', label: 'No. ID mesin', value: existingIdentity?.externalNoId, required: true, hint: 'Teks, bukan angka. Contoh: 001 berbeda dengan 1.' },
    { name: 'employeeId', label: 'Karyawan absensi', type: 'select', value: existingIdentity?.employeeId ?? '', required: true, options: [{ value: '', label: 'Pilih karyawan' }, ...data.employees.map(e => ({ value: e.id, label: `${e.employeeCode || 'Tanpa kode'} · ${e.fullName}` }))] },
  ];
  else if (mode === 'access') fields = [
    { name: 'principalKey', label: 'Identitas akun demo', value: existingGrant?.principalKey, required: true, hint: 'Grant contoh tidak membuat akun login AMS.' },
    { name: 'displayName', label: 'Nama tampilan', value: existingGrant?.displayName, required: true },
    { name: 'role', label: 'Peran absensi', type: 'select', value: existingGrant?.role ?? 'HR_STAFF', options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })) }, activeField,
  ];
  else fields = [{ name: 'code', label: 'Kode', value: existingMaster?.code, required: true }, { name: 'name', label: 'Nama', value: existingMaster?.name, required: true }, activeField];
  const submit = async (form: FormData) => {
    const text = (key: string) => String(form.get(key) ?? '');
    const id = editing?.id ?? 0; const isActive = text('isActive') === 'true';
    if (mode === 'employees') await execute({ type: 'employee', value: { id, fullName: text('fullName'), employeeCode: text('employeeCode'), email: text('email'), departmentId: Number(text('departmentId')), locationId: text('locationId') ? Number(text('locationId')) : null, position: text('position'), isActive } });
    else if (mode === 'identities') await execute({ type: 'identity', value: { id, externalNoId: text('externalNoId'), sourceId: Number(text('sourceId')), employeeId: Number(text('employeeId')) } });
    else if (mode === 'access') await execute({ type: 'grant', value: { id, principalKey: text('principalKey'), displayName: text('displayName'), role: text('role') as AttendanceGrant['role'], isActive } });
    else if (mode !== 'cards') await execute({ type: 'master', collection: mode, value: { id, code: text('code'), name: text('name'), isActive } });
  };
  if (mode === 'access' && !data.meta.canManageAccess) return <Empty text="Pengelolaan akses hanya tersedia bagi pengelola grant." />;
  return <div className="space-y-5"><Heading title={titles[mode]} description={descriptions[mode]}>
    {mode === 'identities' && <Link className="hr-btn" href="/dashboard/attendance/identities/sources">Kelola sumber</Link>}
    {mode === 'sources' && <Link className="hr-btn" href="/dashboard/attendance/identities">Pemetaan identitas</Link>}
    {mode !== 'cards' && allowed && <button className="hr-btn-primary" onClick={() => setEditing(null)}><Plus size={16} />{mode === 'identities' ? 'Tambah pemetaan' : mode === 'access' ? 'Tambah akses' : 'Tambah data'}</button>}
  </Heading>
  <div className="flex flex-wrap items-center justify-between gap-3"><SearchInput value={q} onChange={value => { setQ(value); setPage(1); }} placeholder={mode === 'employees' || mode === 'cards' ? 'Cari nama atau ID karyawan' : 'Cari kode atau nama'} /><span className="text-xs text-slate-500">{filtered.length} data</span></div>
  <div className="hr-panel"><div className="hr-table-wrap"><table className="hr-table"><thead><tr><th>{mode === 'identities' ? 'No. ID mesin' : 'Nama'}</th><th>{mode === 'identities' ? 'Sumber' : mode === 'access' ? 'Akun / peran' : 'Kode / departemen'}</th><th>{mode === 'identities' ? 'Karyawan absensi' : 'Status / lokasi'}</th><th>Aksi</th></tr></thead><tbody>{filtered.slice((currentPage - 1) * 10, currentPage * 10).map(entry => <tr key={entry.id}>
    <td>{'fullName' in entry ? <EmployeeName employee={entry} detail={entry.position} /> : <span className="font-medium">{'externalNoId' in entry ? entry.externalNoId : titleOf(entry)}</span>}</td>
    <td>{'fullName' in entry ? data.departments.find(d => d.id === entry.departmentId)?.name : 'externalNoId' in entry ? data.sources.find(s => s.id === entry.sourceId)?.name : 'principalKey' in entry ? <><span>{entry.principalKey}</span><p className="mt-1 text-slate-500">{roleLabels[entry.role]}</p></> : entry.code}</td>
    <td>{'externalNoId' in entry ? data.employees.find(e => e.id === entry.employeeId)?.fullName : <><span className={entry.isActive ? 'text-emerald-700' : 'text-slate-500'}>{entry.isActive ? 'Aktif' : 'Nonaktif'}</span>{'locationId' in entry && <p className="mt-1 text-slate-500">{data.locations.find(l => l.id === entry.locationId)?.name ?? 'Lokasi belum ditentukan'}</p>}</>}</td>
    <td><div className="flex gap-2">{'fullName' in entry && <Link className="hr-btn" href={`/dashboard/attendance/employees/${entry.id}`}>Lihat kartu</Link>}{mode !== 'cards' && allowed && <button className="hr-btn" onClick={() => setEditing(entry)}>Edit</button>}</div></td>
  </tr>)}</tbody></table></div>{!filtered.length && <Empty text={q ? 'Tidak ada hasil pencarian.' : 'Belum ada data. Tambahkan melalui tombol di atas.'} />}<Pagination total={filtered.length} page={currentPage} onChange={setPage} /></div>
  {editing !== undefined && <FormDialog title={`${editing ? 'Edit' : 'Tambah'} ${mode === 'identities' ? 'pemetaan' : mode === 'access' ? 'akses' : mode === 'employees' ? 'karyawan absensi' : 'data master'}`} fields={fields} onClose={() => setEditing(undefined)} onSubmit={submit} />}
  </div>;
}
