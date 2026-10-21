import { getAllowedTransitions, getStatusLabel, GoodsRequestStatus } from './goodsRequestStatus';

export interface TransitionOption {
  value: GoodsRequestStatus;
  label: string;
  description: string;
}

const TRANSITION_DESCRIPTIONS: Partial<Record<GoodsRequestStatus, string>> = {
  draft: 'Kembalikan pengajuan ke mode draft untuk perbaikan rincian atau data.',
  ready_to_print: 'Permintaan menunggu keputusan persetujuan. Formulir dapat langsung dicetak.',
  pending_signature: 'Dokumen telah dicetak dan sedang diedarkan untuk tanda tangan basah.',
  approved_manually: 'Permintaan barang sudah mendapat persetujuan (ACC).',
  processing: 'Pengajuan sedang dalam proses pemesanan/pembelian barang oleh GA.',
  completed: 'Barang telah diterima dan proses pengadaan selesai.',
  rejected: 'Tolak permintaan barang dengan menyertakan alasan penolakan.',
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
