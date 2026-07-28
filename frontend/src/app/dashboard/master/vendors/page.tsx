'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Store,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  UserCheck,
  Building2,
  ShieldAlert
} from 'lucide-react';

interface Vendor {
  id: number;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formName, setFormName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Vendor[]>('/master/vendors');
      setVendors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormName('');
    setFormContactName('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vendor) => {
    setEditingVendor(v);
    setFormName(v.name);
    setFormContactName(v.contactName || '');
    setFormEmail(v.email || '');
    setFormPhone(v.phone || '');
    setFormAddress(v.address || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setFormName('');
    setFormContactName('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setModalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingVendor) {
        await api.put(`/master/vendors/${editingVendor.id}`, {
          name: formName,
          contactName: formContactName || null,
          email: formEmail || null,
          phone: formPhone || null,
          address: formAddress || null,
        });
      } else {
        await api.post('/master/vendors', {
          name: formName,
          contactName: formContactName || null,
          email: formEmail || null,
          phone: formPhone || null,
          address: formAddress || null,
        });
      }
      closeModal();
      fetchVendors();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await api.delete(`/master/vendors/${id}`);
      fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to delete vendor');
    }
  };

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.contactName && v.contactName.toLowerCase().includes(search.toLowerCase())) ||
      (v.email && v.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>IT Suppliers & Vendors</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {vendors.length} Vendors
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware procurement, software licensing providers & maintenance contractors
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-xl shadow-red-600/20 transition-all cursor-pointer text-xs flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Bento Stat Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-mono">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Partners</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{vendors.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-mono">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Account Reps</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {vendors.filter((v) => v.contactName).length} Active
              </p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-mono">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">SLA Rating</p>
              <p className="text-xs font-mono font-semibold text-red-600 mt-1">Tier-1 Approved</p>
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
              placeholder="Search vendor name, contact person, email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Showing <strong className="text-slate-900">{filtered.length}</strong> of {vendors.length}
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
              <span>Fetching vendor catalog...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Store className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-semibold text-sm">No vendors found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting search parameters or add a new supplier.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-semibold">ID</th>
                    <th className="py-3.5 px-5 font-semibold">Vendor Company</th>
                    <th className="py-3.5 px-5 font-semibold">Contact Person</th>
                    <th className="py-3.5 px-5 font-semibold">Email & Phone</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-red-50/30 transition-colors group">
                      <td className="py-4 px-5 font-mono text-slate-400">#{v.id}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {v.name}
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-medium">
                        {v.contactName || <span className="text-slate-400 italic">Not specified</span>}
                      </td>
                      <td className="py-4 px-5">
                        <div className="space-y-1 font-mono text-[11px]">
                          {v.email && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>{v.email}</span>
                            </div>
                          )}
                          {v.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{v.phone}</span>
                            </div>
                          )}
                          {!v.email && !v.phone && <span className="text-slate-400 italic">No contact details</span>}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Edit Vendor"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Delete Vendor"
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
                <Store className="w-5 h-5 text-red-600" />
                <span>{editingVendor ? 'Edit Supplier' : 'Add New Supplier'}</span>
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
                  Vendor / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. PT Bhinneka Mentari Dimensi"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                  Contact Person (PIC)
                </label>
                <input
                  type="text"
                  value={formContactName}
                  onChange={(e) => setFormContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="sales@vendor.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+62 21 555-0192"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Office address..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 resize-none"
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
                    <span>{editingVendor ? 'Update Supplier' : 'Save Supplier'}</span>
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
