import { z } from 'zod';

export const hardwareAuditPeripheralSchema = z.object({
  category: z.string().trim().min(1, 'Category is required').max(100),
  presetCategory: z.string().trim().max(50).nullable().optional(),
  customCategory: z.string().trim().max(100).transform((v: string | null | undefined) => v || null).nullable().optional(),
  brandModel: z.string().trim().min(1, 'Brand & Model is required').max(200),
  serialNumber: z.string().trim().max(100).transform((v: string | null | undefined) => (!v || v === '-' || v.toUpperCase() === 'UNKNOWN' ? null : v)).nullable().optional(),
});

export type HardwareAuditPeripheral = z.infer<typeof hardwareAuditPeripheralSchema>;

export const hardwareAuditPayloadSchema = z.object({
  custodianName: z.string().trim().min(1, 'Custodian name is required').max(150),
  serialNumber: z.string().trim().max(100).transform(v => v || null).nullable().optional(),
  manufacturer: z.string().trim().max(100).transform(v => v || null).nullable().optional(),
  model: z.string().trim().max(150).transform(v => v || null).nullable().optional(),
  cpuName: z.string().trim().max(200).transform(v => v || null).nullable().optional(),
  ramSizeGb: z.number().int().positive().nullable().optional(),
  ramSlotCount: z.number().int().positive().nullable().optional(),
  disk1SizeGb: z.number().int().positive().nullable().optional(),
  disk2SizeGb: z.number().int().positive().nullable().optional(),
  rawSpecs: z.any().nullable().optional(),
  notes: z.string().trim().transform(v => v || null).nullable().optional(),
  hasPeripheral: z.boolean().default(false).optional(),
  peripherals: z.array(hardwareAuditPeripheralSchema).default([]).optional(),
  osName: z.string().trim().max(100).transform(v => v || null).nullable().optional(),
  hostname: z.string().trim().max(100).transform(v => v || null).nullable().optional(),
  macAddresses: z.string().trim().max(255).transform(v => v || null).nullable().optional(),
  scannedAt: z.string().nullable().optional(),
});

export type HardwareAuditPayload = z.infer<typeof hardwareAuditPayloadSchema>;

export const batchHardwareAuditSchema = z.object({
  audits: z.array(hardwareAuditPayloadSchema).min(1, 'At least one audit record is required'),
});

export type BatchHardwareAuditPayload = z.infer<typeof batchHardwareAuditSchema>;

export const linkAssetAuditSchema = z.object({
  assetId: z.number().int().positive('Valid assetId is required'),
  updateSerialNumber: z.boolean().default(true),
  updateSpecs: z.boolean().default(true),
});

export type LinkAssetAuditInput = z.infer<typeof linkAssetAuditSchema>;

export const createAssetFromAuditSchema = z.object({
  name: z.string().trim().max(200).nullable().optional(),
  categoryId: z.number().int().positive('Category ID is required'),
  locationId: z.number().int().positive().nullable().optional(),
  custodianName: z.string().trim().max(150).nullable().optional(),
  custodianId: z.number().int().positive().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  status: z.enum(['Available', 'Assigned']).default('Assigned'),
});

export type CreateAssetFromAuditInput = z.infer<typeof createAssetFromAuditSchema>;
