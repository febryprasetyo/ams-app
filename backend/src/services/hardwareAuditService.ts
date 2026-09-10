import { eq, sql, ilike, and, or, desc, isNull, inArray } from 'drizzle-orm';
import { db } from '../db';
import { assets, assetCategories, assetComputerSpecs, assetAssignmentHistory } from '../db/schema/assets';
import { assetCustodians } from '../db/schema/assetCustodians';
import { hardwareAuditLogs, type HardwareAuditLog } from '../db/schema/hardwareAudits';
import { isComputerEquipmentType } from '../domain/assetDetails';
import { allocateSequentialCodes } from '../domain/assetCode';
import type {
  HardwareAuditPayload,
  BatchHardwareAuditPayload,
  LinkAssetAuditInput,
  CreateAssetFromAuditInput,
} from '../domain/hardwareAudit';

export interface AuditCandidateAsset {
  id: number;
  assetCode: string;
  name: string;
  serialNumber: string | null;
  categoryName: string;
  hasComputerSpecs: boolean;
  custodianName: string | null;
}

export interface IngestResult {
  auditId: number;
  status: 'SYNCED_AUTO' | 'PENDING';
  message: string;
  matchedAsset?: {
    id: number;
    assetCode: string;
    name: string;
  };
  candidateAssets?: AuditCandidateAsset[];
}

export async function processHardwareAuditIngest(
  payload: HardwareAuditPayload,
  runner: any = db,
): Promise<IngestResult> {
  const normSerial = payload.serialNumber && payload.serialNumber.trim() && payload.serialNumber.trim().toUpperCase() !== 'UNKNOWN'
    ? payload.serialNumber.trim()
    : null;
  const rawSpecsStr = payload.rawSpecs
    ? (typeof payload.rawSpecs === 'string' ? payload.rawSpecs : JSON.stringify(payload.rawSpecs))
    : null;

  const scannedAt = payload.scannedAt ? new Date(payload.scannedAt) : new Date();

  // 1. Coba cocokkan berdasarkan Serial Number
  if (normSerial) {
    const [matchedAsset] = await runner
      .select({
        id: assets.id,
        assetCode: assets.assetCode,
        name: assets.name,
        categoryId: assets.categoryId,
      })
      .from(assets)
      .where(sql`lower(trim(${assets.serialNumber})) = lower(${normSerial})`)
      .limit(1);

    if (matchedAsset) {
      // Perbarui spesifikasi komputer aset yang cocok
      await upsertAssetComputerSpecs(matchedAsset.id, payload, runner);

      // Catat audit log dengan status SYNCED_AUTO
      const [insertedAudit] = await runner
        .insert(hardwareAuditLogs)
        .values({
          custodianName: payload.custodianName,
          serialNumber: normSerial,
          manufacturer: payload.manufacturer || null,
          model: payload.model || null,
          cpuName: payload.cpuName || null,
          ramSizeGb: payload.ramSizeGb || null,
          ramSlotCount: payload.ramSlotCount || null,
          disk1SizeGb: payload.disk1SizeGb || null,
          disk2SizeGb: payload.disk2SizeGb || null,
          rawSpecs: rawSpecsStr,
          notes: payload.notes || null,
          status: 'SYNCED_AUTO',
          matchedAssetId: matchedAsset.id,
          scannedAt,
        })
        .returning();

      return {
        auditId: insertedAudit.id,
        status: 'SYNCED_AUTO',
        message: `Berhasil dicocokkan otomatis dengan aset ${matchedAsset.assetCode} berdasarkan Serial Number`,
        matchedAsset: {
          id: matchedAsset.id,
          assetCode: matchedAsset.assetCode,
          name: matchedAsset.name,
        },
      };
    }
  }

  // 2. Jika serial number belum ada, cari kandidat aset berdasarkan Custodian Name
  const candidates = await findCandidateAssetsForCustodian(payload.custodianName, runner);

  // Simpan audit log sebagai PENDING untuk direview/ditautkan oleh IT Admin
  const [insertedAudit] = await runner
    .insert(hardwareAuditLogs)
    .values({
      custodianName: payload.custodianName,
      serialNumber: normSerial,
      manufacturer: payload.manufacturer || null,
      model: payload.model || null,
      cpuName: payload.cpuName || null,
      ramSizeGb: payload.ramSizeGb || null,
      ramSlotCount: payload.ramSlotCount || null,
      disk1SizeGb: payload.disk1SizeGb || null,
      disk2SizeGb: payload.disk2SizeGb || null,
      rawSpecs: rawSpecsStr,
      notes: payload.notes || null,
      status: 'PENDING',
      matchedAssetId: null,
      scannedAt,
    })
    .returning();

  return {
    auditId: insertedAudit.id,
    status: 'PENDING',
    message: candidates.length > 0
      ? `Audit tersimpan (Pending Review). Ditemukan ${candidates.length} kandidat aset milik ${payload.custodianName}`
      : `Audit tersimpan (Pending Review). Tidak ditemukan aset terdaftar untuk ${payload.custodianName}`,
    candidateAssets: candidates,
  };
}

