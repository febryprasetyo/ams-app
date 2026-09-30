export function computeImportSummaryState(summary) {
  if (!summary) {
    return {
      canCommit: false,
      badgeVariant: 'neutral',
      headline: 'Menunggu Validasi',
    };
  }

  const hasErrors = (summary.errorCount || 0) > 0;
  if (hasErrors) {
    return {
      canCommit: false,
      badgeVariant: 'danger',
      headline: 'Terdapat Kesalahan',
    };
  }

  return {
    canCommit: true,
    badgeVariant: 'success',
    headline: 'Siap Di-import',
  };
}

export function formatDepartmentNotice(newDepartments) {
  if (!newDepartments || newDepartments.length === 0) {
    return null;
  }
  const count = newDepartments.length;
  const listStr = newDepartments.join(', ');
  return `${count} departemen baru akan otomatis dibuat: ${listStr}`;
}
