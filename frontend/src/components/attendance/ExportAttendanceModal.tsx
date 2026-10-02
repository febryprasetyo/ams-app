'use client';

import { useState, useMemo } from 'react';
import { Search, Download, CheckSquare, Square, Building2, Users } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import type { EmployeeReport, RecordFilter, MasterItem } from '@/lib/attendance/types';
import { dateLabel } from '@/lib/attendance/domain';

interface ExportAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: MasterItem[];
  reports: EmployeeReport[];
  filter: RecordFilter;
  onExport: (selectedReports: EmployeeReport[]) => void;
}

export function ExportAttendanceModal({
  isOpen,
  onClose,
  departments,
  reports,
  filter,
  onExport,
}: ExportAttendanceModalProps) {
  // Set of selected department IDs (default: all departments with employees)
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<number>>(() => {
    return new Set(departments.map(d => d.id));
  });

  // Set of selected employee IDs (default: all employees in reports)
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(() => {
    return new Set(reports.map(r => r.employee.id));
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Department employee counts map
  const deptCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const r of reports) {
      const deptId = r.employee.departmentId || 0;
      map.set(deptId, (map.get(deptId) || 0) + 1);
    }
    return map;
  }, [reports]);

  // Toggle single department
  const toggleDepartment = (deptId: number) => {
    const nextDepts = new Set(selectedDeptIds);
    const nextEmps = new Set(selectedEmpIds);

    const willSelect = !nextDepts.has(deptId);
    if (willSelect) {
      nextDepts.add(deptId);
      // Also select all employees belonging to this department
      for (const r of reports) {
        if ((r.employee.departmentId || 0) === deptId) {
          nextEmps.add(r.employee.id);
        }
      }
    } else {
      nextDepts.delete(deptId);
      // Deselect employees of this department
      for (const r of reports) {
        if ((r.employee.departmentId || 0) === deptId) {
          nextEmps.delete(r.employee.id);
        }
      }
    }

    setSelectedDeptIds(nextDepts);
    setSelectedEmpIds(nextEmps);
  };

  // Select all departments
  const selectAllDepartments = () => {
    setSelectedDeptIds(new Set(departments.map(d => d.id)));
    setSelectedEmpIds(new Set(reports.map(r => r.employee.id)));
  };

  // Deselect all departments
  const deselectAllDepartments = () => {
    setSelectedDeptIds(new Set());
    setSelectedEmpIds(new Set());
  };

  // Filtered employees for person-level selection
  const visibleReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter(r => {
      const deptId = r.employee.departmentId || 0;
      // Must match selected departments (if any departments selected)
      const deptMatch = selectedDeptIds.size === 0 || selectedDeptIds.has(deptId);
      if (!deptMatch) return false;

      if (!q) return true;
      const nameMatch = (r.employee.fullName || '').toLowerCase().includes(q);
      const codeMatch = (r.employee.employeeCode || '').toLowerCase().includes(q);
      return nameMatch || codeMatch;
    });
  }, [reports, selectedDeptIds, searchQuery]);

  // Toggle single employee
  const toggleEmployee = (empId: number) => {
    const next = new Set(selectedEmpIds);
    if (next.has(empId)) {
      next.delete(empId);
    } else {
      next.add(empId);
    }
    setSelectedEmpIds(next);
  };

  // Select all visible employees
  const selectAllVisibleEmployees = () => {
    const next = new Set(selectedEmpIds);
    for (const r of visibleReports) {
      next.add(r.employee.id);
    }
    setSelectedEmpIds(next);
  };

  // Deselect all visible employees
  const deselectAllVisibleEmployees = () => {
    const next = new Set(selectedEmpIds);
    for (const r of visibleReports) {
      next.delete(r.employee.id);
    }
    setSelectedEmpIds(next);
  };

  const handleExportClick = () => {
    const targetReports = reports.filter(r => selectedEmpIds.has(r.employee.id));
    if (targetReports.length === 0) return;
    onExport(targetReports);
    onClose();
  };

  const selectedCount = selectedEmpIds.size;
  const totalCount = reports.length;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Ekspor Rekap Absensi"
      subtitle="Pilih divisi dan nama karyawan yang akan disertakan dalam file Excel."
      maxWidthClass="max-w-2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <span className="text-xs text-slate-500 text-left">
            File output: <strong className="font-semibold text-slate-700">rekap-absensi-{filter.startDate}-{filter.endDate}.xlsx</strong>
          </span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="hr-btn text-xs px-4 py-2"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleExportClick}
              className="hr-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Unduh Excel ({selectedCount} Karyawan)</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Periode Badge Header */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Periode Awal:</span>
            <strong className="text-slate-900 font-semibold">{dateLabel(filter.startDate)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Periode Akhir:</span>
            <strong className="text-slate-900 font-semibold">{dateLabel(filter.endDate)}</strong>
          </div>
        </div>

        {/* Section 1: Divisi / Departemen Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 size={14} className="text-slate-500" />
              <span>Pilih Divisi / Departemen ({departments.length})</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={selectAllDepartments}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
              >
                Pilih Semua Divisi
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={deselectAllDepartments}
                className="text-slate-500 hover:text-slate-700 hover:underline font-medium cursor-pointer"
              >
                Hapus Pilihan
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/60 rounded-xl border border-slate-200/80 max-h-32 overflow-y-auto">
            {departments.map(dept => {
              const count = deptCountMap.get(dept.id) || 0;
              const isSelected = selectedDeptIds.has(dept.id);
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => toggleDepartment(dept.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{dept.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Karyawan Filter (Multi-Person Selection) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Users size={14} className="text-slate-500" />
              <span>Pilih Karyawan ({selectedCount} dari {totalCount} dipilih)</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={selectAllVisibleEmployees}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
              >
                Pilih Semua Ditampilkan
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={deselectAllVisibleEmployees}
                className="text-slate-500 hover:text-slate-700 hover:underline font-medium cursor-pointer"
              >
                Hapus Pilihan
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau ID karyawan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Scrollable Employees Checklist */}
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-64 overflow-y-auto bg-white">
            {visibleReports.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                Tidak ada karyawan yang sesuai filter atau divisi terpilih.
              </div>
            ) : (
              visibleReports.map(r => {
                const isSelected = selectedEmpIds.has(r.employee.id);
                const deptName = departments.find(d => d.id === r.employee.departmentId)?.name || '—';

                return (
                  <label
                    key={r.employee.id}
                    className={`flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleEmployee(r.employee.id)}
                        className="text-blue-600 shrink-0 focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-blue-600 fill-blue-50" />
                        ) : (
                          <Square size={16} className="text-slate-300" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 truncate">
                            {r.employee.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {r.employee.employeeCode}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {deptName}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0 tabular-nums">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                        Hadir: {r.recordCount}
                      </span>
                      {(r.izinCount || 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                          Izin: {r.izinCount}
                        </span>
                      )}
                      {(r.sakitCount || 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-medium">
                          Sakit: {r.sakitCount}
                        </span>
                      )}
                      {(r.cutiCount || 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                          Cuti: {r.cutiCount}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