export async function processBatchHardwareAudit(
  payload: BatchHardwareAuditPayload,
  runner: any = db,
): Promise<{
  total: number;
  syncedAuto: number;
  pendingReview: number;
  results: IngestResult[];
}> {
  const results: IngestResult[] = [];
  let syncedAuto = 0;
  let pendingReview = 0;

  for (const item of payload.audits) {
    const res = await processHardwareAuditIngest(item, runner);
    results.push(res);
    if (res.status === 'SYNCED_AUTO') {
      syncedAuto++;
    } else {
      pendingReview++;
    }
  }

  return {
    total: payload.audits.length,
    syncedAuto,
    pendingReview,
    results,
  };
}

export async function getHardwareAudits(
  statusFilter?: string,
  runner: any = db,
): Promise<Array<HardwareAuditLog & { candidateAssets?: AuditCandidateAsset[]; matchedAsset?: any }>> {
  let query = runner.select().from(hardwareAuditLogs);

  if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
    query = query.where(eq(hardwareAuditLogs.status, statusFilter.toUpperCase()));
  }

  const rows: HardwareAuditLog[] = await query.orderBy(desc(hardwareAuditLogs.scannedAt), desc(hardwareAuditLogs.id));

  // Ambil data pendukung untuk tiap baris
  const enriched = await Promise.all(
    rows.map(async (audit) => {
      let matchedAsset = null;
      if (audit.matchedAssetId) {
        const [found] = await runner
          .select({
            id: assets.id,
            assetCode: assets.assetCode,
            name: assets.name,
            serialNumber: assets.serialNumber,
          })
          .from(assets)
          .where(eq(assets.id, audit.matchedAssetId));
        matchedAsset = found || null;
      }

      let candidateAssets: AuditCandidateAsset[] = [];
      if (audit.status === 'PENDING') {
        candidateAssets = await findCandidateAssetsForCustodian(audit.custodianName, runner);
      }

      return {
        ...audit,
        matchedAsset,
        candidateAssets,
      };
    }),
  );

  return enriched;
}

export async function linkAuditToAsset(
  auditId: number,
  input: LinkAssetAuditInput,
  runner: any = db,
): Promise<{ success: boolean; message: string; assetId: number }> {
  const [audit] = await runner
    .select()
    .from(hardwareAuditLogs)
    .where(eq(hardwareAuditLogs.id, auditId));

  if (!audit) {
    throw new Error('Audit record not found');
  }

  const [targetAsset] = await runner
    .select({
      id: assets.id,
      assetCode: assets.assetCode,
      name: assets.name,
      serialNumber: assets.serialNumber,
      categoryId: assets.categoryId,
    })
    .from(assets)
    .where(eq(assets.id, input.assetId));

  if (!targetAsset) {
    throw new Error('Target asset not found');
  }

  // 1. Perbarui serial number aset jika diminta
  if (input.updateSerialNumber && audit.serialNumber) {
    const normSerial = audit.serialNumber.trim();
    if (normSerial.toUpperCase() !== 'UNKNOWN') {
      // Pastikan serial tidak bentrok dengan aset lain
      const [existingSerial] = await runner
        .select({ id: assets.id, assetCode: assets.assetCode })
        .from(assets)
        .where(
          and(
            sql`lower(trim(${assets.serialNumber})) = lower(${normSerial})`,
            sql`${assets.id} <> ${targetAsset.id}`,
          ),
        )
        .limit(1);

      if (existingSerial) {
        throw new Error(`Serial number "${normSerial}" sudah digunakan oleh aset "${existingSerial.assetCode}"`);
      }

      await runner
        .update(assets)
        .set({
          serialNumber: normSerial,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, targetAsset.id));
    }
  }

  // 2. Perbarui Computer Specifications jika diminta
  if (input.updateSpecs) {
    await upsertAssetComputerSpecs(targetAsset.id, audit, runner);
  }

  // 3. Update status audit log
  await runner
    .update(hardwareAuditLogs)
    .set({
      status: 'SYNCED_MANUAL',
      matchedAssetId: targetAsset.id,
      updatedAt: new Date(),
    })
    .where(eq(hardwareAuditLogs.id, audit.id));

  return {
    success: true,
    message: `Spesifikasi hardware berhasil ditautkan ke aset ${targetAsset.assetCode}`,
    assetId: targetAsset.id,
  };
}

