import { z } from "zod";

export const ambientCueSchema = z.enum([
  "night.started",
  "wake.echo",
  "morning.arrived",
]);

export const ambientDomainSchema = z.enum([
  "scene",
  "light",
  "switch",
  "fan",
  "sensor",
  "binary_sensor",
]);

export const ambientCapabilitySchema = z.enum([
  "activate",
  "turn-on",
  "turn-off",
  "brightness",
  "color",
  "percentage",
  "read",
]);

export const ambientEntitySchema = z.object({
  id: z.string().min(3).max(255),
  name: z.string().min(1).max(255),
  domain: ambientDomainSchema,
  state: z.string().max(255),
  available: z.boolean(),
  controllable: z.boolean(),
  capabilities: z.array(ambientCapabilitySchema),
  attributes: z.object({
    deviceClass: z.string().max(120).optional(),
    unit: z.string().max(40).optional(),
    brightness: z.number().int().min(0).max(255).optional(),
    rgbColor: z.tuple([
      z.number().int().min(0).max(255),
      z.number().int().min(0).max(255),
      z.number().int().min(0).max(255),
    ]).optional(),
    percentage: z.number().min(0).max(100).optional(),
  }),
});

export const ambientBindingsSchema = z.object({
  "night.started": z.string().min(3).max(255).nullable().optional(),
  "wake.echo": z.string().min(3).max(255).nullable().optional(),
  "morning.arrived": z.string().min(3).max(255).nullable().optional(),
});

export const ambientCueRequestSchema = z.object({
  requestId: z.string().min(8).max(255),
  cue: ambientCueSchema,
});

export const ambientTestRequestSchema = z.object({
  entityId: z.string().min(3).max(255),
});

export const ambientBridgeStatusSchema = z.object({
  bridge: z.literal("night-shift-home-assistant"),
  version: z.string(),
  paired: z.boolean(),
  homeAssistant: z.enum(["disabled", "connecting", "online", "offline", "auth-error"]),
  instanceName: z.string().optional(),
  entityCount: z.number().int().nonnegative(),
  lastError: z.string().optional(),
});

export const ambientBridgeEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("status"),
    status: ambientBridgeStatusSchema,
  }),
  z.object({
    type: z.literal("entity"),
    entity: ambientEntitySchema,
  }),
  z.object({
    type: z.literal("bindings"),
    bindings: ambientBindingsSchema,
  }),
]);

export type AmbientCue = z.infer<typeof ambientCueSchema>;
export type AmbientDomain = z.infer<typeof ambientDomainSchema>;
export type AmbientCapability = z.infer<typeof ambientCapabilitySchema>;
export type AmbientEntity = z.infer<typeof ambientEntitySchema>;
export type AmbientBindings = z.infer<typeof ambientBindingsSchema>;
export type AmbientCueRequest = z.infer<typeof ambientCueRequestSchema>;
export type AmbientBridgeStatus = z.infer<typeof ambientBridgeStatusSchema>;
export type AmbientBridgeEvent = z.infer<typeof ambientBridgeEventSchema>;

export const ambientCueLabels: Record<AmbientCue, { title: string; note: string }> = {
  "night.started": {
    title: "夜班出发",
    note: "进入夜行时激活选定场景或设备。",
  },
  "wake.echo": {
    title: "睡隙回声",
    note: "真实夜班记录醒转回声时给出一次温和回应。",
  },
  "morning.arrived": {
    title: "晨报抵达",
    note: "结束夜班、生成晨报时恢复更明亮的暖色。",
  },
};

export function isControllableAmbientDomain(
  domain: AmbientDomain,
): domain is "scene" | "light" | "switch" | "fan" {
  return domain === "scene" || domain === "light" || domain === "switch" || domain === "fan";
}
