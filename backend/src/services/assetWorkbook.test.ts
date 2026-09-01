import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { buildAssetImportTemplate, parseAssetImportWorkbook } from './assetWorkbook';

test('template exposes the four exact sheets and headers', async () => {
  const buffer = await buildAssetImportTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Petunjuk', 'Laptop-PC', 'Other Assets', 'Accessories']);
  assert.equal(workbook.getWorksheet('Laptop-PC')!.getCell('A1').value, 'Computer Reference');
  assert.equal(workbook.getWorksheet('Accessories')!.getCell('F1').value, 'Notes');
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
