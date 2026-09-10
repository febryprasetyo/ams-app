import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { buildAssetImportTemplate, parseAssetImportWorkbook } from './assetWorkbook';

test('template exposes the four exact sheets and headers', async () => {
  const buffer = await buildAssetImportTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Petunjuk', 'Laptop-PC', 'Other Assets', 'Accessories']);
  assert.deepEqual(
    workbook.getWorksheet('Laptop-PC')!.getRow(1).values.slice(1),
    [
      'Computer Reference', 'Device Type', 'Asset Code', 'Asset Name', 'Serial Number',
      'Location Code', 'Employee Code', 'Employee Name', 'Assigned Date', 'Condition',
      'CPU Name', 'RAM Size (GB)', 'RAM Slot Count', 'Disk 1 Size (GB)',
      'Disk 2 Size (GB)', 'Complaint / Notes',
    ],
  );
  assert.equal(workbook.getWorksheet('Accessories')!.getCell('F1').value, 'Notes');
  const guideText = workbook.getWorksheet('Petunjuk')!.getColumn(3).values.join(' ');
  assert.match(guideText, /Employee Name/);
  assert.match(guideText, /opsional/i);
});


test('parser preserves blank and partial hardware specifications as nullable values', async () => {
  const buffer = await buildAssetImportTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  workbook.getWorksheet('Laptop-PC')!.addRow([
    'COMP-02', 'LAPTOP', '', 'Framework Laptop', '', '', '', 'External Contractor',
    '', 'Good', '', '', 2, '', 1024, '',
  ]);

  const parsed = await parseAssetImportWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));

  assert.deepEqual(parsed.laptopPcRows[0].cpuName, null);
  assert.deepEqual(parsed.laptopPcRows[0].ramSizeGb, null);
  assert.equal(parsed.laptopPcRows[0].ramSlotCount, 2);
  assert.deepEqual(parsed.laptopPcRows[0].disk1SizeGb, null);
  assert.equal(parsed.laptopPcRows[0].disk2SizeGb, 1024);
  assert.equal(parsed.laptopPcRows[0].employeeName, 'External Contractor');
});

test('parser rejects formula cells', async () => {
  const buffer = await buildAssetImportTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  workbook.getWorksheet('Laptop-PC')!.getCell('K2').value = { formula: '1+1', result: 2 } as any;
  const formulaBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
  await assert.rejects(() => parseAssetImportWorkbook(formulaBuffer), /formula/i);
});

test('parser accepts valid populated rows', async () => {
  const buffer = await buildAssetImportTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const pcSheet = workbook.getWorksheet('Laptop-PC')!;
  pcSheet.addRow([
    'COMP-01', 'LAPTOP', 'AST-LPT-001', 'ThinkPad T14', 'SN12345', 'JKT-HQ', 'EMP001',
    'John Doe', '2026-01-15', 'Good', 'Intel Core i7', 16, 2, 512, 256, 'No complaints',
  ]);

  const otherSheet = workbook.getWorksheet('Other Assets')!;
  otherSheet.addRow([
    'Printer', 'AST-PRN-001', 'HP LaserJet', 'PRN999', 'SHARED', 'JKT-HQ', '',
    '', '', 'Good', 'General office printer',
  ]);

  const accSheet = workbook.getWorksheet('Accessories')!;
  accSheet.addRow([
    'COMP-01', 'Mouse', 'Logitech Wireless', 1, 'Good', 'USB receiver included',
  ]);

  const populatedBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const parsed = await parseAssetImportWorkbook(populatedBuffer);

  assert.equal(parsed.laptopPcRows.length, 1);
  assert.equal(parsed.laptopPcRows[0].computerReference, 'COMP-01');
  assert.equal(parsed.laptopPcRows[0].ramSizeGb, 16);
  assert.equal(parsed.laptopPcRows[0].disk2SizeGb, 256);

  assert.equal(parsed.otherAssetRows.length, 1);
  assert.equal(parsed.otherAssetRows[0].equipmentCategory, 'Printer');
  assert.equal(parsed.otherAssetRows[0].assignmentType, 'SHARED');

  assert.equal(parsed.accessoryRows.length, 1);
  assert.equal(parsed.accessoryRows[0].accessoryType, 'Mouse');
});
