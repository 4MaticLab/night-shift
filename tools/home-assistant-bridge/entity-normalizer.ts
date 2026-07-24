import type { AmbientCapability, AmbientEntity } from "../../src/lib/ambient-hardware/types";
import { ambientDomainSchema, isControllableAmbientDomain } from "../../src/lib/ambient-hardware/types";

export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes?: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

function numberInRange(value: unknown, minimum: number, maximum: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : undefined;
}

function rgbColor(value: unknown): [number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 3) return undefined;
  const normalized = value.map((channel) => numberInRange(channel, 0, 255));
  if (normalized.some((channel) => channel === undefined)) return undefined;
  return normalized.map((channel) => Math.round(channel as number)) as [number, number, number];
}

export function normalizeHomeAssistantState(state: HomeAssistantState): AmbientEntity | null {
  const separator = state.entity_id.indexOf(".");
  if (separator < 1) return null;
  const parsedDomain = ambientDomainSchema.safeParse(state.entity_id.slice(0, separator));
  if (!parsedDomain.success) return null;

  const domain = parsedDomain.data;
  const attributes = state.attributes ?? {};
  const capabilities: AmbientCapability[] = [];

  if (domain === "scene") capabilities.push("activate");
  if (domain === "light") {
    capabilities.push("turn-on", "turn-off", "brightness");
    const colorModes = Array.isArray(attributes.supported_color_modes)
      ? attributes.supported_color_modes
      : [];
    if (colorModes.some((mode) => ["rgb", "rgbw", "rgbww", "hs", "xy"].includes(String(mode)))) {
      capabilities.push("color");
    }
  }
  if (domain === "switch") capabilities.push("turn-on", "turn-off");
  if (domain === "fan") {
    capabilities.push("turn-on", "turn-off");
    if (typeof attributes.percentage === "number") capabilities.push("percentage");
  }
  if (domain === "sensor" || domain === "binary_sensor") capabilities.push("read");

  const brightness = numberInRange(attributes.brightness, 0, 255);
  const percentage = numberInRange(attributes.percentage, 0, 100);
  const name = typeof attributes.friendly_name === "string" && attributes.friendly_name.trim()
    ? attributes.friendly_name.trim()
    : state.entity_id.slice(separator + 1).replaceAll("_", " ");

  return {
    id: state.entity_id,
    name,
    domain,
    state: String(state.state),
    available: state.state !== "unavailable" && state.state !== "unknown",
    controllable: isControllableAmbientDomain(domain),
    capabilities,
    attributes: {
      deviceClass: typeof attributes.device_class === "string" ? attributes.device_class : undefined,
      unit: typeof attributes.unit_of_measurement === "string" ? attributes.unit_of_measurement : undefined,
      brightness: brightness === undefined ? undefined : Math.round(brightness),
      rgbColor: rgbColor(attributes.rgb_color),
      percentage,
    },
  };
}
