'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeFormFields from '@/components/master/EmployeeFormFields';
import { api } from '@/lib/api';
import { buildEmployeePayload } from '@/lib/employeeForm';
import type { DepartmentOption, EmployeeItem, LocationOption } from '@/lib/employeeTypes';

interface Props {
  mode: 'create' | 'edit';
  employeeId?: number;
  basePath?: string;
}

export default function EmployeeFormPage({ mode, employeeId, basePath = '/dashboard/attendance/master/employees' }: Props) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Partial<EmployeeItem>>({ status: 'Active', currency: 'IDR' });
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<DepartmentOption[]>('/master/departments'),
      api.get<LocationOption[]>('/master/locations'),
      mode === 'edit' && employeeId ? api.get<EmployeeItem>(`/employees/${employeeId}`) : Promise.resolve(null),
    ]).then(([departmentRows, locationRows, employeeRow]) => {
      if (!active) return;
      setDepartments(departmentRows);
      setLocations(locationRows);
      if (employeeRow) setEmployee(employeeRow);
    }).catch((cause: Error) => active && setError(cause.message || 'Gagal memuat data karyawan.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [employeeId, mode]);

  function change(field: keyof EmployeeItem, value: string | number | null) {
    setEmployee(current => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const payload = buildEmployeePayload(employee);
    if (!payload.employeeCode || !payload.fullName || !payload.departmentId || !payload.employmentStatus) {
      setError('Employee ID, nama lengkap, departemen, dan Status Employee wajib diisi.');
      return;
    }
    try {
      setSaving(true);
      const saved = mode === 'edit' && employeeId
        ? await api.put<EmployeeItem>(`/employees/${employeeId}`, payload)
        : await api.post<EmployeeItem>('/employees', payload);
      router.push(`${basePath}/${saved.id}`);
    } catch (cause: unknown) {
      setError((cause as Error).message || 'Gagal menyimpan data karyawan.');
    } finally {
      setSaving(false);
    }
  }

  const title = mode === 'create' ? 'Tambah Karyawan' : 'Edit Karyawan';
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={basePath} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700">
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke data karyawan
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">Lengkapi data sesuai 33 kolom Talenta.</p>
          </div>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="flex justify-center p-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <EmployeeFormFields data={employee} onChange={change} departments={departments} locations={locations} />
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Link href={basePath} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Menyimpan...' : 'Simpan Karyawan'}
              </button>
            </div>
          </form>
        )}
      </main>
    </DashboardLayout>
  );
}
