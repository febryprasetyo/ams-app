'use client';

import React from 'react';

export type StatusBadgeVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'slate'
  | 'default';

export interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  info: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  purple: 'bg-amber-50 text-amber-700 border-amber-200/80',
  slate: 'bg-slate-50 text-slate-600 border-slate-200/80',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function StatusBadge({
  children,
  variant = 'default',
  icon,
  size = 'sm',
  className = '',
}: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant]} ${sizeClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
