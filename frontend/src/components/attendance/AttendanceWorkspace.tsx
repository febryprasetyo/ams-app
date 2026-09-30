'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, RotateCcw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ModalShell from '@/components/ui/ModalShell';
import { useAuth } from '@/context/AuthContext';
import { createAttendanceRepository } from '@/lib/attendance/repository';
import type { AttendanceCommand, AttendanceDataset } from '@/lib/attendance/types';
import './attendance.css';

interface AttendanceContextValue {
  data: AttendanceDataset;
  execute: (command: AttendanceCommand) => Promise<AttendanceDataset>;
  canWrite: boolean;
  canReview: boolean;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('AttendanceProvider diperlukan.');
  return context;
}

function Provider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const repository = useMemo(() => createAttendanceRepository(user!.id), [user]);
  const [data, setData] = useState<AttendanceDataset | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    repository.load(controller.signal).then(value => {
      if (!controller.signal.aborted) {
        setData(value);
        setError('');
      }
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Data gagal dimuat.');
    });
    return () => controller.abort();
  }, [repository, reload]);

  const execute = useCallback(async (command: AttendanceCommand) => {
    const next = await repository.execute(command);
    setData(next);
    return next;
  }, [repository]);

  const reset = async () => {
    setBusy(true);
    try {
      setData(await repository.reset());
      setError('');
      setResetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset gagal.');
    } finally {
      setBusy(false);
    }
  };

  const restricted = data?.meta.role === 'REPORT_VIEWER' && pathname !== '/dashboard/attendance/reports';

  return (
    <div className="attendance-ui space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 shadow-2xs">
        <p className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <strong>Mode Demo HR</strong>
          <span className="text-amber-400">·</span>
          <span>Data contoh. Perubahan hanya tersimpan di browser ini.</span>
        </p>
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 font-semibold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw size={13} />
          Reset Demo
        </button>
      </div>

      {error ? (
        <div className="hr-panel p-6" role="alert">
          <p className="mb-4 text-sm font-medium text-red-700">{error}</p>
          <button className="hr-btn" onClick={() => setReload(v => v + 1)}>Coba lagi</button>
        </div>
      ) : !data ? (
        <div className="hr-panel flex items-center justify-center gap-3 p-12 text-slate-600 font-medium" role="status">
          <Loader2 className="animate-spin text-red-600" size={20} />
          Memuat data absensi…
        </div>
      ) : restricted ? (
        <div className="hr-panel p-8 text-center max-w-lg mx-auto my-8">
          <h1 className="text-xl font-bold text-slate-900">Akses Terbatas</h1>
          <p className="my-3 text-sm text-slate-600 leading-relaxed">
            Akun pembaca laporan hanya dapat melihat ringkasan tanpa identitas karyawan.
          </p>
          <Link className="hr-btn-primary inline-flex mt-2" href="/dashboard/attendance/reports">
            Buka Laporan
          </Link>
        </div>
      ) : (
        <AttendanceContext.Provider value={{ data, execute, canWrite: data.meta.role === 'HR_ADMIN', canReview: data.meta.role !== 'REPORT_VIEWER' }}>
          {children}
        </AttendanceContext.Provider>
      )}

      <ModalShell
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset data demo?"
        isLoading={busy}
        footer={
          <>
            <button className="hr-btn" onClick={() => setResetOpen(false)} disabled={busy}>Batal</button>
            <button className="hr-btn-primary" onClick={reset} disabled={busy}>{busy ? 'Mereset…' : 'Reset data demo'}</button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Koreksi, impor, dan perubahan master demo di browser ini akan dihapus. Data awal dari file JSON dimuat kembali.
        </p>
      </ModalShell>
    </div>
  );
}

export default function AttendanceWorkspace({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <Provider>{children}</Provider>
    </DashboardLayout>
  );
}
