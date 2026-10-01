'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface TalentaMonthPickerPopoverProps {
  selectedYear: number;
  selectedMonth: number; // 1 - 12
  onSelect: (year: number, month: number) => void;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function TalentaMonthPickerPopover({
  selectedYear,
  selectedMonth,
  onSelect,
}: TalentaMonthPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [navYear, setNavYear] = useState(selectedYear);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync navYear when selectedYear changes
  useEffect(() => {
    setNavYear(selectedYear);
  }, [selectedYear]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentMonthLabel = `${MONTHS_SHORT[selectedMonth - 1]} ${selectedYear}`;

  const handleSelectMonth = (monthIndex: number) => {
    onSelect(navYear, monthIndex + 1);
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    setNavYear(y);
    onSelect(y, m);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{currentMonthLabel}</span>
        <Calendar size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-64 rounded-xl bg-white border border-slate-200 shadow-lg p-3 text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Year Navigator */}
          <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setNavYear(navYear - 1)}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              aria-label="Tahun sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-800 text-sm tabular-nums">
              {navYear}
            </span>
            <button
              type="button"
              onClick={() => setNavYear(navYear + 1)}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              aria-label="Tahun berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-3 gap-1.5 py-1">
            {MONTHS_SHORT.map((name, idx) => {
              const isSelected = navYear === selectedYear && selectedMonth === idx + 1;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick Action: This Month */}
          <div className="mt-2 pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              This Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
