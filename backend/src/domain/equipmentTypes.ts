import { z } from 'zod';

export const DEFAULT_IT_EQUIPMENT_TYPES = [
  { name: 'Desktop PC', codePrefix: 'PC' },
  { name: 'Laptop', codePrefix: 'LPT' },
  { name: 'Monitor', codePrefix: 'MON' },
  { name: 'Mouse', codePrefix: 'MSE' },
  { name: 'Keyboard', codePrefix: 'KBD' },
  { name: 'USB Hub', codePrefix: 'HUB' },
  { name: 'USB Flash Drive', codePrefix: 'UFD' },
  { name: 'External HDD / SSD', codePrefix: 'EXT' },
  { name: 'USB Wi-Fi Adapter', codePrefix: 'UWF' },
  { name: 'Sound Card', codePrefix: 'SND' },
  { name: 'Speaker', codePrefix: 'SPK' },
  { name: 'Headset', codePrefix: 'HST' },
  { name: 'Webcam', codePrefix: 'CAM' },
  { name: 'Docking Station', codePrefix: 'DCK' },
  { name: 'Printer', codePrefix: 'PRN' },
  { name: 'Scanner', codePrefix: 'SCN' },
  { name: 'Projector', codePrefix: 'PRJ' },
  { name: 'UPS', codePrefix: 'UPS' },
  { name: 'Server Physical', codePrefix: 'SVR' },
  { name: 'Network Device', codePrefix: 'NET' },
  { name: 'NAS / Storage', codePrefix: 'NAS' },
  { name: 'Tablet', codePrefix: 'TBL' },
  { name: 'Smartphone', codePrefix: 'PHN' },
  { name: 'Cable & Adapter', codePrefix: 'CBL' },
  { name: 'Other IT Equipment', codePrefix: 'OTH' },
] as const;

export function normalizeEquipmentTypeInput(input: { name: string; codePrefix: string }) {
  return {
    name: input.name.trim(),
    codePrefix: input.codePrefix.trim().toUpperCase(),
  };
}

const equipmentTypeInputSchema = z.object({
  name: z.string().trim().min(1, 'Equipment type name is required').max(100),
  codePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Code prefix is required')
    .max(20)
    .regex(/^[A-Z0-9]+$/, 'Code prefix may only contain letters and numbers'),
});

export function parseEquipmentTypeInput(input: { name: string; codePrefix: string }) {
  return equipmentTypeInputSchema.parse(input);
}

export function equipmentTypeDeleteConflict(assetCount: number): string | null {
  if (assetCount === 0) return null;

  return `This equipment type is used by ${assetCount} inventory items. Reassign them before deleting it.`;
}

export function shouldSeedDefaultEquipmentTypes(existingCount: number): boolean {
  return existingCount === 0;
}
