"use client";

import {
  ambientBindingsSchema,
  ambientBridgeEventSchema,
  ambientBridgeStatusSchema,
  ambientEntitySchema,
  type AmbientBindings,
  type AmbientBridgeEvent,
  type AmbientBridgeStatus,
  type AmbientCueRequest,
  type AmbientEntity,
} from "./types";

function bridgeUrl(): string {
  const configured = process.env.NEXT_PUBLIC_HOME_ASSISTANT_BRIDGE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "127.0.0.1") {
    return "http://127.0.0.1:43117";
  }
  return "http://localhost:43117";
}

async function bridgeFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${bridgeUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(3_000),
  });
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error || `Local bridge returned ${response.status}.`);
  return body;
}

export async function readAmbientBridgeStatus(): Promise<AmbientBridgeStatus> {
  return ambientBridgeStatusSchema.parse(await bridgeFetch("/v1/status"));
}

export async function pairAmbientBridge(code: string): Promise<void> {
  await bridgeFetch("/v1/pair", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
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

export function connectAmbientBridgeEvents(
  onEvent: (event: AmbientBridgeEvent) => void,
  onError: () => void,
): () => void {
  const stream = new EventSource(`${bridgeUrl()}/v1/events`, { withCredentials: true });
  stream.onmessage = (message) => {
    try {
      onEvent(ambientBridgeEventSchema.parse(JSON.parse(message.data) as unknown));
    } catch {
      // Ignore malformed local bridge events; the next status refresh remains authoritative.
    }
  };
  stream.onerror = onError;
  return () => stream.close();
}
