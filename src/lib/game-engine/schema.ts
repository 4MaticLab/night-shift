import { z } from "zod";

export const sleepQualitySchema = z.enum(["interrupted", "regular", "restful"]);
export type SleepQuality = z.infer<typeof sleepQualitySchema>;

export const sleepModeSchema = z.enum(["demo", "real"]);
export type SleepMode = z.infer<typeof sleepModeSchema>;

export const sleepSessionSchema = z.object({
  id: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  quality: sleepQualitySchema,
  mode: sleepModeSchema,
});
export type SleepSession = z.infer<typeof sleepSessionSchema>;

export const clueSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  detail: z.string(),
  type: z.enum(["person", "place", "object", "event", "contradiction"]),
  chapter: z.number().int().min(1).max(5),
  relatedIds: z.array(z.string()),
});
export type Clue = z.infer<typeof clueSchema>;

export const evidenceRelationSchema = z.object({
  id: z.string(),
  clueIds: z.tuple([z.string(), z.string()]),
  statement: z.string(),
  explanation: z.string(),
});
export type EvidenceRelation = z.infer<typeof evidenceRelationSchema>;

export const collectibleSchema = z.object({
  id: z.string(),
  title: z.string(),
  glyph: z.string(),
  assetId: z.string(),
  surfaceDescription: z.string(),
  revealedDescription: z.string(),
  district: z.string(),
  rarity: z.enum(["common", "unusual", "rare"]),
  chapter: z.number().int().min(1).max(5),
});
export type Collectible = z.infer<typeof collectibleSchema>;

export const chapterSchema = z.object({
  number: z.number().int().min(1).max(5),
  title: z.string(),
  subtitle: z.string(),
  cityAside: z.string(),
  question: z.string(),
  choices: z.array(z.object({ id: z.string(), label: z.string(), note: z.string() })).length(3),
  clueIds: z.array(z.string()).min(1),
  collectibleIds: z.array(z.string()).min(1),
  route: z.array(z.string()).min(3),
  events: z.array(z.string()).min(5),
  journal: z.string(),
  contradiction: z.string(),
});
export type Chapter = z.infer<typeof chapterSchema>;

export const caseSchema = z.object({
  id: z.string(),
  title: z.string(),
  englishTitle: z.string(),
  chapters: z.array(chapterSchema).length(5),
  clues: z.array(clueSchema).length(12),
  collectibles: z.array(collectibleSchema).length(8),
}).superRefine((data, ctx) => {
  const clueIds = new Set(data.clues.map((item) => item.id));
  const collectibleIds = new Set(data.collectibles.map((item) => item.id));
  data.chapters.forEach((chapter, chapterIndex) => {
    chapter.clueIds.forEach((id) => {
      if (!clueIds.has(id)) ctx.addIssue({ code: "custom", path: ["chapters", chapterIndex, "clueIds"], message: `Unknown clue: ${id}` });
    });
    chapter.collectibleIds.forEach((id) => {
      if (!collectibleIds.has(id)) ctx.addIssue({ code: "custom", path: ["chapters", chapterIndex, "collectibleIds"], message: `Unknown collectible: ${id}` });
    });
  });
});
