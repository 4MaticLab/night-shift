import { z } from "zod";

export const sleepQualitySchema = z.enum(["interrupted", "regular", "restful"]);
export type SleepQuality = z.infer<typeof sleepQualitySchema>;

export const sleepModeSchema = z.enum(["demo", "real"]);
export type SleepMode = z.infer<typeof sleepModeSchema>;

export const cityWatchIdSchema = z.enum(["lamplighting", "midnight", "last-watch", "daylight"]);
export type CityWatchId = z.infer<typeof cityWatchIdSchema>;

export const cityWatchSchema = z.object({
  id: cityWatchIdSchema,
  label: z.string(),
  archiveLabel: z.string(),
  window: z.string(),
  description: z.string().min(20),
});
export type CityWatch = z.infer<typeof cityWatchSchema>;

export const cityWatchEchoSchema = z.object({
  chapter: z.number().int().min(1).max(5),
  watchId: cityWatchIdSchema,
  scene: z.string().min(20),
  encounter: z.string().min(15),
  fieldNote: z.string().min(20),
});
export type CityWatchEcho = z.infer<typeof cityWatchEchoSchema>;

export const wakeEchoIdSchema = z.enum(["sleep-gap-01", "sleep-gap-02", "sleep-gap-03", "sleep-gap-04", "sleep-gap-05"]);
export type WakeEchoId = z.infer<typeof wakeEchoIdSchema>;

export const wakeEchoSchema = z.object({
  id: wakeEchoIdSchema,
  chapter: z.number().int().min(1).max(5),
  title: z.string().min(4),
  sound: z.string().min(15),
  glimpse: z.string().min(20),
  fieldNote: z.string().min(20),
});
export type WakeEcho = z.infer<typeof wakeEchoSchema>;

export const wakeEchoRecordSchema = z.object({
  echoId: wakeEchoIdSchema,
  recordedAt: z.string().datetime(),
});
export type WakeEchoRecord = z.infer<typeof wakeEchoRecordSchema>;

export const sleepSessionSchema = z.object({
  id: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  quality: sleepQualitySchema,
  mode: sleepModeSchema,
  watchId: cityWatchIdSchema,
  wakeEcho: wakeEchoRecordSchema.optional(),
});
export type SleepSession = z.infer<typeof sleepSessionSchema>;

export const clueSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  detail: z.string(),
  cityObjection: z.string().min(20),
  marginNote: z.string().min(12),
  type: z.enum(["person", "place", "object", "event", "contradiction"]),
  chapter: z.number().int().min(1).max(5),
  relatedIds: z.array(z.string()),
});
export type Clue = z.infer<typeof clueSchema>;

export const boardPositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});
export type BoardPosition = z.infer<typeof boardPositionSchema>;

export const evidenceRelationSchema = z.object({
  id: z.string(),
  clueIds: z.tuple([z.string(), z.string()]),
  statement: z.string(),
  explanation: z.string(),
});
export type EvidenceRelation = z.infer<typeof evidenceRelationSchema>;

export const endingEpilogueSchema = z.object({
  id: z.enum(["public", "protect", "return"]),
  archiveLabel: z.string(),
  title: z.string(),
  theme: z.string(),
  result: z.string().min(30),
  detectiveLetter: z.string().min(80),
  closingLine: z.string().min(12),
});
export type EndingEpilogue = z.infer<typeof endingEpilogueSchema>;

export const journeyPostcardSchema = z.object({
  id: z.string(),
  chapter: z.number().int().min(1).max(5),
  assetId: z.string(),
  title: z.string(),
  location: z.string(),
  cityRumor: z.string(),
  message: z.string(),
  preparationNotes: z.object({
    "side-lamp": z.string(),
    "flower-note": z.string(),
    "tram-fare": z.string(),
  }),
});
export type JourneyPostcard = z.infer<typeof journeyPostcardSchema>;

export const routeDirectionSchema = z.object({
  id: z.string(),
  chapter: z.number().int().min(1).max(5),
  choiceId: z.string(),
  dispatchTitle: z.string(),
  departureIntent: z.string(),
  destination: z.string(),
  routeNodes: z.array(z.string()).length(4),
  events: z.array(z.string()).length(5),
  cityEncounter: z.string(),
  returnLetter: z.string(),
  mapVariant: z.enum(["river", "market", "heights"]),
  societyId: z.enum(["misfiled-registry", "mislaid-consulate", "afterlight-cartographers"]),
  societyNotice: z.string(),
});
export type RouteDirection = z.infer<typeof routeDirectionSchema>;

export const societyIdSchema = z.enum(["misfiled-registry", "mislaid-consulate", "afterlight-cartographers"]);
export type SocietyId = z.infer<typeof societyIdSchema>;

export const societyStandingSchema = z.enum(["noticed", "known", "entrusted"]);
export type SocietyStanding = z.infer<typeof societyStandingSchema>;

export const citySocietySchema = z.object({
  id: societyIdSchema,
  assetId: z.string(),
  name: z.string(),
  archiveName: z.string(),
  concern: z.string(),
  publicRumor: z.string(),
  privateRule: z.string(),
  signoff: z.string(),
  titles: z.object({ noticed: z.string(), known: z.string(), entrusted: z.string() }),
  letters: z.object({ noticed: z.string(), known: z.string(), entrusted: z.string() }),
});
export type CitySociety = z.infer<typeof citySocietySchema>;

