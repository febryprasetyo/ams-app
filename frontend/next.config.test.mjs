import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "development";
const { default: nextConfig } = await import("./next.config.ts");

test("allows localhost, loopback, and LAN hosts to load development assets", () => {
  assert.ok(nextConfig.allowedDevOrigins?.includes("127.0.0.1"));
  assert.ok(nextConfig.allowedDevOrigins?.includes("localhost"));
  assert.ok(nextConfig.allowedDevOrigins?.includes("192.168.10.212"));
});

test("proxies same-origin API requests to the local backend in development", async () => {
  const rewrites = await nextConfig.rewrites?.();

  assert.deepEqual(rewrites, [
    {
      source: "/api/v1/:path*",
      destination: "http://127.0.0.1:5000/api/v1/:path*",
    },
  ]);
});
