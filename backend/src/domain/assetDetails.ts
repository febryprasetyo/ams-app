import { z } from 'zod';

export const computerSpecsSchema = z.object({
  cpuName: z.string().trim().max(200).transform(value => value || null).nullable().optional(),
  ramSizeGb: z.number().int().positive('RAM size must be greater than 0').nullable().optional(),
  ramSlotCount: z.number().int().positive('RAM slot count must be greater than 0').nullable().optional(),
  disk1SizeGb: z.number().int().positive('Disk 1 size must be greater than 0').nullable().optional(),
  disk2SizeGb: z.number().int().positive('Disk 2 size must be greater than 0').nullable().optional(),
});

export type ComputerSpecsInput = z.infer<typeof computerSpecsSchema>;

export const ACCESSORY_CONDITIONS = ['Good', 'Fair', 'Poor', 'Damaged'] as const;
export type AccessoryCondition = (typeof ACCESSORY_CONDITIONS)[number];

export const accessorySchema = z.object({
  id: z.number().optional(),
  accessoryType: z.string().trim().min(1, 'Accessory type is required').max(50),
  description: z.string().trim().max(150).nullable().optional(),
  quantity: z.number().int().positive('Quantity must be greater than 0').default(1),
  condition: z.enum(ACCESSORY_CONDITIONS).default('Good'),
  notes: z.string().trim().nullable().optional(),
});

export type AccessoryInput = z.infer<typeof accessorySchema>;

export const assetDetailsSchema = z.object({
  computerSpecs: computerSpecsSchema.nullable().optional(),
  accessories: z.array(accessorySchema).default([]),
});

export type AssetDetailsInput = z.infer<typeof assetDetailsSchema>;

export function isComputerEquipmentType(name?: string | null): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return (
    normalized === 'laptop' ||
    normalized === 'pc' ||
    normalized === 'desktop' ||
    normalized === 'desktop pc' ||
    normalized === 'pc desktop' ||
    normalized === 'notebook' ||
    normalized === 'workstation' ||
    normalized === 'personal computer' ||
    normalized === 'computer' ||
    normalized.includes('laptop') ||
    normalized.includes('desktop') ||
    normalized.includes('notebook') ||
    /\b(pc|computer|workstation)\b/i.test(normalized)
  );
}
