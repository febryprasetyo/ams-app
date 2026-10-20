import { z } from 'zod';

export type GoodsRequestStatus =
  | 'draft'
  | 'ready_to_print'
  | 'pending_signature'
  | 'approved_manually'
  | 'processing'
  | 'completed'
  | 'cancelled';

export const ALLOWED_STATUS_TRANSITIONS: Record<GoodsRequestStatus, GoodsRequestStatus[]> = {
  draft: ['ready_to_print', 'cancelled'],
  ready_to_print: ['pending_signature', 'draft', 'cancelled'],
  pending_signature: ['approved_manually', 'draft', 'cancelled'],
  approved_manually: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function isValidStatusTransition(from: GoodsRequestStatus, to: GoodsRequestStatus): boolean {
  if (from === to) return false;
  const allowed = ALLOWED_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export class GoodsInputError extends Error {}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Tanggal tidak valid');

const itemSchema = z.object({
  name: z.string().trim().min(1).max(1000),
  quantity: z.number().int().min(1).max(1000000),
  estimatedPrice: z.number().int().min(1).max(100000000000),
  notes: z.string().trim().max(2000).default(''),
  attachmentKeys: z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)).max(3).default([]),
});

const draftItemSchema = z.object({
  name: z.string().trim().max(1000).default(''),
  quantity: z.number().int().min(0).max(1000000).default(1),
  estimatedPrice: z.number().int().min(0).max(100000000000).default(0),
  notes: z.string().trim().max(2000).default(''),
  attachmentKeys: z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)).max(3).default([]),
});

const fullSchema = z.object({
  title: z.string().trim().max(255).default(''),
  purpose: z.string().trim().max(2000).default(''),
  requestDate: date,
  requesterName: z.string().trim().min(1).max(150),
  jobTitle: z.string().trim().min(1).max(150),
  division: z.string().trim().min(1).max(150),
  items: z.array(itemSchema).min(1).max(20),
});

const draftSchema = z.object({
  title: z.string().trim().max(255).default(''),
  purpose: z.string().trim().max(2000).default(''),
  requestDate: z.string().trim().max(50).default(''),
  requesterName: z.string().trim().max(150).default(''),
  jobTitle: z.string().trim().max(150).default(''),
  division: z.string().trim().max(150).default(''),
  items: z.array(draftItemSchema).max(20).default([]),
});

export function validateGoodsRequest(input: unknown, uploadKeys: string[] = [], isDraft = false) {
  if (isDraft) {
    const parsed = draftSchema.safeParse(input);
    if (!parsed.success) {
      throw new GoodsInputError('Data draft tidak valid.');
    }
    const safeDate = parsed.data.requestDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.data.requestDate)
      ? parsed.data.requestDate
      : new Date().toISOString().slice(0, 10);
    const items = parsed.data.items.map((item) => {
      const subtotal = item.quantity * item.estimatedPrice;
      return { ...item, subtotal };
    });
    return {
      ...parsed.data,
      requestDate: safeDate,
      status: 'draft' as GoodsRequestStatus,
      items,
    };
  }

  const parsed = fullSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const row = issue.path[0] === 'items' && typeof issue.path[1] === 'number' ? `Item ${issue.path[1] + 1}: ` : '';
    throw new GoodsInputError(row + 'Lengkapi data dengan benar. Jumlah dan harga satuan harus bilangan bulat positif, maksimal 20 item dan 3 gambar per item.');
  }
  if (new Set(uploadKeys).size !== uploadKeys.length) throw new GoodsInputError('Lampiran duplikat.');
  const used = new Set<string>();
  const items = parsed.data.items.map((item, index) => {
    if (!item.attachmentKeys.length || item.attachmentKeys.some(key => !uploadKeys.includes(key) || used.has(key))) {
      throw new GoodsInputError(`Item ${index + 1} — ${item.name} belum memiliki lampiran bukti harga yang valid.`);
    }
    for (const key of item.attachmentKeys) {
      if (used.has(key)) throw new GoodsInputError(`Item ${index + 1}: lampiran duplikat.`);
      used.add(key);
    }
    const subtotal = item.quantity * item.estimatedPrice;
    if (!Number.isSafeInteger(subtotal) || subtotal > 99999999999999) throw new GoodsInputError(`Item ${index + 1}: subtotal terlalu besar.`);
    return { ...item, subtotal };
  });
  if (used.size !== uploadKeys.length) throw new GoodsInputError('Ada lampiran yang tidak digunakan.');
  const title = parsed.data.title || (items[0]?.name ? ((`Pengadaan ` + items[0].name)) : 'Permintaan Barang');
  return { ...parsed.data, title, status: 'ready_to_print' as GoodsRequestStatus, items };
}
