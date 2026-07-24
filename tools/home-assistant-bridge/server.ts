import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import {
  ambientBindingsSchema,
  ambientCueRequestSchema,
  ambientTestRequestSchema,
  type AmbientBridgeEvent,
  type AmbientBridgeStatus,
} from "../../src/lib/ambient-hardware/types";
import { AmbientController } from "./ambient-controller";
import { discoverHomeAssistantInstances } from "./discovery";
import type { HomeAssistantClient } from "./home-assistant-client";

const SESSION_COOKIE = "night_shift_ha_session";
const MAX_BODY_BYTES = 32_768;

interface BridgeServerOptions {
  client?: HomeAssistantClient;
  controller?: AmbientController;
  pairCode: string;
  allowedOrigins: string[];
  discovery?: typeof discoverHomeAssistantInstances;
  version?: string;
}

interface Session {
  expiresAt: number;
}

export interface BridgeServer {
  start: (port?: number) => Promise<{ host: string; port: number }>;
  stop: () => Promise<void>;
  pairCode: string;
}

export function createBridgeServer(options: BridgeServerOptions): BridgeServer {
  const sessions = new Map<string, Session>();
  const eventStreams = new Set<ServerResponse>();
  const discovery = options.discovery ?? discoverHomeAssistantInstances;
  const version = options.version ?? "0.1.0";
  const client = options.client;
  const controller = options.controller;

  const bridgeStatus = (request?: IncomingMessage): AmbientBridgeStatus => ({
    bridge: "night-shift-home-assistant",
    version,
    paired: request ? Boolean(readSession(request, sessions)) : false,
    homeAssistant: client?.status ?? "disabled",
    instanceName: client?.version ? `Home Assistant ${client.version}` : undefined,
    entityCount: client?.entities.size ?? 0,
    lastError: client?.lastError,
  });

  const broadcast = (event: AmbientBridgeEvent) => {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const stream of eventStreams) stream.write(payload);
  };

  client?.onStatus(() => broadcast({
    type: "status",
    status: { ...bridgeStatus(), paired: true },
  }));
  client?.onEntity((entity) => broadcast({ type: "entity", entity }));

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    const allowedOrigin = origin && options.allowedOrigins.includes(origin) ? origin : undefined;
    if (origin && !allowedOrigin) {
      return json(response, 403, { error: "Origin is not allowed." });
    }
    if (allowedOrigin) {
      response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      response.setHeader("Access-Control-Allow-Credentials", "true");
      response.setHeader("Vary", "Origin");
    }
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");

    if (request.method === "OPTIONS") {
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.writeHead(204).end();
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "GET" && url.pathname === "/v1/status") {
      return json(response, 200, bridgeStatus(request));
    }

    if (request.method === "POST" && url.pathname === "/v1/pair") {
      let body: unknown;
      try {
        body = await readJson(request);
      } catch (error) {
        return json(response, 400, { error: errorMessage(error) });
      }
      const suppliedCode = typeof body === "object" && body && "code" in body
        ? String(body.code)
        : "";
      if (!safeEqual(suppliedCode, options.pairCode)) {
        return json(response, 401, { error: "Pairing code is invalid." });
      }
      const token = randomBytes(32).toString("base64url");
      sessions.set(hashToken(token), { expiresAt: Date.now() + 12 * 60 * 60_000 });
      response.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`,
      );
      return json(response, 200, { paired: true });
    }

    if (!readSession(request, sessions)) {
      return json(response, 401, { error: "Bridge pairing is required." });
    }

    if (request.method === "GET" && url.pathname === "/v1/entities") {
      return json(response, 200, {
        entities: [...(client?.entities.values() ?? [])]
          .sort((first, second) => first.name.localeCompare(second.name)),
      });
    }

    if (request.method === "GET" && url.pathname === "/v1/discovery") {
      const timeout = Math.min(5_000, Math.max(100, Number(url.searchParams.get("timeout")) || 1_500));
      const instances = await discovery(timeout);
      return json(response, 200, { instances });
    }

    if (request.method === "GET" && url.pathname === "/v1/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        Connection: "keep-alive",
      });
      response.write(`data: ${JSON.stringify({
        type: "status",
        status: { ...bridgeStatus(request), paired: true },
      }) satisfies string}\n\n`);
      eventStreams.add(response);
      request.on("close", () => eventStreams.delete(response));
      return;
    }

    if (!client || !controller) {
      return json(response, 503, { error: "Home Assistant is not configured for this bridge." });
    }

    if (request.method === "GET" && url.pathname === "/v1/bindings") {
      return json(response, 200, { bindings: controller.getBindings() });
    }

    if (request.method === "POST" && url.pathname === "/v1/bindings") {
      try {
        const body = await readJson(request);
        const bindings = controller.setBindings(
          typeof body === "object" && body && "bindings" in body ? body.bindings : body,
        );
        broadcast({ type: "bindings", bindings });
        return json(response, 200, { bindings });
      } catch (error) {
        return json(response, 400, { error: errorMessage(error) });
      }
    }

    if (request.method === "POST" && url.pathname === "/v1/cues") {
      try {
        const cue = ambientCueRequestSchema.parse(await readJson(request));
        const result = await controller.executeCue(cue.requestId, cue.cue);
        return json(response, 200, result);
      } catch (error) {
        return json(response, 400, { error: errorMessage(error) });
      }
    }

    if (request.method === "POST" && url.pathname === "/v1/test") {
      try {
        const test = ambientTestRequestSchema.parse(await readJson(request));
        await controller.testEntity(test.entityId);
        return json(response, 200, { tested: test.entityId });
      } catch (error) {
        return json(response, 400, { error: errorMessage(error) });
      }
    }

    if (request.method === "POST" && url.pathname === "/v1/restore") {
      const result = await controller.restore();
      return json(response, 200, result);
    }

    return json(response, 404, { error: "Route not found." });
  });

  return {
    pairCode: options.pairCode,
    start: (port = 43_117) => new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.off("error", reject);
        const address = server.address() as AddressInfo;
        resolve({ host: address.address, port: address.port });
      });
    }),
    stop: () => new Promise((resolve, reject) => {
      for (const stream of eventStreams) stream.end();
      eventStreams.clear();
      client?.close();
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_BODY_BYTES) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function safeEqual(first: string, second: string): boolean {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readSession(request: IncomingMessage, sessions: Map<string, Session>): Session | null {
  const cookies = Object.fromEntries(
    (request.headers.cookie ?? "").split(";").map((part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return ["", ""];
      return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const key = hashToken(token);
  const session = sessions.get(key);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(key);
    return null;
  }
  return session;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Bridge request failed.";
}

export function parseBindings(value: unknown) {
  return ambientBindingsSchema.parse(value);
}