export async function createAssetFromAudit(
  auditId: number,
  input: CreateAssetFromAuditInput,
  actorUserId?: number,
  runner: any = db,
): Promise<{ success: boolean; message: string; assetId: number; assetCode: string }> {
  const [audit] = await runner
    .select()
    .from(hardwareAuditLogs)
    .where(eq(hardwareAuditLogs.id, auditId));

  if (!audit) {
    throw new Error('Audit record not found');
  }

  const [category] = await runner
    .select()
    .from(assetCategories)
    .where(eq(assetCategories.id, input.categoryId));

  if (!category) {
    throw new Error('Category not found');
  }

  // Generate asset code
  const year = new Date().getFullYear();
  const pattern = `${category.codePrefix}-${year}-%`;
  const existingAssets = await runner
    .select({ assetCode: assets.assetCode })
    .from(assets)
    .where(ilike(assets.assetCode, pattern));

  const existingCodes = existingAssets.map((item: any) => item.assetCode as string);
  const [allocatedCode] = allocateSequentialCodes(category.codePrefix, year, existingCodes, 1);

  // Resolve custodian:
  let matchedCustodian: { id: number; displayName: string } | null = null;
  const rawTargetName = (input.custodianName || audit.custodianName || '').trim();

  if (input.custodianId) {
    const [c] = await runner
      .select({ id: assetCustodians.id, displayName: assetCustodians.displayName })
      .from(assetCustodians)
      .where(eq(assetCustodians.id, input.custodianId));
    if (c) matchedCustodian = c;
  } else if (rawTargetName) {
    const normName = rawTargetName.replace(/\s+/gu, ' ').toLowerCase();
    const [existingCust] = await runner
      .select({ id: assetCustodians.id, displayName: assetCustodians.displayName })
      .from(assetCustodians)
      .where(
        and(
          sql`lower(trim(${assetCustodians.displayName})) = ${normName} OR lower(trim(${assetCustodians.normalizedName})) = ${normName}`,
          eq(assetCustodians.recordStatus, 'ACTIVE'),
        ),
      )
      .limit(1);

    if (existingCust) {
      matchedCustodian = existingCust;
    } else if (input.status === 'Assigned') {
      // Auto create new manual custodian if not found in directory
      const cleanDisplayName = rawTargetName.replace(/\s+/gu, ' ');
      const [newCust] = await runner
        .insert(assetCustodians)
        .values({
          displayName: cleanDisplayName,
          normalizedName: normName,
          origin: 'MANUAL',
          verificationStatus: 'UNVERIFIED',
          locationId: input.locationId || null,
          recordStatus: 'ACTIVE',
          createdByUserId: actorUserId || null,
        })
        .returning({ id: assetCustodians.id, displayName: assetCustodians.displayName });
      matchedCustodian = newCust;
    }
  }

  const brandName = (input.name && input.name.trim()) || [audit.manufacturer, audit.model].filter(Boolean).join(' ').trim() || category.name;
  const effectiveStatus = matchedCustodian ? 'Assigned' : input.status;

  const [newAsset] = await runner
    .insert(assets)
    .values({
      assetCode: allocatedCode,
      name: brandName,
      categoryId: category.id,
      locationId: input.locationId || null,
      currentCustodianId: matchedCustodian?.id || null,
      serialNumber: audit.serialNumber && audit.serialNumber.toUpperCase() !== 'UNKNOWN' ? audit.serialNumber : null,
      status: effectiveStatus,
      condition: 'Good',
      notes: input.notes || audit.notes || `Created via Hardware Audit for ${audit.custodianName}`,
    })
    .returning();

  // Simpan specs
  if (isComputerEquipmentType(category.name)) {
    await upsertAssetComputerSpecs(newAsset.id, audit, runner);
  }

  // Simpan initial assignment history jika ada custodian
  if (matchedCustodian) {
    await runner.insert(assetAssignmentHistory).values({
      assetId: newAsset.id,
      custodianId: matchedCustodian.id,
      custodianNameSnapshot: matchedCustodian.displayName,
      assignedByUserId: actorUserId || null,
      conditionOnAssign: 'Good',
      handoverNotes: `Initial assignment from Hardware Audit (${matchedCustodian.displayName})`,
    });
  }

  // Update audit log
  await runner
    .update(hardwareAuditLogs)
    .set({
      status: 'SYNCED_MANUAL',
      matchedAssetId: newAsset.id,
      updatedAt: new Date(),
    })
    .where(eq(hardwareAuditLogs.id, audit.id));

  return {
    success: true,
    message: `Aset baru ${newAsset.assetCode} berhasil dibuat dan ditugaskan ke ${matchedCustodian?.displayName || 'Stock'}`,
    assetId: newAsset.id,
    assetCode: newAsset.assetCode,
  };
}

