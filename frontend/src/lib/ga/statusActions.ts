import { getAllowedTransitions, getStatusLabel, GoodsRequestStatus } from './goodsRequestStatus';

export interface TransitionOption {
  value: GoodsRequestStatus;
  label: string;
  description: string;
}

const TRANSITION_DESCRIPTIONS: Partial<Record<GoodsRequestStatus, string>> = {
  draft: 'Kembalikan pengajuan ke mode draft untuk perbaikan rincian atau data.',
  ready_to_print: 'Pengajuan telah lengkap dan siap dicetak secara fisik.',
  pending_signature: 'Dokumen telah dicetak dan sedang diedarkan untuk tanda tangan basah.',
  approved_manually: 'Persetujuan internal lengkap dengan tanda tangan basah 5 pihak.',
  processing: 'Pengajuan sedang dalam proses pemesanan/pembelian barang oleh GA.',
  completed: 'Barang telah diterima dan proses pengadaan selesai.',
  cancelled: 'Batalkan pengajuan (wajib menyertakan alasan pembatalan).',
};

export function getAvailableTransitionsWithLabels(currentStatus: GoodsRequestStatus): TransitionOption[] {
  const allowed = getAllowedTransitions(currentStatus);
  return allowed.map((status) => ({
    value: status,
    label: getStatusLabel(status),
    description: TRANSITION_DESCRIPTIONS[status] || '',
  }));
}
