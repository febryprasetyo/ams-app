'use client';
import { useState } from 'react';
import { useAttendance } from './AttendanceWorkspace';
import { Heading, SearchInput, Empty, Pagination } from './shared';

export default function AttendanceActivityPage() {
  const { data } = useAttendance(); const [q, setQ] = useState(''), [page, setPage] = useState(1);
  const rows = data.audit.filter(r => `${r.actor} ${r.action} ${r.detail}`.toLowerCase().includes(q.toLowerCase())).toReversed();
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  return <div className="space-y-6"><Heading title="Aktivitas Absensi" description="Jejak impor, review, koreksi, penguncian, dan perubahan master pada modul HR." /><div className="flex flex-wrap items-center justify-between gap-4">
    <SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Cari aktivitas, pelaku, atau keterangan" />
    <span className="text-xs font-medium text-slate-500">{rows.length} aktivitas dicatat</span>
  </div><div className="hr-panel"><div className="hr-table-wrap"><table className="hr-table"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Aktivitas</th><th>Keterangan</th></tr></thead><tbody>{rows.slice((currentPage - 1) * 10, currentPage * 10).map(r => <tr key={r.id}><td>{new Date(r.createdAt).toLocaleString('id-ID')}</td><td>{r.actor}</td><td className="font-medium">{r.action}</td><td className="min-w-64 max-w-xl !whitespace-normal leading-5">{r.detail}</td></tr>)}</tbody></table></div>{!rows.length && <Empty />}<Pagination total={rows.length} page={currentPage} onChange={setPage} /></div></div>;
}
