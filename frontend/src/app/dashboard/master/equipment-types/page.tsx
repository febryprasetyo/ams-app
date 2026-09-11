'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  AlertCircle,
  Calendar,
  Hash,
  Loader2,
  Pencil,
  Plus,
  Search,
  Shapes,
  Trash2,
  X,
} from 'lucide-react';

interface EquipmentType {
  id: number;
  name: string;
  codePrefix: string;
  createdAt?: string;
}

export default function EquipmentTypesPage() {
  const { user } = useAuth();
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [search, setSearch] = useState('');
  const [deletingType, setDeletingType] = useState<EquipmentType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);
  const [formName, setFormName] = useState('');
  const [formCodePrefix, setFormCodePrefix] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const normalizedRole = (user?.roleName || '').toLowerCase().replace(/_/g, '');
  const canManage = normalizedRole === 'superadmin' || normalizedRole === 'itadmin';

  const fetchEquipmentTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<EquipmentType[]>('/assets/categories');
      setEquipmentTypes(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load IT equipment types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Remote master data is intentionally loaded once when this route mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchEquipmentTypes();
  }, []);

  const filteredTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return equipmentTypes;

    return equipmentTypes.filter(
      (item) => item.name.toLowerCase().includes(query) || item.codePrefix.toLowerCase().includes(query),
    );
  }, [equipmentTypes, search]);

  const openCreateModal = () => {
    setEditingType(null);
    setFormName('');
    setFormCodePrefix('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (equipmentType: EquipmentType) => {
    setEditingType(equipmentType);
    setFormName(equipmentType.name);
    setFormCodePrefix(equipmentType.codePrefix);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setFormName('');
    setFormCodePrefix('');
    setModalError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setModalError(null);

    const payload = {
      name: formName.trim(),
      codePrefix: formCodePrefix.trim().toUpperCase(),
    };

    try {
      if (editingType) {
        await api.put(`/assets/categories/${editingType.id}`, payload);
      } else {
        await api.post('/assets/categories', payload);
      }
      closeModal();
      await fetchEquipmentTypes();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to save IT equipment type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (equipmentType: EquipmentType) => {
    setDeletingType(equipmentType);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingType) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/assets/categories/${deletingType.id}`);
      setDeletingType(null);
      await fetchEquipmentTypes();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus tipe peralatan');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20">
              <Shapes className="h-5 w-5" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
                IT Equipment Types
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 font-mono text-xs font-bold text-red-600">
                  {equipmentTypes.length} Types
                </span>
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Manage the device types and prefixes used by IT inventory.
              </p>
            </div>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-red-600/20 transition-all hover:-translate-y-0.5 hover:from-red-500 hover:to-red-600"
            >
              <Plus className="h-4 w-4" />
              Add Equipment Type
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass-panel flex items-center gap-4 rounded-2xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600">
              <Shapes className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Total Equipment Types</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-slate-900">{equipmentTypes.length}</p>
            </div>
          </div>
          <div className="glass-panel flex items-center gap-4 rounded-2xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Active Code Prefixes</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-slate-900">{equipmentTypes.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel flex items-center justify-between gap-4 rounded-2xl bg-white p-3.5">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by equipment type or prefix..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
            />
          </div>
          <span className="hidden font-mono text-xs text-slate-500 sm:inline">
            Showing <strong className="text-slate-900">{filteredTypes.length}</strong> of {equipmentTypes.length}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="glass-panel overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 font-mono text-xs text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              Loading IT equipment types...
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="p-12 text-center">
              <Shapes className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">No equipment types found</p>
              <p className="mt-1 text-xs text-slate-500">Add a type or adjust the search filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 font-mono uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5 font-semibold">ID</th>
                    <th className="px-5 py-3.5 font-semibold">Code Prefix</th>
                    <th className="px-5 py-3.5 font-semibold">Equipment Type Name</th>
                    <th className="px-5 py-3.5 font-semibold">Created Date</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTypes.map((equipmentType) => (
                    <tr key={equipmentType.id} className="group transition-colors hover:bg-red-50/30">
                      <td className="px-5 py-4 font-mono text-slate-400">#{equipmentType.id}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 font-mono font-bold text-red-700">
                          {equipmentType.codePrefix}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 transition-colors group-hover:text-red-600">
                        {equipmentType.name}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {equipmentType.createdAt ? new Date(equipmentType.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canManage && <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(equipmentType)}
                            className="rounded-xl border border-transparent p-2 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Edit Equipment Type"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(equipmentType)}
                            className="rounded-xl border border-transparent p-2 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            title="Delete Equipment Type"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Shapes className="h-5 w-5 text-red-600" />
                {editingType ? 'Edit Equipment Type' : 'Add Equipment Type'}
              </h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Equipment Type Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="e.g. Laptop, USB Hub, Scanner"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Code Prefix
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={formCodePrefix}
                  onChange={(event) => setFormCodePrefix(event.target.value.toUpperCase())}
                  placeholder="e.g. LPT, HUB, SCN"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs uppercase text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">Used to generate inventory codes, for example LPT-2026-0001.</p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingType ? 'Update Equipment Type' : 'Add Equipment Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDeleteModal
        isOpen={!!deletingType}
        onClose={() => {
          setDeletingType(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Tipe Peralatan"
        description="Apakah Anda yakin ingin menghapus tipe peralatan ini? Data yang terhapus tidak dapat dikembalikan."
        itemName={deletingType?.name}
        itemDetails={
          deletingType
            ? [
                { label: 'Nama Tipe', value: deletingType.name },
                { label: 'Prefix Kode', value: deletingType.codePrefix },
              ]
            : []
        }
        confirmText="Hapus Tipe"
        cancelText="Batal"
        isLoading={isDeleting}
        error={deleteError}
      />
    </DashboardLayout>
  );
}
