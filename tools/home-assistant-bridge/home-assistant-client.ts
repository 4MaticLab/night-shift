import WebSocket from "ws";
import type { AmbientEntity } from "../../src/lib/ambient-hardware/types";
import { normalizeHomeAssistantState, type HomeAssistantState } from "./entity-normalizer";

type HomeAssistantStatus = "connecting" | "online" | "offline" | "auth-error";

interface PendingCommand {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface HomeAssistantMessage {
  id?: number;
  type: string;
  success?: boolean;
  result?: unknown;
  error?: { message?: string };
  event?: {
    event_type?: string;
    data?: {
      entity_id?: string;
      new_state?: HomeAssistantState | null;
    };
  };
  ha_version?: string;
  message?: string;
}

export interface HomeAssistantClientOptions {
  reconnect?: boolean;
  commandTimeoutMs?: number;
  webSocketFactory?: (url: string) => WebSocket;
}

export interface HomeAssistantServiceCall {
  domain: "scene" | "light" | "switch" | "fan";
  service: "turn_on" | "turn_off";
  entityId: string;
  serviceData?: Record<string, unknown>;
}

export class HomeAssistantClient {
  private socket: WebSocket | null = null;
  private nextCommandId = 1;
  private pending = new Map<number, PendingCommand>();
  private entityListeners = new Set<(entity: AmbientEntity) => void>();
  private statusListeners = new Set<(status: HomeAssistantStatus, error?: string) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private manuallyClosed = false;
  private connectPromise: Promise<void> | null = null;
  private readonly reconnect: boolean;
  private readonly commandTimeoutMs: number;
  private readonly webSocketFactory: (url: string) => WebSocket;

  readonly entities = new Map<string, AmbientEntity>();
  status: HomeAssistantStatus = "offline";
  version: string | undefined;
  lastError: string | undefined;

  constructor(
    readonly baseUrl: string,
    private readonly token: string,
    options: HomeAssistantClientOptions = {},
  ) {
    this.reconnect = options.reconnect ?? true;
    this.commandTimeoutMs = options.commandTimeoutMs ?? 5_000;
    this.webSocketFactory = options.webSocketFactory ?? ((url) => new WebSocket(url));
  }

  onEntity(listener: (entity: AmbientEntity) => void): () => void {
    this.entityListeners.add(listener);
    return () => this.entityListeners.delete(listener);
  }

  onStatus(listener: (status: HomeAssistantStatus, error?: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  async connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    this.manuallyClosed = false;
    this.connectPromise = this.openAndInitialize().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  close(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
    this.rejectPending(new Error("Home Assistant connection closed."));
    this.setStatus("offline");
  }

  async callService(call: HomeAssistantServiceCall): Promise<void> {
    await this.sendCommand({
      type: "call_service",
      domain: call.domain,
      service: call.service,
      service_data: call.serviceData ?? {},
      target: { entity_id: call.entityId },
    });
  }

  private async openAndInitialize(): Promise<void> {
    this.setStatus("connecting");
    const socket = this.webSocketFactory(this.websocketUrl());
    this.socket = socket;

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const handshakeTimeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.terminate();
        reject(new Error("Home Assistant handshake timed out."));
      }, this.commandTimeoutMs * 2);

      const fail = (error: Error, authError = false) => {
        if (!settled) {
          settled = true;
          clearTimeout(handshakeTimeout);
          reject(error);
        }
        this.lastError = error.message;
        this.setStatus(authError ? "auth-error" : "offline", error.message);
      };

      socket.on("message", (payload) => {
        let message: HomeAssistantMessage;
        try {
          message = JSON.parse(payload.toString()) as HomeAssistantMessage;
        } catch {
          return;
        }

        if (message.type === "auth_required") {
          socket.send(JSON.stringify({ type: "auth", access_token: this.token }));
          return;
        }
        if (message.type === "auth_invalid") {
          fail(new Error(message.message || "Home Assistant rejected the access token."), true);
          socket.close();
          return;
        }
        if (message.type === "auth_ok") {
          this.version = message.ha_version;
          void this.initializeCommands().then(() => {
            if (settled) return;
            settled = true;
            clearTimeout(handshakeTimeout);
            this.reconnectAttempt = 0;
            this.lastError = undefined;
            this.setStatus("online");
            resolve();
          }).catch((error: unknown) => fail(asError(error)));
          return;
        }
        this.handleMessage(message);
      });

      socket.on("error", (error) => {
        fail(asError(error));
      });

      socket.on("close", () => {
        clearTimeout(handshakeTimeout);
        this.socket = null;
        this.rejectPending(new Error("Home Assistant connection closed."));
        if (!settled) {
          settled = true;
          reject(new Error(this.lastError || "Home Assistant connection closed during setup."));
        }
        if (this.status !== "auth-error") this.setStatus("offline", this.lastError);
        this.scheduleReconnect();
      });
    });
  }

  private async initializeCommands(): Promise<void> {
    const states = await this.sendCommand({ type: "get_states" });
    if (!Array.isArray(states)) throw new Error("Home Assistant returned an invalid state list.");
    this.entities.clear();
    for (const rawState of states) {
      if (!isHomeAssistantState(rawState)) continue;
      const entity = normalizeHomeAssistantState(rawState);
      if (!entity) continue;
      this.entities.set(entity.id, entity);
      this.emitEntity(entity);
    }
    await this.sendCommand({ type: "subscribe_events", event_type: "state_changed" });
  }

  private sendCommand(command: Record<string, unknown>): Promise<unknown> {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Home Assistant is offline."));
    }
    const id = this.nextCommandId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Home Assistant command ${id} timed out.`));
      }, this.commandTimeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, ...command }));
    });
  }

  private handleMessage(message: HomeAssistantMessage): void {
    if (message.type === "result" && message.id !== undefined) {
      const command = this.pending.get(message.id);
      if (!command) return;
      clearTimeout(command.timeout);
      this.pending.delete(message.id);
      if (message.success) command.resolve(message.result);
      else command.reject(new Error(message.error?.message || `Home Assistant command ${message.id} failed.`));
      return;
    }

    if (message.type !== "event" || message.event?.event_type !== "state_changed") return;
    const rawState = message.event.data?.new_state;
    if (!rawState) return;
    const entity = normalizeHomeAssistantState(rawState);
    if (!entity) return;
    this.entities.set(entity.id, entity);
    this.emitEntity(entity);
  }

  private websocketUrl(): string {
    const url = new URL(this.baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/api/websocket";
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  private rejectPending(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }

  private scheduleReconnect(): void {
    if (!this.reconnect || this.manuallyClosed || this.status === "auth-error" || this.reconnectTimer) return;
    const delay = Math.min(30_000, 500 * (2 ** this.reconnectAttempt++));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch((error: unknown) => {
        this.lastError = asError(error).message;
      });
    }, delay);
  }

  private setStatus(status: HomeAssistantStatus, error?: string): void {
    this.status = status;
    if (error) this.lastError = error;
    for (const listener of this.statusListeners) listener(status, error);
  }

  private emitEntity(entity: AmbientEntity): void {
    for (const listener of this.entityListeners) listener(entity);
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isHomeAssistantState(value: unknown): value is HomeAssistantState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HomeAssistantState>;
  return typeof candidate.entity_id === "string" && typeof candidate.state === "string";
}
