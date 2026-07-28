'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  MapPin,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Building,
  Navigation,
  Globe
} from 'lucide-react';

interface Location {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  createdAt?: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Location[]>('/master/locations');
      setLocations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreateModal = () => {
    setEditingLoc(null);
    setFormCode('');
    setFormName('');
    setFormAddress('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLoc(loc);
    setFormCode(loc.code || '');
    setFormName(loc.name);
    setFormAddress(loc.address || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLoc(null);
    setFormCode('');
    setFormName('');
    setFormAddress('');
    setModalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingLoc) {
        await api.put(`/master/locations/${editingLoc.id}`, {
          code: formCode,
          name: formName,
          address: formAddress || null,
        });
      } else {
        await api.post('/master/locations', {
          code: formCode,
          name: formName,
          address: formAddress || null,
        });
      }
      closeModal();
      fetchLocations();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      await api.delete(`/master/locations/${id}`);
      fetchLocations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete location');
    }
  };

  const filtered = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.code && l.code.toLowerCase().includes(search.toLowerCase())) ||
      (l.address && l.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Primary Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Office Locations</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {locations.length} Sites
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Headquarters, branch offices, and data center facilities
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-xl shadow-red-600/20 transition-all cursor-pointer text-xs flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Location</span>
          </button>
        </div>

        {/* Bento Stat Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-mono">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Registered Sites</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{locations.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-mono">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Primary HQ</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">Jakarta Head Office</p>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-mono">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Coverage</p>
              <p className="text-xs font-mono font-semibold text-red-600 mt-1">Multi-Region Active</p>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between gap-4 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search location name, code, or address..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Showing <strong className="text-slate-900">{filtered.length}</strong> of {locations.length}
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
              <span>Fetching location records...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-semibold text-sm">No locations found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting search parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-semibold">ID</th>
                    <th className="py-3.5 px-5 font-semibold">Code</th>
                    <th className="py-3.5 px-5 font-semibold">Location Name</th>
                    <th className="py-3.5 px-5 font-semibold">Full Address</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((loc) => (
                    <tr key={loc.id} className="hover:bg-red-50/30 transition-colors group">
                      <td className="py-4 px-5 font-mono text-slate-400">#{loc.id}</td>
                      <td className="py-4 px-5 font-mono">
                        <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold">
                          {loc.code || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
                        {loc.name}
                      </td>
                      <td className="py-4 px-5 text-slate-600">
                        {loc.address || <span className="text-slate-400 font-mono italic">No address listed</span>}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(loc)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Edit Location"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(loc.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Delete Location"
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
                <MapPin className="w-5 h-5 text-red-600" />
                <span>{editingLoc ? 'Edit Location' : 'Create Location'}</span>
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
                  Location Code
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. JKT-HO, SUB-BO"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Head Office Jakarta"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2 font-semibold">
                  Full Address
                </label>
                <textarea
                  rows={3}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street address, city, building floor..."
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
                    <span>{editingLoc ? 'Update Location' : 'Create Location'}</span>
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
