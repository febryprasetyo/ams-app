'use client';

import React from "react";
import ModalShell from "@/components/ui/ModalShell";
import { UserItem } from "@/lib/access/types";
import { KeyRound, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  onSubmit: (userId: number) => Promise<void>;
  isLoading?: boolean;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading = false,
}: ResetPasswordModalProps) {
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(user.id);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password Akun"
      subtitle={`Buat password temporary baru untuk ${user.username} (${user.email})`}
      icon={<KeyRound className="w-5 h-5 text-amber-600" />}
      maxWidthClass="max-w-md"
      isLoading={isLoading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="reset-password-form"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Reset & Buat Password Baru</span>
          </button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Notice */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold">Konfirmasi Reset Password:</span> Sistem akan otomatis membuatkan password temporary baru. Password lama akan langsung tidak berlaku dan pengguna diwajibkan membuat password baru saat login berikutnya.
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5 text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Username:</span>
            <span className="font-mono font-bold text-slate-900">{user.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="font-mono text-slate-700">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Role:</span>
            <span className="font-medium text-slate-800">{user.roleName || user.role}</span>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
