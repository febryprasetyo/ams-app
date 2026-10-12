import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "development";
const { default: nextConfig } = await import("./next.config.ts");

test("allows localhost, loopback, and LAN hosts to load development assets", () => {
  assert.ok(nextConfig.allowedDevOrigins?.includes("127.0.0.1"));
  assert.ok(nextConfig.allowedDevOrigins?.includes("localhost"));
  assert.ok(nextConfig.allowedDevOrigins?.includes("192.168.10.212"));
  assert.ok(nextConfig.allowedDevOrigins?.includes("192.168.20.53"));
});

test("proxies same-origin API requests to the local backend in development", async () => {
  const previous = process.env.INTERNAL_API_URL;
  delete process.env.INTERNAL_API_URL;
  let rewrites;
  try { rewrites = await nextConfig.rewrites?.(); } finally {
    if (previous !== undefined) process.env.INTERNAL_API_URL = previous;
  }

  assert.deepEqual(rewrites, [
    {
      source: "/api/v1/:path*",
      destination: "http://127.0.0.1:5000/api/v1/:path*",
    },
  ]);
});


test("does not apply development API rewrites in production", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try { assert.deepEqual(await nextConfig.rewrites?.(), []); }
  finally { process.env.NODE_ENV = previous; }
});

test("uses the configured backend for development API requests", async () => {
  const previous = process.env.INTERNAL_API_URL;
  process.env.INTERNAL_API_URL = "http://backend:5000/api/v1/";
  try { assert.equal((await nextConfig.rewrites?.())[0].destination, "http://backend:5000/api/v1/:path*"); }
  finally {
    if (previous === undefined) delete process.env.INTERNAL_API_URL;
    else process.env.INTERNAL_API_URL = previous;
  }
});
