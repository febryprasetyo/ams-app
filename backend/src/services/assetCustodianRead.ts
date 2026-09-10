import { eq, getTableColumns, inArray } from 'drizzle-orm';
import { db } from '../db';
import { assetCustodians } from '../db/schema/assetCustodians';
import { employees } from '../db/schema/employees';
import { locations } from '../db/schema/master';

// Directory notes belong to IT administration; inventory responses use public holder metadata.
const { notes: _privateNotes, ...custodianColumns } = getTableColumns(assetCustodians);

export async function hydrateAssetCustodians<T extends { currentCustodianId: number | null }>(
  rows: T[],
  runner: Pick<typeof db, 'select'> = db,
) {
  const ids = [...new Set(rows.map(row => row.currentCustodianId).filter((id): id is number => id !== null))];
  const custodians = ids.length ? await runner.select({
    ...custodianColumns,
    employeeCode: employees.employeeCode,
    employeeName: employees.fullName,
    locationName: locations.name,
  }).from(assetCustodians)
    .leftJoin(employees, eq(assetCustodians.employeeId, employees.id))
    .leftJoin(locations, eq(assetCustodians.locationId, locations.id))
    .where(inArray(assetCustodians.id, ids)) : [];
  const byId = new Map(custodians.map(custodian => [custodian.id, custodian]));
  return rows.map(row => {
    const custodian = row.currentCustodianId === null ? null : byId.get(row.currentCustodianId) ?? null;
    return {
      ...row,
      currentCustodian: custodian,
      assignedToEmployeeId: custodian?.employeeId ?? null,
      assignedEmployeeName: custodian?.employeeName ?? custodian?.displayName ?? null,
      assignedEmployeeCode: custodian?.employeeCode ?? null,
    };
  });
}
