"use client";

import {
  ambientBindingsSchema,
  ambientBridgeStatusSchema,
  ambientEntitySchema,
  type AmbientBindings,
  type AmbientBridgeStatus,
  type AmbientCueRequest,
  type AmbientEntity,
} from "./types";

const BRIDGE_SESSION_KEY = "night-shift-home-assistant-session";

function bridgeUrl(): string {
  const configured = process.env.NEXT_PUBLIC_HOME_ASSISTANT_BRIDGE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return "http://127.0.0.1:43117";
}

type LocalNetworkRequestInit = RequestInit & {
  targetAddressSpace?: "loopback";
};

function readSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(BRIDGE_SESSION_KEY);
}

function writeSessionToken(token: string): void {
  window.sessionStorage.setItem(BRIDGE_SESSION_KEY, token);
}

async function bridgeFetch(path: string, init?: RequestInit): Promise<unknown> {
  const token = readSessionToken();
  const request: LocalNetworkRequestInit = {
    ...init,
    mode: "cors",
    targetAddressSpace: "loopback",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(3_000),
  };
  const response = await fetch(`${bridgeUrl()}${path}`, request);
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    if (response.status === 401 && path !== "/v1/pair" && typeof window !== "undefined") {
      window.sessionStorage.removeItem(BRIDGE_SESSION_KEY);
    }
    throw new Error(body.error || `Local bridge returned ${response.status}.`);
  }
  return body;
}

export async function readAmbientBridgeStatus(): Promise<AmbientBridgeStatus> {
  return ambientBridgeStatusSchema.parse(await bridgeFetch("/v1/status"));
}

export async function pairAmbientBridge(code: string): Promise<void> {
  const body = await bridgeFetch("/v1/pair", {
    method: "POST",
    body: JSON.stringify({ code }),
  }) as { sessionToken?: unknown };
  if (typeof body.sessionToken !== "string" || !body.sessionToken) {
    throw new Error("本地 Connector 未返回有效会话。");
  }
  writeSessionToken(body.sessionToken);
}

export async function readAmbientEntities(): Promise<AmbientEntity[]> {
  const body = await bridgeFetch("/v1/entities") as { entities?: unknown };
  return ambientEntitySchema.array().parse(body.entities);
}

export async function readAmbientBindings(): Promise<AmbientBindings> {
  const body = await bridgeFetch("/v1/bindings") as { bindings?: unknown };
  return ambientBindingsSchema.parse(body.bindings);
}

export async function writeAmbientBindings(bindings: AmbientBindings): Promise<AmbientBindings> {
  const body = await bridgeFetch("/v1/bindings", {
    method: "POST",
    body: JSON.stringify({ bindings }),
  }) as { bindings?: unknown };
  return ambientBindingsSchema.parse(body.bindings);
}

export async function testAmbientEntity(entityId: string): Promise<void> {
  await bridgeFetch("/v1/test", {
    method: "POST",
    body: JSON.stringify({ entityId }),
  });
}

export async function sendAmbientCue(cue: AmbientCueRequest): Promise<void> {
  await bridgeFetch("/v1/cues", {
    method: "POST",
    body: JSON.stringify(cue),
    signal: AbortSignal.timeout(2_500),
  });
}

export async function restoreAmbientScene(): Promise<{ restored: string[]; skipped: string[] }> {
  return await bridgeFetch("/v1/restore", {
    method: "POST",
    body: "{}",
  }) as { restored: string[]; skipped: string[] };
}

export function clearAmbientBridgeSession(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(BRIDGE_SESSION_KEY);
  }
}
