import test from "node:test";
import assert from "node:assert/strict";
import { computeFileHash } from "./hash.ts";

test("computeFileHash produces deterministic hash using crypto.subtle when available", async () => {
  const buffer1 = new TextEncoder().encode("attendance-file-sample-data-1").buffer;
  const buffer2 = new TextEncoder().encode("attendance-file-sample-data-1").buffer;
  const buffer3 = new TextEncoder().encode("attendance-file-sample-data-2").buffer;

  const hash1 = await computeFileHash(buffer1);
  const hash2 = await computeFileHash(buffer2);
  const hash3 = await computeFileHash(buffer3);

  assert.ok(hash1.length > 0);
  assert.equal(hash1, hash2, "Identical buffers should produce identical hash");
  assert.notEqual(hash1, hash3, "Different buffers should produce different hashes");
});

test("computeFileHash falls back safely when crypto.subtle is undefined (non-secure context)", async () => {
  // Pass an object with subtle undefined to simulate non-secure context (HTTP / LAN IP)
  const insecureCrypto = {};

  const buffer1 = new TextEncoder().encode("sample-attendance-lan-http").buffer;
  const buffer2 = new TextEncoder().encode("sample-attendance-lan-http").buffer;
  const buffer3 = new TextEncoder().encode("different-content").buffer;

  const hash1 = await computeFileHash(buffer1, insecureCrypto);
  const hash2 = await computeFileHash(buffer2, insecureCrypto);
  const hash3 = await computeFileHash(buffer3, insecureCrypto);

  assert.ok(hash1.startsWith("hash-"), "Fallback hash should have prefix format");
  assert.equal(hash1, hash2, "Identical buffers should produce identical fallback hash");
  assert.notEqual(hash1, hash3, "Different buffers should produce different fallback hashes");
});
