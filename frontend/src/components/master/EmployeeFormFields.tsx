'use client';
import React from 'react';
import type { DepartmentOption, LocationOption, EmployeeItem } from '@/lib/employeeTypes';
import { calculateTalentaDuration } from '@/lib/employeeForm';

type FormData = Partial<EmployeeItem>;
interface Props {
  data: FormData;
  onChange: (field: keyof EmployeeItem, value: string | number | null) => void;
  departments: DepartmentOption[];
  locations: LocationOption[];
  readOnly?: boolean;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[10px] text-emerald-600 font-mono">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 transition-all disabled:opacity-60 disabled:cursor-default";
const selectCls = inputCls + " cursor-pointer";

export default function EmployeeFormFields({ data, onChange, departments, locations, readOnly }: Props) {
  const handleJoinDateChange = (val: string | null) => {
    onChange('joinDate', val);
    if (val) {
      const autoService = calculateTalentaDuration(val);
      onChange('lengthOfService', autoService);
    }
  };

  const handleBirthDateChange = (val: string | null) => {
    onChange('birthDate', val);
    if (val) {
      const autoAge = calculateTalentaDuration(val);
      onChange('age', autoAge);
    }
  };

  const inp = (field: keyof EmployeeItem, type = 'text', customChange?: (v: string | null) => void) => (
    <input type={type} disabled={readOnly} value={(data[field] as string) ?? ''}
      onChange={e => customChange ? customChange(e.target.value || null) : onChange(field, e.target.value || null)}
      className={inputCls} />
  );
  const sel = (field: keyof EmployeeItem, options: { value: string; label: string }[], placeholder = '— Pilih —') => (
    <select disabled={readOnly} value={(data[field] as string) ?? ''} onChange={e => onChange(field, e.target.value || null)} className={selectCls}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  const textarea = (field: keyof EmployeeItem) => (
    <textarea disabled={readOnly} value={(data[field] as string) ?? ''} onChange={e => onChange(field, e.target.value || null)}
      rows={2} className={inputCls + " resize-none"} />
  );

  return (
    <div className="space-y-8">
      {/* === Data Utama === */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">Data Utama</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="NIK / No. Karyawan *">{inp('employeeCode')}</Field>
          <Field label="Nama Lengkap *">{inp('fullName')}</Field>
          <Field label="Email">{inp('email', 'email')}</Field>
          <Field label="Posisi / Jabatan">{inp('position')}</Field>
          <Field label="Level Jabatan">{inp('jobLevel')}</Field>
          <Field label="Barcode">{inp('barcode')}</Field>
          <Field label="Departemen *">
            <select disabled={readOnly} value={data.departmentId ? String(data.departmentId) : ''}
              onChange={e => onChange('departmentId', e.target.value ? Number(e.target.value) : null)} className={selectCls}>
              <option value="">— Pilih —</option>
              {departments.map(d => <option key={d.id} value={String(d.id)}>{d.code} – {d.name}</option>)}
            </select>
          </Field>
          <Field label="Lokasi">
            <select disabled={readOnly} value={data.locationId ? String(data.locationId) : ''}
              onChange={e => onChange('locationId', e.target.value ? Number(e.target.value) : null)} className={selectCls}>
              <option value="">— Pilih —</option>
              {locations.map(l => <option key={l.id} value={String(l.id)}>{l.code} – {l.name}</option>)}
            </select>
          </Field>
          <Field label="Status Employee *">{inp('employmentStatus')}</Field>
          <Field label="Tanggal Bergabung">{inp('joinDate', 'date', handleJoinDateChange)}</Field>
          <Field label="Masa Kerja" hint="Otomatis dihitung">{inp('lengthOfService')}</Field>
          <Field label="Mata Uang">{sel('currency', [{ value: 'IDR', label: 'IDR' }, { value: 'USD', label: 'USD' }])}</Field>
        </div>
      </section>

      {/* === Kontak === */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">Kontak</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="No. HP Utama">{inp('mobilePhone', 'tel')}</Field>
          <Field label="No. Telepon">{inp('phone', 'tel')}</Field>
          <Field label="No. Telepon Lainnya">{inp('secondaryPhone', 'tel')}</Field>
        </div>
      </section>

      {/* === Data Pribadi === */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">Data Pribadi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="NIK KTP">{inp('nikKtp')}</Field>
          <Field label="Tanggal Lahir">{inp('birthDate', 'date', handleBirthDateChange)}</Field>
          <Field label="Tempat Lahir">{inp('birthPlace')}</Field>
          <Field label="Usia" hint="Otomatis dihitung">{inp('age')}</Field>
          <Field label="Jenis Kelamin">
            {sel('gender', [{ value: 'Male', label: 'Laki-laki' }, { value: 'Female', label: 'Perempuan' }])}
          </Field>
          <Field label="Agama">
            {sel('religion', ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(r => ({ value: r, label: r })))}
          </Field>
          <Field label="Status Pernikahan">
            {sel('maritalStatus', ['Single','Married','Divorced','Widowed'].map(s => ({ value: s, label: s })))}
          </Field>
          <Field label="Golongan Darah">
            {sel('bloodType', ['A','B','AB','O','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => ({ value: b, label: b })))}
          </Field>
          <Field label="Kode Kewarganegaraan">{inp('nationalityCode')}</Field>
          <Field label="Alamat KTP"><div className="sm:col-span-2">{textarea('citizenIdAddress')}</div></Field>
          <Field label="Alamat Domisili"><div className="sm:col-span-2">{textarea('residentialAddress')}</div></Field>
        </div>
      </section>

      {/* === Pajak & Bank === */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">Pajak & Bank</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="NPWP">{inp('npwp')}</Field>
          <Field label="NPWP 16 Digit">{inp('npwp16Digit')}</Field>
          <Field label="Status PTKP">{inp('ptkpStatus')}</Field>
          <Field label="Status Pajak Karyawan">{inp('employeeTaxStatus')}</Field>
          <Field label="Nama Bank">{inp('bankName')}</Field>
          <Field label="No. Rekening">{inp('bankAccount')}</Field>
          <Field label="Nama Pemilik Rekening">{inp('bankAccountHolder')}</Field>
        </div>
      </section>

      {/* === BPJS === */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">BPJS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="BPJS Ketenagakerjaan">{inp('bpjsKetenagakerjaan')}</Field>
          <Field label="BPJS Kesehatan">{inp('bpjsKesehatan')}</Field>
        </div>
      </section>
    </div>
  );
}
