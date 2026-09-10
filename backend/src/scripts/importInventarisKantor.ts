import ExcelJS from 'exceljs';
import path from 'path';
import { db, assetsSchema, masterSchema, assetCustodiansSchema } from '../db';
import { allocateSequentialCodes } from '../domain/assetCode';
import { normalizeCustodianName } from '../domain/assetCustodian';

const MONTH_MAP: Record<string, number> = {
  januari: 0, janurari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, ags: 7, agt: 7,
  september: 8, sep: 8,
  oktober: 9, okt: 9,
  november: 10, nov: 10,
  desember: 11, des: 11,
};

function parseIndonesianDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const str = String(val).trim();
  if (!str || str === '-' || str === 'null') return null;

  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime()) && str.includes('-')) {
    return isoDate;
  }

  const parts = str.split(/[\s-]+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const month = MONTH_MAP[monthStr];
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(Date.UTC(year, month, day, 0, 0, 0));
    }
  }
  return null;
}

export async function runImport(isDryRun = true) {
  console.log(`\n========================================`);
  console.log(`Starting Import (dryRun = ${isDryRun})...`);
  console.log(`========================================\n`);

  const filePath = path.resolve(__dirname, '../../../inventaris kantor.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const allLocations = await db.select().from(masterSchema.locations);
  const locationMap = new Map(allLocations.map(l => [l.code, l]));
  const defaultLocation = locationMap.get('CMC') || allLocations[0];
  const mgmLocation = locationMap.get('MGM') || defaultLocation;

  const allCategories = await db.select().from(assetsSchema.assetCategories);
  const laptopCat = allCategories.find(c => c.codePrefix === 'LPT' || c.name.toLowerCase() === 'laptop');
  const printerCat = allCategories.find(c => c.codePrefix === 'PRN' || c.name.toLowerCase() === 'printer');

  if (!laptopCat || !printerCat) {
    throw new Error('Required asset categories (Laptop or Printer) not found in database!');
  }

  // Load existing custodians
  const existingCustodians = await db.select().from(assetCustodiansSchema.assetCustodians);
  const custodianMap = new Map<string, typeof existingCustodians[0]>();
  for (const c of existingCustodians) {
    custodianMap.set(c.normalizedName, c);
  }

  // Load existing asset codes to avoid duplicate code collision
  const existingAssetRows = await db.select({ assetCode: assetsSchema.assets.assetCode }).from(assetsSchema.assets);
  const existingCodes = existingAssetRows.map(r => r.assetCode);

  const year = new Date().getFullYear();

  // We will run this inside a transaction (or rollback if dryRun)
  await db.transaction(async (tx) => {
    // 1. Process INV LAPTOP
    const wsLaptop = wb.getWorksheet('INV LAPTOP');
    if (!wsLaptop) throw new Error('Sheet INV LAPTOP not found');

    const laptopCount = wsLaptop.rowCount - 1; // 34 data rows
    const laptopCodes = allocateSequentialCodes('LPT', year, existingCodes, laptopCount);
    console.log(`Allocated ${laptopCodes.length} laptop codes: ${laptopCodes[0]} ... ${laptopCodes[laptopCodes.length - 1]}`);

    const importedAssets: any[] = [];
    const assignmentHistories: any[] = [];

    for (let r = 2; r <= wsLaptop.rowCount; r++) {
      const row = wsLaptop.getRow(r);
      const custodianNameRaw = row.getCell(1).value ? String(row.getCell(1).value).trim() : '';
      const handoverDateRaw = row.getCell(2).value;
      const modelRaw = row.getCell(3).value ? String(row.getCell(3).value).trim() : 'Laptop';
      const serialRaw = row.getCell(4).value ? String(row.getCell(4).value).trim() : null;
      const condColRaw = row.getCell(5).value ? String(row.getCell(5).value).trim() : '';
      const statusColRaw = row.getCell(7).value ? String(row.getCell(7).value).trim() : '';
      const notesRaw = row.getCell(8).value ? String(row.getCell(8).value).trim() : '';

      const serialNumber = serialRaw && serialRaw !== '-' && serialRaw.toLowerCase() !== 'null' ? serialRaw : null;
      const handoverDate = parseIndonesianDate(handoverDateRaw);

      // Condition mapping
      let condition: 'Good' | 'Fair' | 'Poor' | 'Damaged' = 'Good';
      const condColUpper = condColRaw.toUpperCase();
      const notesUpper = notesRaw.toUpperCase();

      if (condColUpper.includes('RUSAK') || notesUpper.includes('PATAH')) {
        condition = 'Damaged';
      } else if (condColUpper.includes('BEKAS')) {
        condition = 'Fair';
      } else {
        condition = 'Good';
      }

      // Location mapping: check notes
      let targetLocation = defaultLocation;
      if (notesUpper.includes('MGM')) {
        targetLocation = mgmLocation;
      }

      // Custodian resolution
      let currentCustodianId: number | null = null;
      let custodianNameSnapshot: string | null = null;

      if (custodianNameRaw) {
        const norm = normalizeCustodianName(custodianNameRaw);
        let cust = custodianMap.get(norm);
        if (!cust) {
          // Insert new manual custodian
          const [newCust] = await tx.insert(assetCustodiansSchema.assetCustodians).values({
            displayName: custodianNameRaw,
            normalizedName: norm,
            origin: 'MANUAL',
            verificationStatus: 'UNVERIFIED',
            recordStatus: 'ACTIVE',
            locationId: targetLocation.id,
            createdByUserId: 1,
          }).returning();
          cust = newCust;
          custodianMap.set(norm, cust);
          console.log(`[NEW CUSTODIAN] Created: "${cust.displayName}" (id: ${cust.id})`);
        }
        currentCustodianId = cust.id;
        custodianNameSnapshot = cust.displayName;
      }

      // Status mapping
      let status: 'Available' | 'Assigned' | 'Maintenance' | 'Disposed' | 'Lost' = 'Available';
      if (condition === 'Damaged') {
        status = 'Maintenance';
      } else if (currentCustodianId) {
        status = 'Assigned';
      } else {
        status = 'Available';
      }

      const assetCode = laptopCodes[r - 2];
      const assetNotesParts: string[] = [];
      if (statusColRaw && statusColRaw !== '-') assetNotesParts.push(`Status: ${statusColRaw}`);
      if (notesRaw) assetNotesParts.push(notesRaw);
      const fullNotes = assetNotesParts.length > 0 ? assetNotesParts.join(' | ') : null;

      const [insertedAsset] = await tx.insert(assetsSchema.assets).values({
        assetCode,
        name: modelRaw,
        categoryId: laptopCat.id,
        locationId: targetLocation.id,
        currentCustodianId,
        serialNumber,
        status,
        condition,
        notes: fullNotes,
      }).returning();

      importedAssets.push(insertedAsset);
      console.log(`[LAPTOP ${insertedAsset.assetCode}] ${insertedAsset.name} | SN: ${insertedAsset.serialNumber || 'N/A'} | Status: ${insertedAsset.status} | Cond: ${insertedAsset.condition} | Custodian: ${custodianNameSnapshot || 'None'} | Loc: ${targetLocation.code}`);

      // Assignment history
      if (currentCustodianId) {
        const [history] = await tx.insert(assetsSchema.assetAssignmentHistory).values({
          assetId: insertedAsset.id,
          custodianId: currentCustodianId,
          custodianNameSnapshot,
          locationNameSnapshot: targetLocation.name,
          assignedByUserId: 1,
          assignedAt: handoverDate || new Date(),
          conditionOnAssign: condition,
          handoverNotes: fullNotes || 'Serah terima inventaris laptop',
        }).returning();
        assignmentHistories.push(history);
      }
    }

    // 2. Process INV CATEGORY (Printers)
    const wsPrinter = wb.getWorksheet('INV CATEGORY');
    if (!wsPrinter) throw new Error('Sheet INV CATEGORY not found');

    const printerCount = wsPrinter.rowCount - 1; // 4 data rows
    const printerCodes = allocateSequentialCodes('PRN', year, existingCodes, printerCount);
    console.log(`\nAllocated ${printerCodes.length} printer codes: ${printerCodes[0]} ... ${printerCodes[printerCodes.length - 1]}`);

    for (let r = 2; r <= wsPrinter.rowCount; r++) {
      const row = wsPrinter.getRow(r);
      const nameRaw = row.getCell(2).value ? String(row.getCell(2).value).trim() : 'Printer';
      const serialRaw = row.getCell(3).value ? String(row.getCell(3).value).trim() : null;
      const userRaw = row.getCell(4).value ? String(row.getCell(4).value).trim() : '';
      const handoverDateRaw = row.getCell(5).value;
      const condRaw = row.getCell(6).value ? String(row.getCell(6).value).trim() : '';

      const serialNumber = serialRaw && serialRaw !== '-' && serialRaw.toLowerCase() !== 'null' ? serialRaw : null;
      const handoverDate = parseIndonesianDate(handoverDateRaw);

      let condition: 'Good' | 'Fair' | 'Poor' | 'Damaged' = 'Good';
      if (condRaw.toUpperCase().includes('BEKAS')) {
        condition = 'Fair';
      }

      let currentCustodianId: number | null = null;
      let custodianNameSnapshot: string | null = null;

      if (userRaw) {
        const norm = normalizeCustodianName(userRaw);
        let cust = custodianMap.get(norm);
        if (!cust) {
          const [newCust] = await tx.insert(assetCustodiansSchema.assetCustodians).values({
            displayName: userRaw,
            normalizedName: norm,
            origin: 'MANUAL',
            verificationStatus: 'UNVERIFIED',
            recordStatus: 'ACTIVE',
            locationId: defaultLocation.id,
            createdByUserId: 1,
          }).returning();
          cust = newCust;
          custodianMap.set(norm, cust);
          console.log(`[NEW CUSTODIAN] Created: "${cust.displayName}" (id: ${cust.id})`);
        }
        currentCustodianId = cust.id;
        custodianNameSnapshot = cust.displayName;
      }

      const assetCode = printerCodes[r - 2];
      const [insertedAsset] = await tx.insert(assetsSchema.assets).values({
        assetCode,
        name: nameRaw,
        categoryId: printerCat.id,
        locationId: defaultLocation.id,
        currentCustodianId,
        serialNumber,
        status: currentCustodianId ? 'Assigned' : 'Available',
        condition,
        notes: null,
      }).returning();

      importedAssets.push(insertedAsset);
      console.log(`[PRINTER ${insertedAsset.assetCode}] ${insertedAsset.name} | SN: ${insertedAsset.serialNumber || 'N/A'} | Status: ${insertedAsset.status} | Custodian: ${custodianNameSnapshot || 'None'} | Loc: ${defaultLocation.code}`);

      if (currentCustodianId) {
        const [history] = await tx.insert(assetsSchema.assetAssignmentHistory).values({
          assetId: insertedAsset.id,
          custodianId: currentCustodianId,
          custodianNameSnapshot,
          locationNameSnapshot: defaultLocation.name,
          assignedByUserId: 1,
          assignedAt: handoverDate || new Date(),
          conditionOnAssign: condition,
          handoverNotes: 'Serah terima inventaris printer',
        }).returning();
        assignmentHistories.push(history);
      }
    }

    console.log(`\nTotal assets processed: ${importedAssets.length}`);
    console.log(`Total assignment history records: ${assignmentHistories.length}`);

    if (isDryRun) {
      console.log('\nDRY RUN complete! Rolling back transaction.');
      throw new Error('ROLLBACK_DRY_RUN');
    } else {
      console.log('\nCOMMIT complete! All records inserted successfully.');
    }
  }).catch((err) => {
    if (err.message === 'ROLLBACK_DRY_RUN') {
      return;
    }
    throw err;
  });
}

if (require.main === module || process.argv[1].endsWith('importInventarisKantor.ts')) {
  const isDryRun = process.argv.includes('--commit') ? false : true;
  runImport(isDryRun).then(() => {
    console.log('Script finished.');
    process.exit(0);
  }).catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
}
