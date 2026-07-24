import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders Night Shift", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /夜班侦探 Night Shift/);
  assert.match(html, /你睡着以后/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("server-renders every Night Shift surface route", async () => {
  const paths = [
    "/case-intro",
    "/game/tonight",
    "/game/report",
    "/game/board",
    "/game/collection",
    "/game/archive",
    "/game/night",
    "/game/ending",
  ];
  for (const pathname of paths) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), /夜班侦探|NIGHT SHIFT|Night Shift/, pathname);
  }
});
