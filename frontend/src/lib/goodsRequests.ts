export const GA_BASE_PATH = '/dashboard/ga/requests';
export const GA_API_PATH = '/ga/requests';

export function localEvidenceKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const MAX_EVIDENCE_SIZE = 512000;

export * from '@/types/goodsRequest';

export const rupiah = (value: number | string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

export const requestNumber = (request: { id: string; requestDate: string }) =>
  'GA-' + request.requestDate.replaceAll('-', '') + '-' + request.id.slice(0, 8).toUpperCase();

export function formatFirstItemTitle(request: { firstItemName?: string | null; title?: string | null }): string {
  let name = request.firstItemName?.trim() || request.title?.trim() || 'Belum ada barang';
  name = name.replace(/^(pengajuan|pengadaan|permintaan)\s*[:-]?\s*/i, '');
  name = name.replace(/\bpengajuan\s*[:-]?\s*/gi, '');
  return name.trim() || 'Belum ada barang';
}

export async function compressEvidence(file: File): Promise<File> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Gunakan gambar PNG, JPEG, atau WebP.');
  }
  if (file.size > 15000000) {
    throw new Error('Ukuran gambar asli maksimal 15 MB.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 20000000) {
      throw new Error('Resolusi gambar terlalu besar. Potong bagian barang dan harga terlebih dahulu.');
    }
    const ratio = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) {
      if (file.size <= MAX_EVIDENCE_SIZE) return file;
      throw new Error('Browser tidak mendukung pemrosesan gambar.');
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const type of ['image/webp', 'image/jpeg']) {
      for (const quality of [0.86, 0.76, 0.65]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
        if (blob && blob.size > 0 && blob.size <= MAX_EVIDENCE_SIZE) {
          const ext = type === 'image/webp' ? 'webp' : 'jpg';
          return new File([blob], `bukti-harga.${ext}`, { type: blob.type || type });
        }
      }
    }
    if (file.size <= MAX_EVIDENCE_SIZE) {
      return file;
    }
    throw new Error('Gambar masih melebihi 500 KB. Potong bagian barang dan harga lalu coba kembali.');
  } catch (err) {
    if (file.size <= MAX_EVIDENCE_SIZE) {
      return file;
    }
    throw err;
  } finally {
    URL.revokeObjectURL(url);
  }
}
