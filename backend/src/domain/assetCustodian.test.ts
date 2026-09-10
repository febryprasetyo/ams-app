import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCustodianName, findCustodianCandidates, rankEmployeeMatches, manualCustodianSchema } from './assetCustodian';

test('holder normalization trims and collapses all whitespace consistently', () => {
  assert.equal(normalizeCustodianName('  BUDI\t  Santoso\n'), 'budi santoso');
});
test('exact and similar candidates retain distinct identities', () => {
  const candidates = [{ id: 1, displayName: ' Budi  Santoso ' }, { id: 2, displayName: 'Budi Santosa' }, { id: 3, displayName: 'Alice Smith' }];
  assert.deepEqual(findCustodianCandidates('budi santoso', candidates).map(c => c.id), [1, 2]);
});
test('manual holders require nonblank names and validate optional IDs and acknowledgement', () => {
  assert.equal(manualCustodianSchema.safeParse({ displayName: '   ' }).success, false);
  assert.equal(manualCustodianSchema.safeParse({ displayName: 'Budi', locationId: -1 }).success, false);
  assert.equal(manualCustodianSchema.safeParse({ displayName: 'Budi', duplicateAcknowledged: 'yes' }).success, false);
  assert.equal(manualCustodianSchema.parse({ displayName: ' Budi   Santoso ', locationId: null }).displayName, 'Budi Santoso');
});

test('reconciliation ranks exact names first then shared location and unit deterministically', () => {
  const holder = {displayName:'Budi Santoso',locationId:5,unitText:' Finance '};
  const matches = [
    {id:1,fullName:'Budi Santoso',locationId:null,departmentName:null},
    {id:2,fullName:'Budi Santoso',locationId:5,departmentName:'Finance'},
    {id:3,fullName:'Budi Santosa',locationId:5,departmentName:'Finance'},
    {id:4,fullName:'Budi Santoso',locationId:5,departmentName:'Finance'},
  ];
  assert.deepEqual(rankEmployeeMatches(holder,matches).map(match=>match.id),[2,4,1,3]);
});