export async function deleteHardwareAudit(auditId: number, runner: any = db): Promise<void> {
  await runner.delete(hardwareAuditLogs).where(eq(hardwareAuditLogs.id, auditId));
}

export async function clearSyncedHardwareAudits(runner: any = db): Promise<number> {
  const result = await runner
    .delete(hardwareAuditLogs)
    .where(or(eq(hardwareAuditLogs.status, 'SYNCED_AUTO'), eq(hardwareAuditLogs.status, 'SYNCED_MANUAL')))
    .returning({ id: hardwareAuditLogs.id });
  return result.length;
}

// --- Helper Functions ---

async function upsertAssetComputerSpecs(
  assetId: number,
  specs: {
    cpuName?: string | null;
    ramSizeGb?: number | null;
    ramSlotCount?: number | null;
    disk1SizeGb?: number | null;
    disk2SizeGb?: number | null;
  },
  runner: any,
): Promise<void> {
  const [existingSpecs] = await runner
    .select({ id: assetComputerSpecs.id })
    .from(assetComputerSpecs)
    .where(eq(assetComputerSpecs.assetId, assetId));

  const specValues = {
    cpuName: specs.cpuName || null,
    ramSizeGb: specs.ramSizeGb || null,
    ramSlotCount: specs.ramSlotCount || null,
    disk1SizeGb: specs.disk1SizeGb || null,
    disk2SizeGb: specs.disk2SizeGb || null,
    updatedAt: new Date(),
  };

  if (existingSpecs) {
    await runner
      .update(assetComputerSpecs)
      .set(specValues)
      .where(eq(assetComputerSpecs.assetId, assetId));
  } else {
    await runner
      .insert(assetComputerSpecs)
      .values({
        assetId,
        ...specValues,
      });
  }
}

async function findCandidateAssetsForCustodian(
  custodianName: string,
  runner: any,
): Promise<AuditCandidateAsset[]> {
  const trimmed = custodianName.trim().toLowerCase();
  if (!trimmed) return [];

  // Cari custodian ID yang nama mirip atau persis
  const custodians = await runner
    .select({ id: assetCustodians.id, displayName: assetCustodians.displayName })
    .from(assetCustodians)
    .where(
      and(
        sql`lower(trim(${assetCustodians.displayName})) LIKE ${`%${trimmed}%`}`,
        eq(assetCustodians.recordStatus, 'ACTIVE'),
      ),
    )
    .limit(10);

  if (custodians.length === 0) return [];

  const custodianIds = custodians.map((c: any) => c.id);

  // Ambil aset-aset yang dipegang oleh custodian tersebut
  const assetRows = await runner
    .select({
      id: assets.id,
      assetCode: assets.assetCode,
      name: assets.name,
      serialNumber: assets.serialNumber,
      categoryId: assets.categoryId,
      categoryName: assetCategories.name,
      currentCustodianId: assets.currentCustodianId,
    })
    .from(assets)
    .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .where(inArray(assets.currentCustodianId, custodianIds));

  if (assetRows.length === 0) return [];

  // Cek apakah aset sudah memiliki computer specs
  const candidateIds = assetRows.map((a: any) => a.id);
  const specsRows = await runner
    .select({ assetId: assetComputerSpecs.assetId })
    .from(assetComputerSpecs)
    .where(inArray(assetComputerSpecs.assetId, candidateIds));

  const specsAssetIdSet = new Set(specsRows.map((s: any) => s.assetId));
  const custodianMap = new Map(custodians.map((c: any) => [c.id, c.displayName]));

  return assetRows.map((a: any) => ({
    id: a.id,
    assetCode: a.assetCode,
    name: a.name,
    serialNumber: a.serialNumber,
    categoryName: a.categoryName,
    hasComputerSpecs: specsAssetIdSet.has(a.id),
    custodianName: custodianMap.get(a.currentCustodianId) || null,
  }));
}
