import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { ConnectorRuntime } from "./runtime";

const MAX_BODY_BYTES = 32_768;

interface SettingsServerOptions {
  runtime: ConnectorRuntime;
  openApp: (url: string) => Promise<void>;
}

export interface SettingsServer {
  start: (port?: number) => Promise<{ host: string; port: number; url: string }>;
  stop: () => Promise<void>;
}

export function createSettingsServer(options: SettingsServerOptions): SettingsServer {
  let settingsPort = 0;
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; "
        + "connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
    );

    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (request.method === "GET" && url.pathname === "/") {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(settingsHtml);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      return json(response, 200, options.runtime.status());
    }

    if (request.method === "GET" && url.pathname === "/api/discovery") {
      try {
        const timeout = Math.min(5_000, Math.max(250, Number(url.searchParams.get("timeout")) || 2_000));
        return json(response, 200, { instances: await options.runtime.discover(timeout) });
      } catch (error) {
        return json(response, 500, { error: errorMessage(error) });
      }
    }

    if (request.method === "POST") {
      if (!isTrustedOrigin(request, settingsPort)) {
        return json(response, 403, { error: "Settings request origin is not allowed." });
      }
      try {
        if (url.pathname === "/api/connect") {
          const body = await readJson(request);
          if (!isRecord(body)) throw new Error("Request body must be an object.");
          return json(response, 200, await options.runtime.configure({
            homeAssistantUrl: String(body.homeAssistantUrl ?? ""),
            token: String(body.token ?? ""),
            appUrl: body.appUrl ? String(body.appUrl) : undefined,
          }));
        }
        if (url.pathname === "/api/disconnect") {
          return json(response, 200, await options.runtime.disconnect());
        }
        if (url.pathname === "/api/open-night-shift") {
          const status = options.runtime.status();
          await options.openApp(status.appUrl);
          return json(response, 200, { opened: status.appUrl });
        }
      } catch (error) {
        return json(response, 400, { error: errorMessage(error) });
      }
    }

    return json(response, 404, { error: "Route not found." });
  });

  return {
    start: (port = 43_118) => new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.off("error", reject);
        const address = server.address() as AddressInfo;
        settingsPort = address.port;
        resolve({
          host: address.address,
          port: address.port,
          url: `http://127.0.0.1:${address.port}`,
        });
      });
    }),
    stop: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

function isTrustedOrigin(request: IncomingMessage, port: number): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  return origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const contentType = request.headers["content-type"] ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("Content-Type must be application/json.");
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_BODY_BYTES) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Connector request failed.";
}

const settingsHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Night Shift Connector</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; background: #0d1110; color: #ece7d7; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at top, #24312a, #0d1110 48%); }
    main { width: min(720px, calc(100% - 32px)); margin: 48px auto; }
    .eyebrow { color: #c3a969; letter-spacing: .16em; text-transform: uppercase; font-size: 12px; }
    h1 { margin: 8px 0; font-family: Georgia, serif; font-size: clamp(32px, 6vw, 54px); font-weight: 500; }
    .lede { color: #b8beb8; line-height: 1.6; }
    .card { margin-top: 24px; padding: 24px; border: 1px solid #526157; border-radius: 18px; background: rgba(16, 23, 20, .9); box-shadow: 0 18px 60px #0008; }
    .status { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; }
    .dot { display: inline-block; width: 10px; height: 10px; margin-right: 8px; border-radius: 50%; background: #8a8f8a; }
    .dot.online { background: #7bd58e; box-shadow: 0 0 12px #7bd58e99; }
    .code { font: 600 28px ui-monospace, monospace; letter-spacing: .2em; color: #e6ca84; }
    label { display: block; margin-top: 18px; color: #cad0ca; font-size: 13px; }
    input { width: 100%; margin-top: 7px; padding: 12px 14px; border: 1px solid #58665e; border-radius: 10px; background: #090d0b; color: #fff; font: inherit; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
    button { padding: 11px 16px; border: 1px solid #8c7a4b; border-radius: 999px; background: #d3b56e; color: #15130e; font-weight: 700; cursor: pointer; }
    button.secondary { background: transparent; color: #e8dfc9; border-color: #657268; }
    button:disabled { opacity: .5; cursor: wait; }
    #message { min-height: 24px; margin-top: 14px; color: #e9bd79; }
    #instances { display: grid; gap: 8px; margin-top: 12px; }
    .instance { width: 100%; text-align: left; border-radius: 10px; }
    .privacy { color: #89928c; font-size: 12px; line-height: 1.55; }
  </style>
</head>
<body>
<main>
  <div class="eyebrow">Local-only hardware adapter</div>
  <h1>Night Shift Connector</h1>
  <p class="lede">这个小程序只在你的电脑上连接 Home Assistant，并把经过白名单筛选的灯光、场景、开关和传感器交给 Night Shift。长期令牌不会发往 Vercel。</p>
  <section class="card">
    <div class="status">
      <div><span id="dot" class="dot"></span><strong id="status">正在启动…</strong><div id="details" class="privacy"></div></div>
      <div><div class="privacy">网页配对码</div><div id="code" class="code">------</div></div>
    </div>
  </section>
  <section class="card">
    <strong>1. 连接 Home Assistant</strong>
    <div class="actions"><button id="discover" class="secondary">自动发现</button></div>
    <div id="instances"></div>
    <label>Home Assistant URL<input id="ha-url" placeholder="http://homeassistant.local:8123" autocomplete="url"></label>
    <label>Long-lived access token<input id="token" type="password" autocomplete="off" placeholder="只保留在本次 Connector 进程内"></label>
    <label>Night Shift 网页<input id="app-url" value="https://night-shift-zeta.vercel.app" autocomplete="url"></label>
    <div class="actions">
      <button id="connect">验证并连接</button>
      <button id="disconnect" class="secondary">断开</button>
    </div>
    <div id="message" role="status"></div>
    <p class="privacy">关闭 Connector 后，Home Assistant 令牌、网页配对会话和临时设备快照都会失效。设置页与桥均只监听 127.0.0.1。</p>
  </section>
  <section class="card">
    <strong>2. 回到 Night Shift</strong>
    <p class="privacy">保持 Connector 运行，在 Chrome 的“空间外设”页允许本地网络访问，再输入上面的六位码。</p>
    <div class="actions"><button id="open">打开 Night Shift</button></div>
  </section>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  const message = (value, error = false) => {
    $("message").textContent = value;
    $("message").style.color = error ? "#ff9b91" : "#e9bd79";
  };
  async function api(path, init) {
    const response = await fetch(path, init);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "请求失败");
    return body;
  }
  function render(status) {
    $("code").textContent = status.pairCode;
    $("app-url").value = status.appUrl;
    if (status.homeAssistantUrl && !$("ha-url").value) $("ha-url").value = status.homeAssistantUrl;
    const online = status.homeAssistant === "online";
    $("dot").classList.toggle("online", online);
    $("status").textContent = online ? "Home Assistant 已连接" : "等待连接 Home Assistant";
    $("details").textContent = online
      ? status.entityCount + " 个安全实体 · Home Assistant " + (status.version || "")
      : (status.lastError || "桥已在 " + status.bridgeUrl + " 就绪");
  }
  async function refresh() {
    try { render(await api("/api/status")); } catch (error) { message(error.message, true); }
  }
  $("discover").onclick = async () => {
    $("discover").disabled = true;
    message("正在局域网内查找 Home Assistant…");
    $("instances").replaceChildren();
    try {
      const { instances } = await api("/api/discovery?timeout=2000");
      if (!instances.length) message("没有自动发现实例，可以直接填写 URL。");
      for (const instance of instances) {
        const button = document.createElement("button");
        button.className = "instance secondary";
        button.textContent = instance.name + " — " + instance.url;
        button.onclick = () => { $("ha-url").value = instance.url; };
        $("instances").append(button);
      }
    } catch (error) { message(error.message, true); }
    finally { $("discover").disabled = false; }
  };
  $("connect").onclick = async () => {
    $("connect").disabled = true;
    message("正在验证连接…");
    try {
      const status = await api("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeAssistantUrl: $("ha-url").value,
          token: $("token").value,
          appUrl: $("app-url").value,
        }),
      });
      $("token").value = "";
      render(status);
      message("连接成功。现在回到 Night Shift 输入配对码。");
    } catch (error) { message(error.message, true); }
    finally { $("connect").disabled = false; }
  };
  $("disconnect").onclick = async () => {
    try { render(await api("/api/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })); message("已断开。"); }
    catch (error) { message(error.message, true); }
  };
  $("open").onclick = async () => {
    try { await api("/api/open-night-shift", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); }
    catch (error) { message(error.message, true); }
  };
  refresh();
  setInterval(refresh, 3000);
</script>
</body>
</html>`;
