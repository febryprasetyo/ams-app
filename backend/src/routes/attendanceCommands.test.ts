import test from "node:test";
import assert from "node:assert/strict";
import router from "./attendanceRoutes";
import {
  postAttendanceCommandBodySchema,
  COMMAND_PERMISSIONS_MAP,
} from "../domain/attendanceCommandInput";

test("record and correction commands accept Dinas Luar without client-supplied schedules", () => {
  for (const command of [
    { type: "record_attendance", employeeId: 1, workDate: "2026-10-18", attendanceStatus: "DINAS_LUAR" },
    { type: "correct", recordId: 1, expectedRevision: 1, values: { attendanceStatus: "DINAS_LUAR" } },
  ]) {
    const parsed = postAttendanceCommandBodySchema.safeParse({ operationId: "11111111-1111-1111-1111-111111111111", command });
    assert.ok(parsed.success, JSON.stringify(parsed.error));
    assert.equal(parsed.data.command.type, command.type);
  }
});

test("import review rejects Dinas Luar until shift normalization is supported for imports", () => {
  const result = postAttendanceCommandBodySchema.safeParse({
    operationId: "11111111-1111-1111-1111-111111111111",
    command: { type: "review", batchId: 1, rowId: 1, skipped: false, reason: "Review", attendanceStatus: "DINAS_LUAR" },
  });
  assert.equal(result.success, false);
});

test("attendance routes register /workspace and /commands", () => {
  const routes = (router.stack as any[])
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: layer.route.methods,
      stackLength: layer.route.stack.length,
    }));

  const getWorkspace = routes.find((r) => r.path === "/workspace" && r.methods.get);
  assert.ok(getWorkspace, "GET /workspace must exist");
  assert.ok(getWorkspace.stackLength >= 2, "GET /workspace must have auth middleware");

  const postCommands = routes.find((r) => r.path === "/commands" && r.methods.post);
  assert.ok(postCommands, "POST /commands must exist");
  assert.ok(postCommands.stackLength >= 2, "POST /commands must have auth middleware");
});

test("postAttendanceCommandBodySchema strictly validates input and rejects client-supplied actor/audit/outcome", () => {
  const validPayload = {
    operationId: "11111111-1111-1111-1111-111111111111",
    command: {
      type: "lock",
      workDate: "2026-10-12",
      locked: true,
      reason: "Audit period lock",
    },
  };

  const parsed = postAttendanceCommandBodySchema.safeParse(validPayload);
  assert.ok(parsed.success, "Valid payload should pass");

  // Reject client-supplied actor
  const spoofActor = {
    ...validPayload,
    actor: { id: 1, username: "superadmin" },
  };
  assert.strictEqual(
    postAttendanceCommandBodySchema.safeParse(spoofActor).success,
    false,
    "Client-supplied actor must be rejected"
  );

  // Reject client-supplied audit
  const spoofAudit = {
    ...validPayload,
    audit: { ip: "127.0.0.1" },
  };
  assert.strictEqual(
    postAttendanceCommandBodySchema.safeParse(spoofAudit).success,
    false,
    "Client-supplied audit must be rejected"
  );

  // Reject invalid UUID operationId
  const invalidUuid = {
    ...validPayload,
    operationId: "invalid-uuid",
  };
  assert.strictEqual(
    postAttendanceCommandBodySchema.safeParse(invalidUuid).success,
    false,
    "Invalid UUID operationId must be rejected"
  );
});

test("COMMAND_PERMISSIONS_MAP enforces proper permissions for each command type", () => {
  assert.deepStrictEqual(COMMAND_PERMISSIONS_MAP["correct"], ["attendance.manage"]);
  assert.deepStrictEqual(COMMAND_PERMISSIONS_MAP["lock"], ["attendance.manage"]);
  assert.deepStrictEqual(COMMAND_PERMISSIONS_MAP["identity"], ["attendance.manage"]);
  assert.deepStrictEqual(COMMAND_PERMISSIONS_MAP["grant"], ["attendance.manage"]);
  assert.ok(COMMAND_PERMISSIONS_MAP["import"].includes("attendance.import"));
  assert.ok(COMMAND_PERMISSIONS_MAP["batch"].includes("attendance.import"));
});
