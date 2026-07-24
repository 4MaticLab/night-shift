import type {
  AmbientBindings,
  AmbientCue,
  AmbientEntity,
} from "../../src/lib/ambient-hardware/types";
import { ambientBindingsSchema, isControllableAmbientDomain } from "../../src/lib/ambient-hardware/types";
import type { HomeAssistantClient, HomeAssistantServiceCall } from "./home-assistant-client";

export interface CueExecution {
  status: "executed" | "duplicate" | "unbound";
  entityId?: string;
}

const lightPresets: Record<AmbientCue | "test", { brightness: number; rgb: [number, number, number] }> = {
  "night.started": { brightness: 46, rgb: [38, 52, 89] },
  "wake.echo": { brightness: 115, rgb: [173, 112, 60] },
  "morning.arrived": { brightness: 166, rgb: [239, 184, 96] },
  test: { brightness: 102, rgb: [225, 156, 76] },
};

export class AmbientController {
  private bindings: AmbientBindings = {};
  private processed = new Map<string, number>();
  private snapshots = new Map<string, AmbientEntity>();

  constructor(private readonly client: HomeAssistantClient) {}

  getBindings(): AmbientBindings {
    return { ...this.bindings };
  }

  setBindings(input: unknown): AmbientBindings {
    const bindings = ambientBindingsSchema.parse(input);
    for (const entityId of Object.values(bindings)) {
      if (!entityId) continue;
      this.requireControllableEntity(entityId);
    }
    this.bindings = { ...bindings };
    return this.getBindings();
  }

  async executeCue(requestId: string, cue: AmbientCue): Promise<CueExecution> {
    this.pruneProcessed();
    if (this.processed.has(requestId)) return { status: "duplicate" };
    this.processed.set(requestId, Date.now());
    const entityId = this.bindings[cue];
    if (!entityId) return { status: "unbound" };
    const entity = this.requireControllableEntity(entityId);
    this.captureSnapshot(entity);
    await this.client.callService(this.serviceCall(entity, cue));
    return { status: "executed", entityId };
  }

  async testEntity(entityId: string): Promise<void> {
    const entity = this.requireControllableEntity(entityId);
    this.captureSnapshot(entity);
    await this.client.callService(this.serviceCall(entity, "test"));
  }

  async restore(): Promise<{ restored: string[]; skipped: string[] }> {
    const restored: string[] = [];
    const skipped: string[] = [];
    for (const [entityId, snapshot] of this.snapshots) {
      if (snapshot.domain === "scene") {
        skipped.push(entityId);
        continue;
      }
      try {
        await this.client.callService(this.restoreCall(snapshot));
        restored.push(entityId);
        this.snapshots.delete(entityId);
      } catch {
        skipped.push(entityId);
      }
    }
    return { restored, skipped };
  }

  private requireControllableEntity(entityId: string): AmbientEntity {
    const entity = this.client.entities.get(entityId);
    if (!entity || !entity.controllable || !isControllableAmbientDomain(entity.domain)) {
      throw new Error("Entity is unavailable or outside the controllable allowlist.");
    }
    if (!entity.available) throw new Error("Entity is currently unavailable.");
    return entity;
  }

  private captureSnapshot(entity: AmbientEntity): void {
    if (entity.domain !== "scene" && !this.snapshots.has(entity.id)) {
      this.snapshots.set(entity.id, structuredClone(entity));
    }
  }

  private serviceCall(entity: AmbientEntity, cue: AmbientCue | "test"): HomeAssistantServiceCall {
    if (entity.domain === "scene") {
      return { domain: "scene", service: "turn_on", entityId: entity.id };
    }
    if (entity.domain === "light") {
      const preset = lightPresets[cue];
      const serviceData: Record<string, unknown> = {
        brightness: preset.brightness,
        transition: cue === "wake.echo" ? 1 : 2,
      };
      if (entity.capabilities.includes("color")) serviceData.rgb_color = preset.rgb;
      return { domain: "light", service: "turn_on", entityId: entity.id, serviceData };
    }
    if (entity.domain === "fan") {
      return {
        domain: "fan",
        service: "turn_on",
        entityId: entity.id,
        serviceData: entity.capabilities.includes("percentage") ? { percentage: 25 } : undefined,
      };
    }
    return { domain: "switch", service: "turn_on", entityId: entity.id };
  }

  private restoreCall(entity: AmbientEntity): HomeAssistantServiceCall {
    if (entity.domain === "light") {
      if (entity.state !== "on") return { domain: "light", service: "turn_off", entityId: entity.id };
      return {
        domain: "light",
        service: "turn_on",
        entityId: entity.id,
        serviceData: {
          brightness: entity.attributes.brightness,
          rgb_color: entity.attributes.rgbColor,
          transition: 1,
        },
      };
    }
    if (entity.domain === "fan") {
      if (entity.state !== "on") return { domain: "fan", service: "turn_off", entityId: entity.id };
      return {
        domain: "fan",
        service: "turn_on",
        entityId: entity.id,
        serviceData: entity.attributes.percentage === undefined
          ? undefined
          : { percentage: entity.attributes.percentage },
      };
    }
    return {
      domain: "switch",
      service: entity.state === "on" ? "turn_on" : "turn_off",
      entityId: entity.id,
    };
  }

  private pruneProcessed(): void {
    const expiry = Date.now() - 30 * 60_000;
    for (const [requestId, timestamp] of this.processed) {
      if (timestamp < expiry || this.processed.size > 256) this.processed.delete(requestId);
    }
  }
}
