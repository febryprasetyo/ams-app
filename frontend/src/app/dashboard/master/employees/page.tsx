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
  Mail,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  UserCheck
} from 'lucide-react';

interface Department {
  id: number;
  code: string;
  name: string;
}

interface Location {
  id: number;
  code: string;
  name: string;
}

interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  departmentId?: number | null;
  locationId?: number | null;
  position?: string | null;
  status: string;
  departmentName?: string | null;
  departmentCode?: string | null;
  locationName?: string | null;
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
  const [formName, setFormName] = useState('');
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
      setError(err.message || 'Failed to load employee records');
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
    setFormName('');
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
    setFormName(emp.fullName);
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
    setFormName('');
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

    const payload = {
      employeeCode: formCode,
      fullName: formName,
      email: formEmail,
      phone: formPhone || null,
      departmentId: formDeptId ? Number(formDeptId) : null,
      locationId: formLocId ? Number(formLocId) : null,
      position: formPosition || null,
      status: formStatus,
    };

    try {
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
    if (!window.confirm('Are you sure you want to deactivate or delete this employee record?')) return;
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
      (e.departmentName && e.departmentName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Employee Directory</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {employees.length} Staff
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff registry for asset assignment, ticket reporting, and M365 account mapping
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-xl shadow-red-600/20 transition-all cursor-pointer text-xs flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Bento Stat Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
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
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-mono">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Assigned Departments</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{departments.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
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
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between gap-4 bg-white">
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
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span>Fetching employee directory...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-semibold text-sm">No employees found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new staff member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-semibold">NIK Code</th>
                    <th className="py-3.5 px-5 font-semibold">Full Name & Position</th>
                    <th className="py-3.5 px-5 font-semibold">Corporate Email</th>
                    <th className="py-3.5 px-5 font-semibold">Dept & Location</th>
                    <th className="py-3.5 px-5 font-semibold">Status</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((emp) => {
                    const isActive = (emp.status || '').toLowerCase() === 'active';
                    return (
                      <tr key={emp.id} className="hover:bg-red-50/30 transition-colors group">
                        <td className="py-4 px-5 font-mono">
                          <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold">
                            {emp.employeeCode}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{emp.position || 'Staff'}</p>
                        </td>
                        <td className="py-4 px-5 font-mono text-[11px] text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{emp.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-700">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">{emp.departmentName || '—'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{emp.locationName || 'Unassigned'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                              isActive
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-red-600' : 'bg-slate-400'}`} />
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                              title="Edit Employee"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                              title="Deactivate / Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                <span>{editingEmp ? 'Edit Employee Profile' : 'Register New Employee'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Employee Code (NIK)
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="EMP-001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="budi@company.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+62 812 3456 7890"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Department
                  </label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
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
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Office Location
                  </label>
                  <select
                    value={formLocId}
                    onChange={(e) => setFormLocId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  >
                    <option value="">Select Location...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Position Title
                  </label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="Senior Software Engineer"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Account Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingEmp ? 'Update Employee' : 'Save Employee'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
