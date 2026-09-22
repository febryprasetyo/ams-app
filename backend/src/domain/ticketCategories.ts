import { z } from 'zod';

export const DEFAULT_TICKET_CATEGORIES = [
  {
    code: 'HDW',
    name: 'Hardware',
    description: 'Kendala fisik perangkat keras (Laptop, PC Desktop, Monitor, Komponen)',
  },
  {
    code: 'SFW',
    name: 'Software & Application',
    description: 'Kendala aplikasi kerja, sistem operasi, instalasi atau lisensi software',
  },
  {
    code: 'NET',
    name: 'Network & Connectivity',
    description: 'Gangguan koneksi Wi-Fi, jaringan LAN, internet, atau akses VPN',
  },
  {
    code: 'ACC',
    name: 'Account & Access',
    description: 'Permintaan reset password, akun email, akses folder, atau hak akses sistem',
  },
  {
    code: 'PRN',
    name: 'Printer & Peripheral',
    description: 'Kendala printer kantor, scanner, mouse, keyboard, docking station',
  },
  {
    code: 'OTH',
    name: 'Other / General IT Inquiry',
    description: 'Konsultasi, permintaan perlengkapan baru, atau pertanyaan umum IT',
  },
] as const;

export const DEFAULT_SLA_POLICIES = [
  { priority: 'Critical', targetResponseHours: 1, targetResolutionHours: 2 },
  { priority: 'High', targetResponseHours: 2, targetResolutionHours: 8 },
  { priority: 'Medium', targetResponseHours: 4, targetResolutionHours: 24 },
  { priority: 'Low', targetResponseHours: 8, targetResolutionHours: 48 },
] as const;

const ticketCategoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Category code is required')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Category code may only contain uppercase letters, numbers, hyphens and underscores'),
  description: z.string().trim().max(255).optional(),
});

export function normalizeTicketCategoryInput(input: {
  name: string;
  code: string;
  description?: string;
}) {
  return {
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    description: input.description?.trim() || undefined,
  };
}

export function parseTicketCategoryInput(input: {
  name: string;
  code: string;
  description?: string;
}) {
  return ticketCategoryInputSchema.parse(input);
}

export function shouldSeedDefaultTicketCategories(existingCount: number): boolean {
  return existingCount === 0;
}

export function shouldSeedDefaultSlaPolicies(existingCount: number): boolean {
  return existingCount === 0;
}
