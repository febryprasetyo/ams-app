'use client';

import React, { useState, useEffect } from "react";
import ModalShell from "@/components/ui/ModalShell";
import { UserItem, RoleItem, UserFormData } from "@/lib/access/types";
import { UserPlus, UserCog, Loader2, KeyRound } from "lucide-react";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: UserFormData) => Promise<void>;
  roles: RoleItem[];
  employees?: any[];
  initialData?: UserItem | null;
  isLoading?: boolean;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  roles,
  employees = [],
  initialData = null,
  isLoading = false,
}: UserFormModalProps) {
  const isEdit = Boolean(initialData);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<number>(roles[0]?.id || 1);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setEmail(initialData.email);
      setRoleId(initialData.roleId || roles[0]?.id || 1);
      setEmployeeId(initialData.employeeId || null);
      setStatus(initialData.status);
    } else {
      setUsername("");
      setEmail("");
      setRoleId(roles[0]?.id || 1);
      setEmployeeId(null);
      setStatus("active");
    }
    setError(null);
  }, [initialData, roles, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !email.trim()) {
      setError("Username and email are required");
      return;
    }

    try {
      await onSubmit({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        roleId: Number(roleId),
        employeeId: employeeId ? Number(employeeId) : null,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save user");
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit User Account" : "Create New User Account"}
      subtitle={isEdit ? "Update account details, role assignment, and employee mapping" : "Add user details and assign role permissions"}
      icon={isEdit ? <UserCog className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-red-600" />}
      maxWidthClass="max-w-lg"
      isLoading={isLoading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEdit ? "Save Changes" : "Create User"}</span>
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. john.doe"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@company.com"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        {/* Automatic Temporary Password Info (only on create) */}
        {!isEdit && (
          <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-red-900 text-xs flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-red-800">Temporary Password Otomatis:</span> Sistem akan otomatis membuatkan password temporary acak yang aman (huruf, angka & simbol). Password tersebut akan ditampilkan setelah akun dibuat untuk disalin.
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Role Assignment <span className="text-red-500">*</span>
          </label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code}) {r.isSystem ? "• System" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Linked Employee */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Linked Employee <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <select
            value={employeeId ?? ""}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
          >
            <option value="">-- No Linked Employee (System / Independent Account) --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.employeeCode})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Connects this login account with employee records for automated ticket & asset assignment.
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Account Status
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="radio"
                name="user-status"
                value="active"
                checked={status === "active"}
                onChange={() => setStatus("active")}
                className="text-red-600 focus:ring-red-500"
              />
              Active
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="radio"
                name="user-status"
                value="inactive"
                checked={status === "inactive"}
                onChange={() => setStatus("inactive")}
                className="text-red-600 focus:ring-red-500"
              />
              Inactive (Deactivated)
            </label>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
