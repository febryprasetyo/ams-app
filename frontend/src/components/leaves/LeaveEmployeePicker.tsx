'use client';

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export interface LeaveEmployeeItem {
  id: number;
  fullName: string;
  employeeCode: string;
  position?: string;
  departmentName?: string;
}

interface LeaveEmployeePickerProps {
  value: LeaveEmployeeItem | null;
  onChange: (employee: LeaveEmployeeItem | null) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export default function LeaveEmployeePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  label = "Nama Karyawan",
}: LeaveEmployeePickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<LeaveEmployeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function fetchEmployees() {
      setLoading(true);
      try {
        const data = await api.get<LeaveEmployeeItem[]>("/leaves/employees");
        if (active && Array.isArray(data)) {
          setEmployees(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data karyawan:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchEmployees();
    return () => {
      active = false;
    };
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filtered = employees.filter((emp) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (emp.fullName || "").toLowerCase().includes(q) ||
      (emp.employeeCode || "").toLowerCase().includes(q) ||
      (emp.departmentName || "").toLowerCase().includes(q) ||
      (emp.position || "").toLowerCase().includes(q)
    );
  });

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 font-mono">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {value ? (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-xs font-bold text-slate-900">{value.fullName}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {value.employeeCode}
              </span>
            </div>
            <p className="truncate text-[11px] font-mono text-slate-500 mt-0.5">
              {value.departmentName || "—"} {value.position ? `(${value.position})` : ""}
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setSearch("");
                setOpen(true);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Ganti karyawan terpilih"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            placeholder="Cari nama karyawan atau NIK..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      )}

      {open && !value && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Memuat data karyawan...
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
              Tidak ada karyawan yang cocok dengan &quot;{search}&quot;.
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    onChange(emp);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-emerald-50/50 transition-colors cursor-pointer group"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      {emp.fullName}
                    </span>
                    <span className="block truncate text-[11px] font-mono text-slate-500">
                      {emp.departmentName || "—"} {emp.position ? `• ${emp.position}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 border border-slate-200">
                    {emp.employeeCode}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
