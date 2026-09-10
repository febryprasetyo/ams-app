import assert from "node:assert/strict";
import test from "node:test";
import router from "../routes/hardwareAuditRoutes";

function registeredRoutes(): Array<{ path: string; methods: string[] }> {
  const stack = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
  return stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route!.path,
      methods: Object.keys(layer.route!.methods).filter((m) => layer.route!.methods[m]),
    }));
}

test("hardware audit routes expose ingest, batch-sync, list, link, and create-asset endpoints", () => {
  const routes = registeredRoutes();
  const routeMap = new Map(routes.map((r) => [r.path, r.methods]));

  assert.ok(routeMap.has("/ingest"), "Missing /ingest route");
  assert.ok(routeMap.get("/ingest")!.includes("post"));

  assert.ok(routeMap.has("/batch-sync"), "Missing /batch-sync route");
  assert.ok(routeMap.get("/batch-sync")!.includes("post"));

  assert.ok(routeMap.has("/"), "Missing / route");
  assert.ok(routeMap.get("/")!.includes("get"));

  assert.ok(routeMap.has("/:id/link"), "Missing /:id/link route");
  assert.ok(routeMap.get("/:id/link")!.includes("post"));

  assert.ok(routeMap.has("/:id/create-asset"), "Missing /:id/create-asset route");
  assert.ok(routeMap.get("/:id/create-asset")!.includes("post"));

  assert.ok(routeMap.has("/:id"), "Missing /:id route");
  assert.ok(routeMap.get("/:id")!.includes("delete"));
});
