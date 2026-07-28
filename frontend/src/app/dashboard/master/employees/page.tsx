'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Location {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  locationId?: number | null;
  locationName?: string | null;
  position?: string | null;
  status: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  
  const [formCode, setFormCode] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDeptId, setFormDeptId] = useState<string>('');
  const [formLocId, setFormLocId] = useState<string>('');
  const [formPosition, setFormPosition] = useState('');
  const [formStatus, setFormStatus] = useState('Active');

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empData, deptData, locData] = await Promise.all([
        api.get<Employee[]>('/employees'),
        api.get<Department[]>('/master/departments'),
        api.get<Location[]>('/master/locations'),
      ]);
      setEmployees(empData);
      setDepartments(deptData);
      setLocations(locData);
    } catch (err: any) {
      setError(err.message || 'Failed to load employee master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingEmp(null);
    setFormCode('');
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormDeptId('');
    setFormLocId('');
    setFormPosition('');
    setFormStatus('Active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFormCode(emp.employeeCode);
    setFormFullName(emp.fullName);
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormDeptId(emp.departmentId ? String(emp.departmentId) : '');
    setFormLocId(emp.locationId ? String(emp.locationId) : '');
    setFormPosition(emp.position || '');
    setFormStatus(emp.status || 'Active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmp(null);
    setFormCode('');
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormDeptId('');
    setFormLocId('');
    setFormPosition('');
    setFormStatus('Active');
    setModalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const payload = {
        employeeCode: formCode,
        fullName: formFullName,
        email: formEmail,
        phone: formPhone || null,
        departmentId: formDeptId ? Number(formDeptId) : null,
        locationId: formLocId ? Number(formLocId) : null,
        position: formPosition || null,
        status: formStatus,
      };

      if (editingEmp) {
        await api.put(`/employees/${editingEmp.id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      closeModal();
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(search.toLowerCase())) ||
      (e.locationName && e.locationName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-mono text-[#F8FAFC] flex items-center gap-3">
              <Users className="w-7 h-7 text-[#22C55E]" />
              <span>Employee Directory</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Manage personnel records, department assignments, and work locations
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-slate-950 font-semibold rounded-xl transition-all shadow-md shadow-[#22C55E]/10 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, email, department..."
              className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E] transition-colors"
            />
          </div>

          <div className="text-xs font-mono text-slate-400">
            Total: <span className="text-[#22C55E] font-bold">{filtered.length}</span> employees
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-slate-400 gap-3 font-mono">
              <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
              <span>Loading employee directory...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-sans">
              <p className="text-base">No employees found.</p>
              <p className="text-xs text-slate-500 mt-1">Try refining your search query or add a new employee.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F172A] border-b border-[#334155] text-xs font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Full Name</th>
                    <th className="py-3.5 px-4">Email / Phone</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Position</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155] text-sm">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#020617]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#22C55E] text-xs">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{emp.fullName}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                        <div>{emp.email}</div>
                        {emp.phone && <div className="text-slate-400 text-[11px] mt-0.5">{emp.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {emp.departmentName ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {emp.departmentName}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {emp.locationName ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {emp.locationName}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {emp.position ? (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {emp.position}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <h3 className="text-lg font-bold font-mono text-[#F8FAFC]">
                  {editingEmp ? 'Edit Employee Record' : 'Add New Employee'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Employee Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. EMP-1001"
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="e.g. Alice Smith"
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. alice@company.com"
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +62 812 3456 7890"
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={formDeptId}
                      onChange={(e) => setFormDeptId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Location
                    </label>
                    <select
                      value={formLocId}
                      onChange={(e) => setFormLocId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    >
                      <option value="">Select Location...</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Job Position / Title
                    </label>
                    <input
                      type="text"
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      placeholder="e.g. Senior IT Support Engineer"
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Employment Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#334155]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-slate-950 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingEmp ? 'Save Changes' : 'Create Employee'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
