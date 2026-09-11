import type { ReactNode } from 'react';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmDetailItem {
  label: string;
  value: ReactNode;
}

export function resolveConfirmText(
  variant: ConfirmVariant = 'danger',
  confirmText?: string
): string {
  if (confirmText && confirmText.trim().length > 0) {
    return confirmText.trim();
  }
  switch (variant) {
    case 'danger':
      return 'Hapus';
    case 'warning':
      return 'Lanjutkan';
    case 'primary':
      return 'Konfirmasi';
    default:
      return 'Konfirmasi';
  }
}

export function resolveVariantStyles(variant: ConfirmVariant = 'danger'): {
  iconContainerClass: string;
  confirmButtonClass: string;
} {
  switch (variant) {
    case 'danger':
      return {
        iconContainerClass: 'bg-rose-50 text-rose-600 border border-rose-100',
        confirmButtonClass: 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20',
      };
    case 'warning':
      return {
        iconContainerClass: 'bg-amber-50 text-amber-600 border border-amber-100',
        confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20',
      };
    case 'primary':
    default:
      return {
        iconContainerClass: 'bg-red-50 text-red-600 border border-red-100',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20',
      };
  }
}
