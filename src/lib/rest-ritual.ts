import { z } from "zod";

export const REST_INTENTION_MAX_LENGTH = 160;
export const REST_REFLECTION_MAX_LENGTH = 240;

export const restRitualInputSchema = z.object({
  intention: z.string().trim().min(1).max(REST_INTENTION_MAX_LENGTH),
  aiRequested: z.boolean().default(false),
  locale: z.enum(["zh-CN", "en"]).default("zh-CN"),
});
export type RestRitualInput = z.infer<typeof restRitualInputSchema>;

export const restReflectionSourceSchema = z.enum(["local", "ai"]);
export type RestReflectionSource = z.infer<typeof restReflectionSourceSchema>;

export const restReflectionStatusSchema = z.enum(["local", "pending", "ai", "unavailable"]);
export type RestReflectionStatus = z.infer<typeof restReflectionStatusSchema>;

export const restReflectionReasonSchema = z.enum(["local-only", "generated", "not-configured", "access-required", "provider-error", "invalid-output"]);
export type RestReflectionReason = z.infer<typeof restReflectionReasonSchema>;

export const restRitualRecordSchema = z.object({
  requestId: z.string().uuid(),
  chapter: z.number().int().positive(),
  intention: z.string().trim().min(1).max(REST_INTENTION_MAX_LENGTH),
  aiRequested: z.boolean(),
  locale: z.enum(["zh-CN", "en"]).default("zh-CN"),
  reflection: z.string().trim().min(1).max(REST_REFLECTION_MAX_LENGTH),
  source: restReflectionSourceSchema,
  status: restReflectionStatusSchema,
  reason: restReflectionReasonSchema.optional(),
  createdAt: z.string().datetime(),
  reflectedAt: z.string().datetime(),
}).superRefine((record, ctx) => {
  if (record.status === "pending" && (!record.aiRequested || record.source !== "local" || record.reason)) {
    ctx.addIssue({ code: "custom", path: ["status"], message: "An AI request must be explicitly authorized and unresolved" });
  }
  if (record.status === "local" && (record.aiRequested || record.source !== "local" || record.reason !== "local-only")) {
    ctx.addIssue({ code: "custom", path: ["status"], message: "A local-only reflection cannot be an AI request" });
  }
  if (record.status === "ai" && (!record.aiRequested || record.source !== "ai" || record.reason !== "generated")) {
    ctx.addIssue({ code: "custom", path: ["status"], message: "An AI reflection must come from a successful authorized request" });
  }
  if (record.status === "unavailable" && (!record.aiRequested || record.source !== "local" || !record.reason || record.reason === "generated" || record.reason === "local-only")) {
    ctx.addIssue({ code: "custom", path: ["status"], message: "An unavailable reflection must preserve its fallback reason" });
  }
});
export type RestRitualRecord = z.infer<typeof restRitualRecordSchema>;

export const restReflectionRequestSchema = z.object({
  requestId: z.string().uuid(),
  locale: z.enum(["zh-CN", "en"]).default("zh-CN"),
  intention: z.string().trim().min(1).max(REST_INTENTION_MAX_LENGTH),
  campaignTitle: z.string().trim().min(1).max(120),
  chapterTitle: z.string().trim().min(1).max(120),
  direction: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(120),
  preparation: z.string().trim().min(1).max(80),
  detectiveName: z.string().trim().min(1).max(40),
});
export type RestReflectionRequest = z.infer<typeof restReflectionRequestSchema>;
type RestReflectionContext = Omit<RestReflectionRequest, "requestId">;

export const restReflectionResponseSchema = z.object({
  reflection: z.string().trim().min(1).max(REST_REFLECTION_MAX_LENGTH),
  source: restReflectionSourceSchema,
  reason: restReflectionReasonSchema.exclude(["local-only"]),
});
export type RestReflectionResponse = z.infer<typeof restReflectionResponseSchema>;

export const restReflectionStyleSchema = z.object({
  tone: z.enum(["gentle", "quiet", "steady"]),
  image: z.enum(["lamp", "paper", "rain"]),
});
export type RestReflectionStyle = z.infer<typeof restReflectionStyleSchema>;

export function createLocalRestReflection(input: RestReflectionContext): string {
  const parsed = restReflectionRequestSchema.omit({ requestId: true }).parse(input);
  const detectiveName = truncateText(parsed.detectiveName, 20);
  const preparation = truncateText(parsed.preparation, 24);
  const destination = truncateText(parsed.destination, 36);
  return parsed.locale === "en"
    ? `The note is tucked into the handoff. It does not need an answer tonight; ${detectiveName} will carry ${preparation} through the blank hours and bring back only what ${destination} truly yields.`
    : `纸条已经夹进交接单。今晚不必把它解决；${detectiveName}会带着${preparation}守住这段空白，清晨只把${destination}确实找到的东西带回来。`;
}

export function createRestRitualRecord(chapter: number, input: RestRitualInput, context: Omit<RestReflectionContext, "intention" | "locale">, now = new Date()): RestRitualRecord {
  const ritual = restRitualInputSchema.parse(input);
  const timestamp = now.toISOString();
  return restRitualRecordSchema.parse({
    chapter,
    requestId: crypto.randomUUID(),
    intention: ritual.intention,
    aiRequested: ritual.aiRequested,
    locale: ritual.locale,
    reflection: createLocalRestReflection({ ...context, intention: ritual.intention, locale: ritual.locale }),
    source: "local",
    status: ritual.aiRequested ? "pending" : "local",
    reason: ritual.aiRequested ? undefined : "local-only",
    createdAt: timestamp,
    reflectedAt: timestamp,
  });
}

export function createAiRestReflection(input: RestReflectionContext, style: RestReflectionStyle): string {
  const parsed = restReflectionRequestSchema.omit({ requestId: true }).parse(input);
  const selected = restReflectionStyleSchema.parse(style);
  if (parsed.locale === "en") {
    const opening = {
      gentle: "I have the note. It does not need to become an answer tonight",
      quiet: "The note is resting quietly in the night ledger. What remains unfinished can stop here for now",
      steady: "The night shift will hold this note for a while. You do not need to keep chasing it",
    }[selected.tone];
    const image = {
      lamp: `I will carry ${truncateText(parsed.preparation, 24)} and leave a lamp beside the blank hours`,
      paper: `I will let the pages of ${truncateText(parsed.destination, 36)} keep it until morning`,
      rain: `I will listen to the rain at ${truncateText(parsed.destination, 36)} and keep the investigation moving`,
    }[selected.image];
    return `${opening}. ${image}; at dawn, the next step is still yours to choose.`;
  }
  const opening = {
    gentle: "纸条收到了。今晚不必把它变成答案",
    quiet: "纸条已经安静地夹进夜班簿。未完成的事可以先停在这里",
    steady: "这张纸条由夜班暂时保管。现在不需要继续追赶它",
  }[selected.tone];
  const image = {
    lamp: `我会带着${truncateText(parsed.preparation, 24)}，替这段空白留一盏灯`,
    paper: `我会让${truncateText(parsed.destination, 36)}的纸页替它守到清晨`,
    rain: `我会听着${truncateText(parsed.destination, 36)}的雨声，把调查继续走完`,
  }[selected.image];
  return `${opening}。${image}；天亮后，你仍可以自己决定下一步。`;
}

function truncateText(value: string, maxLength: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}