export const societyMemoryRecordSchema = z.object({
  chapter: z.number().int().min(1).max(5),
  choiceId: z.string(),
  societyId: societyIdSchema,
  standing: societyStandingSchema,
  completedAt: z.string().datetime(),
});
export type SocietyMemoryRecord = z.infer<typeof societyMemoryRecordSchema>;

export const correspondenceStanceSchema = z.enum(["shelter", "restore", "witness"]);
export type CorrespondenceStance = z.infer<typeof correspondenceStanceSchema>;

export const correspondenceReplySchema = z.object({
  id: z.string(),
  label: z.string(),
  note: z.string(),
  stance: correspondenceStanceSchema,
  summary: z.string(),
  echo: z.string(),
});
export type CorrespondenceReply = z.infer<typeof correspondenceReplySchema>;

export const correspondencePromptSchema = z.object({
  id: z.string(),
  societyId: societyIdSchema,
  standing: societyStandingSchema,
  context: z.string(),
  question: z.string(),
  replies: z.tuple([correspondenceReplySchema, correspondenceReplySchema]),
});
export type CorrespondencePrompt = z.infer<typeof correspondencePromptSchema>;

export const correspondenceRecordSchema = z.object({
  chapter: z.number().int().min(1).max(5),
  promptId: z.string(),
  societyId: societyIdSchema,
  standing: societyStandingSchema,
  replyId: z.string(),
  stance: correspondenceStanceSchema,
  repliedAt: z.string().datetime(),
});
export type CorrespondenceRecord = z.infer<typeof correspondenceRecordSchema>;

export const souvenirSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  name: z.string(),
  archiveName: z.string(),
  societyId: societyIdSchema,
  preparationAffinity: z.enum(["side-lamp", "flower-note", "tram-fare"]),
  provenance: z.string(),
  fieldNote: z.string(),
  cityRumor: z.string(),
});
export type Souvenir = z.infer<typeof souvenirSchema>;

export const souvenirRecordSchema = z.object({
  chapter: z.number().int().min(1).max(5),
  souvenirId: z.string(),
  choiceId: z.string(),
  preparationId: z.enum(["side-lamp", "flower-note", "tram-fare"]),
  journeySeed: z.number().int().nonnegative(),
  foundAt: z.string().datetime(),
});
export type SouvenirRecord = z.infer<typeof souvenirRecordSchema>;

export const opportunityResponseSchema = z.object({
  id: z.string(),
  label: z.string(),
  note: z.string(),
  result: z.string(),
  echo: z.string(),
});
export type OpportunityResponse = z.infer<typeof opportunityResponseSchema>;

export const opportunityNoticeSchema = z.object({
  id: z.string(),
  category: z.enum(["misfiled-registry", "mislaid-consulate", "afterlight-cartographers", "citizen"]),
  title: z.string(),
  location: z.string(),
  sender: z.string(),
  hook: z.string(),
  detail: z.string(),
  responses: z.tuple([opportunityResponseSchema, opportunityResponseSchema]),
});
export type OpportunityNotice = z.infer<typeof opportunityNoticeSchema>;

export const opportunityRecordSchema = z.object({
  chapter: z.number().int().min(2).max(5),
  offeredIds: z.tuple([z.string(), z.string(), z.string()]),
  noticeId: z.string().optional(),
  responseId: z.string().optional(),
  dismissed: z.boolean(),
  resolvedAt: z.string().datetime(),
});
export type OpportunityRecord = z.infer<typeof opportunityRecordSchema>;

export const caseCharacterSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  name: z.string(),
  archiveName: z.string(),
  role: z.string(),
  district: z.string(),
  encounterChapter: z.number().int().min(2).max(5),
  publicRumor: z.string(),
  knownFact: z.string(),
  withheld: z.string(),
  quote: z.string(),
  revealClueIds: z.array(z.string()).min(1),
});
export type CaseCharacter = z.infer<typeof caseCharacterSchema>;

export const cityDistrictSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  name: z.string(),
  archiveName: z.string(),
  subtitle: z.string(),
  introducedChapter: z.number().int().min(1).max(5),
  publicVersion: z.string(),
  cityRule: z.string(),
  landmarks: z.array(z.string()).length(3),
});
export type CityDistrict = z.infer<typeof cityDistrictSchema>;

export const growthStageSchema = z.enum(["seed", "sprout", "leaf", "bloom"]);
export type GrowthStage = z.infer<typeof growthStageSchema>;

export const nightBotanicalSchema = z.object({
  id: z.string(),
  chapter: z.number().int().min(1).max(5),
  assetId: z.string(),
  name: z.string(),
  archiveName: z.string(),
  district: z.string(),
  cityRumor: z.string(),
  specimenNote: z.string(),
  growthStages: z.object({ seed: z.string(), sprout: z.string(), leaf: z.string(), bloom: z.string() }),
  qualityNotes: z.object({ interrupted: z.string(), regular: z.string(), restful: z.string() }),
});
export type NightBotanical = z.infer<typeof nightBotanicalSchema>;

export const nightGrowthRecordSchema = z.object({
  chapter: z.number().int().min(1).max(5),
  quality: sleepQualitySchema,
  durationMinutes: z.number().int().nonnegative(),
  choiceId: z.string(),
  preparationId: z.enum(["side-lamp", "flower-note", "tram-fare"]),
  watchId: cityWatchIdSchema,
  wakeEchoId: wakeEchoIdSchema.optional(),
  completedAt: z.string().datetime(),
});
export type NightGrowthRecord = z.infer<typeof nightGrowthRecordSchema>;

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
