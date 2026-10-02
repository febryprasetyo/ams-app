import assert from "node:assert/strict";
import test from "node:test";
import { filterEmployees } from "./employeeDirectory.ts";

const employees = [
  { id: 1, employeeCode: "EMP-001", fullName: "Ayu", departmentId: 1, status: "Active" },
  { id: 2, employeeCode: "EMP-002", fullName: "Budi", departmentId: 1, status: "Inactive" },
  { id: 3, employeeCode: "OLD-003", fullName: "Citra", departmentId: 2, status: "Resigned" },
  { id: 4, employeeCode: "EMP-004", fullName: "MUHAMMAD RAIS ALFARIZI", departmentId: 1, status: "Active" },
];

test("filters the active tab by Employee ID and department", () => {
  const result = filterEmployees(employees, { tab: "active", employeeIdQuery: "001", departmentId: "1" });
  assert.deepEqual(result.map(row => row.id), [1]);
});

test("filters the active tab by partial employee name case-insensitively (e.g. rais finds MUHAMMAD RAIS ALFARIZI)", () => {
  const result = filterEmployees(employees, { tab: "active", employeeIdQuery: "rais", departmentId: "" });
  assert.deepEqual(result.map(row => row.id), [4]);

  const upperResult = filterEmployees(employees, { tab: "active", employeeIdQuery: "RAIS", departmentId: "" });
  assert.deepEqual(upperResult.map(row => row.id), [4]);

  const multiTokenResult = filterEmployees(employees, { tab: "active", employeeIdQuery: "muhammad rais", departmentId: "" });
  assert.deepEqual(multiTokenResult.map(row => row.id), [4]);
});

test("keeps inactive and resigned employees in the archive tab", () => {
  assert.deepEqual(filterEmployees(employees, { tab: "archive", employeeIdQuery: "", departmentId: "" }).map(row => row.id), [2, 3]);
  assert.deepEqual(filterEmployees(employees, { tab: "archive", employeeIdQuery: "", departmentId: "", archiveStatus: "Resigned" }).map(row => row.id), [3]);
});
