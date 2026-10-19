import test from "node:test";
import assert from "node:assert/strict";
import router from "./hrActivityRoutes";
import {
  parseHrActivityQuery,
  escapeIlike,
  encodeCursor,
  decodeCursor,
  computeFilterFingerprint,
} from "../domain/hrActivityQuery";

test("hrActivityRoutes registers endpoints in proper order with auth middleware", () => {
  const routes = (router.stack as any[])
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: layer.route.methods,
      stackLength: layer.route.stack.length,
    }));

  const paths = routes.map((r) => r.path);
  const actorsIdx = paths.indexOf("/actors");
  const idIdx = paths.indexOf("/:id");

  assert.ok(actorsIdx !== -1, "/actors endpoint must exist");
  assert.ok(idIdx !== -1, "/:id endpoint must exist");
  assert.ok(
    actorsIdx < idIdx,
    "/actors must precede /:id to prevent route collision"
  );

  const listRoute = routes.find((r) => r.path === "/" && r.methods.get);
  assert.ok(listRoute, "GET / must exist");
  assert.ok(listRoute.stackLength >= 2, "GET / must have auth and permission middleware");

  const targetsRoute = routes.find((r) => r.path === "/:id/targets" && r.methods.get);
  assert.ok(targetsRoute, "GET /:id/targets must exist");
});

test("parseHrActivityQuery validates calendar dates and converts WIB to UTC", () => {
  // Test valid WIB date range
  const query = parseHrActivityQuery({
    startDate: "2026-10-12",
    endDate: "2026-10-12",
  });

  assert.strictEqual(query.startDate, "2026-10-12");
  assert.strictEqual(query.endDate, "2026-10-12");
  // WIB 2026-10-12 00:00 is UTC 2026-10-11 17:00
  assert.strictEqual(query.dateFrom.toISOString(), "2026-10-11T17:00:00.000Z");
  // WIB 2026-10-13 00:00 is UTC 2026-10-12 17:00
  assert.strictEqual(query.dateTo.toISOString(), "2026-10-12T17:00:00.000Z");

  // Rejects invalid calendar date (e.g. Feb 31)
  assert.throws(
    () => parseHrActivityQuery({ startDate: "2026-02-31" }),
    /startDate bukan tanggal kalender yang valid/
  );

  // Rejects startDate > endDate
  assert.throws(
    () => parseHrActivityQuery({ startDate: "2026-10-15", endDate: "2026-10-10" }),
    /startDate harus lebih kecil atau sama dengan endDate/
  );
});

test("cursor encode and decode enforces filter fingerprint matching", () => {
  const occurredAt = new Date("2026-10-12T10:00:00.000Z");
  const id = BigInt(42);
  const fp1 = computeFilterFingerprint({
    startDate: "2026-10-01",
    endDate: "2026-10-12",
    action: "LOCK",
  });

  const cursorStr = encodeCursor(occurredAt, id, fp1);
  const decoded = decodeCursor(cursorStr, fp1);
  assert.strictEqual(decoded.occurredAt.toISOString(), occurredAt.toISOString());
  assert.strictEqual(decoded.id, id);

  // Changing filters should reject cursor with 400 error
  const fpChanged = computeFilterFingerprint({
    startDate: "2026-10-01",
    endDate: "2026-10-12",
    action: "UNLOCK", // changed filter!
  });

  assert.throws(() => decodeCursor(cursorStr, fpChanged), (err: any) => {
    return err.statusCode === 400 && /Cursor expired/.test(err.message);
  });
});

test("escapeIlike escapes % and _ literals properly", () => {
  assert.strictEqual(escapeIlike("EMP_001"), "EMP\\_001");
  assert.strictEqual(escapeIlike("100%"), "100\\%");
  assert.strictEqual(escapeIlike("John Doe"), "John Doe");
});
