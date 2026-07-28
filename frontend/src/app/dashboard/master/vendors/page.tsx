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
  CheckCircle2,
  Mail,
  Phone,
  UserCheck,
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

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormName(vendor.name);
    setFormContactName(vendor.contactName || '');
    setFormEmail(vendor.email || '');
    setFormPhone(vendor.phone || '');
    setFormAddress(vendor.address || '');
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
      const payload = {
        name: formName,
        contactName: formContactName || null,
        email: formEmail || null,
        phone: formPhone || null,
        address: formAddress || null,
      };

      if (editingVendor) {
        await api.put(`/master/vendors/${editingVendor.id}`, payload);
      } else {
        await api.post('/master/vendors', payload);
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
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-mono text-[#F8FAFC] flex items-center gap-3">
              <Store className="w-7 h-7 text-[#22C55E]" />
              <span>Vendor Master</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Manage hardware suppliers, software licensing partners, and IT service providers
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-slate-950 font-semibold rounded-xl transition-all shadow-md shadow-[#22C55E]/10 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
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
              placeholder="Search vendor by name, contact, or email..."
              className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E] transition-colors"
            />
          </div>

          <div className="text-xs font-mono text-slate-400">
            Total: <span className="text-[#22C55E] font-bold">{filtered.length}</span> vendors
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
              <span>Loading vendors...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-sans">
              <p className="text-base">No vendors found.</p>
              <p className="text-xs text-slate-500 mt-1">Try refining your search query or add a new vendor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F172A] border-b border-[#334155] text-xs font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Vendor Name</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155] text-sm">
                  {filtered.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-[#020617]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">#{vendor.id}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{vendor.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {vendor.contactName ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {vendor.contactName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                        {vendor.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {vendor.email}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                        {vendor.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {vendor.phone}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(vendor)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
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
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                <h3 className="text-lg font-bold font-mono text-[#F8FAFC]">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
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
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Vendor Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. PT Synnex Metrodata Indonesia"
                    className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder="e.g. John Doe"
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
                      placeholder="e.g. +62 21 555 1234"
                      className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. sales@vendor.com"
                    className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. APL Tower 38th Floor, Grogol, Jakarta Barat"
                    className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#334155] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-[#22C55E]"
                  />
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
                    <span>{editingVendor ? 'Save Changes' : 'Create Vendor'}</span>
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
