export function getImportBatchRowCount(batch: { rows: unknown[]; totalRows?: number }): number {
  return Number.isFinite(batch.totalRows) ? Number(batch.totalRows) : batch.rows.length;
}
