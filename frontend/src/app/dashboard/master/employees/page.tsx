'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import EmployeeTable, {
  type DepartmentOption,
  type LocationOption,
  type EmployeeItem,
} from '@/components/master/EmployeeTable';
import EmployeeFormModal from '@/components/master/EmployeeFormModal';
import { api } from '@/lib/api';
import {
  Users,
  Plus,
  Search,
  AlertCircle,
  Building2,
  MapPin,
  UserCheck,
} from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  const [search, setSearch] = useState('');
  const [deletingEmp, setDeletingEmp] = useState<EmployeeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empData, deptData, locData] = await Promise.all([
        api.get<EmployeeItem[]>('/employees'),
        api.get<DepartmentOption[]>('/master/departments'),
        api.get<LocationOption[]>('/master/locations'),
      ]);
      setEmployees(empData);
      setDepartments(deptData);
      setLocations(locData);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load employee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingEmp(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmp) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/employees/${deletingEmp.id}`);
      setDeletingEmp(null);
      fetchData();
    } catch (err: unknown) {
      setDeleteError((err as Error).message || 'Gagal menghapus karyawan');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-red-600" />
              <span>Employee Directory</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Enterprise human resources directory for asset custody assignments and ticketing context.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>New Employee</span>
          </button>
        </div>

        {/* Bento Stat Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-mono">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Staff</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {employees.filter((e) => (e.status || '').toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-mono">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Assigned Departments</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{departments.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-mono">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Locations</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{locations.length}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between gap-4 bg-white border border-slate-200">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name, NIK code, email, department..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Showing <strong className="text-slate-900">{filtered.length}</strong> of {employees.length}
          </span>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Glass Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200">
          <EmployeeTable
            employees={filtered}
            loading={loading}
            onEdit={openEditModal}
            onDelete={(emp) => {
              setDeletingEmp(emp);
              setDeleteError(null);
            }}
          />
        </div>
      </div>

      {/* Create / Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={editingEmp}
        departments={departments}
        locations={locations}
        onSuccess={fetchData}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingEmp}
        onClose={() => {
          setDeletingEmp(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Karyawan"
        description="Apakah Anda yakin ingin menghapus data karyawan ini dari direktori? Pastikan karyawan ini tidak memiliki aset aktif atau tiket terbuka."
        itemName={deletingEmp?.fullName}
        itemDetails={
          deletingEmp
            ? [
                { label: 'NIK / Kode', value: deletingEmp.employeeCode },
                { label: 'Nama Lengkap', value: deletingEmp.fullName },
                { label: 'Email', value: deletingEmp.email },
                { label: 'Departemen', value: deletingEmp.departmentName || '—' },
              ]
            : []
        }
        confirmText="Hapus Karyawan"
        variant="danger"
        isLoading={isDeleting}
        error={deleteError}
      />
    </DashboardLayout>
  );
}
