'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Hash,
  Sparkles,
  Layers,
  Calendar
} from 'lucide-react';

interface Department {
  id: number;
  code: string;
  name: string;
  createdAt?: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Department[]>('/master/departments');
      setDepartments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormCode('');
    setFormName('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormCode(dept.code);
    setFormName(dept.name);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setFormCode('');
    setFormName('');
    setModalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingDept) {
        await api.put(`/master/departments/${editingDept.id}`, {
          code: formCode,
          name: formName,
        });
      } else {
        await api.post('/master/departments', {
          code: formCode,
          name: formName,
        });
      }
      closeModal();
      fetchDepartments();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/master/departments/${id}`);
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Departments</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    {departments.length} Units
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organizational structures & division codes across business entities
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-xl shadow-red-600/20 transition-all cursor-pointer text-xs flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Department</span>
          </button>
        </div>

        {/* Bento Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-mono">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Entities</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{departments.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-mono">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Codes</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{departments.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-mono">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-xs font-mono font-semibold text-red-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Synced with ERP
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between gap-4 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by department name or code..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Showing <strong className="text-slate-900">{filtered.length}</strong> of {departments.length}
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
              <span>Fetching department data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-semibold text-sm">No departments found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search filter or add a new department.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-semibold">ID</th>
                    <th className="py-3.5 px-5 font-semibold">Code</th>
                    <th className="py-3.5 px-5 font-semibold">Department Name</th>
                    <th className="py-3.5 px-5 font-semibold">Created Date</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-red-50/30 transition-colors group"
                    >
                      <td className="py-4 px-5 font-mono text-slate-400">#{dept.id}</td>
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-red-700 px-2.5 py-1 rounded-md bg-red-50 border border-red-200">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
                        {dept.name}
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-mono flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Edit Department"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-200 bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                <span>{editingDept ? 'Edit Department' : 'Create Department'}</span>
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
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                  Department Code
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. IT, FIN, HR"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Information Technology"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
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
                    <span>{editingDept ? 'Update Department' : 'Create Department'}</span>
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
