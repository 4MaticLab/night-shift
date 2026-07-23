import type {
  SandboxAction,
  SandboxCampaignContent,
  SandboxEnding,
  SandboxProgress,
  SandboxRequirement,
  SandboxResolution,
} from "./types";

export function createSandboxProgress(content: SandboxCampaignContent, reducedHorror = false): SandboxProgress {
  return {
    started: false,
    unlockedLocationIds: [],
    visitedLocationIds: [],
    completedActionIds: [],
    clueIds: [],
    handoutIds: [],
    itemIds: [],
    corruption: 0,
    threat: 0,
    npcStates: Object.fromEntries(content.npcs.map((npc) => [npc.id, "unknown"])),
    log: [],
    reducedHorror,
  };
}

export function startSandboxCampaign(
  content: SandboxCampaignContent,
  originId: string,
  reducedHorror = false,
): SandboxProgress {
  const origin = content.origins.find((item) => item.id === originId);
  if (!origin) return createSandboxProgress(content, reducedHorror);
  return {
    ...createSandboxProgress(content, reducedHorror),
    started: true,
    originId: origin.id,
    unlockedLocationIds: unique(origin.startingLocationIds),
    clueIds: unique(origin.startingClueIds),
    itemIds: unique(origin.startingItemIds),
  };
}

export function requirementMet(progress: SandboxProgress, requirement: SandboxRequirement | undefined): boolean {
  if (!requirement) return true;
  if (requirement.origins && (!progress.originId || !requirement.origins.includes(progress.originId))) return false;
  if (requirement.allClueIds?.some((id) => !progress.clueIds.includes(id))) return false;
  if (requirement.anyClueIds && !requirement.anyClueIds.some((id) => progress.clueIds.includes(id))) return false;
  if (requirement.allItemIds?.some((id) => !progress.itemIds.includes(id))) return false;
  if (requirement.allActionIds?.some((id) => !progress.completedActionIds.includes(id))) return false;
  if (requirement.anyActionIds && !requirement.anyActionIds.some((id) => progress.completedActionIds.includes(id))) return false;
  if (requirement.noneActionIds?.some((id) => progress.completedActionIds.includes(id))) return false;
  if (requirement.minThreat !== undefined && progress.threat < requirement.minThreat) return false;
  if (requirement.maxThreat !== undefined && progress.threat > requirement.maxThreat) return false;
  return true;
}

export function findSandboxAction(
  content: SandboxCampaignContent,
  actionId: string,
): { locationId: string; action: SandboxAction } | undefined {
  for (const location of content.locations) {
    const action = location.actions.find((item) => item.id === actionId);
    if (action) return { locationId: location.id, action };
  }
  return undefined;
}

export function resolveSandboxAction(
  content: SandboxCampaignContent,
  progress: SandboxProgress,
  actionId: string,
): SandboxResolution {
  const found = findSandboxAction(content, actionId);
  if (!found) return { ok: false, reason: "行动不存在。", progress };
  if (!progress.started || !progress.originId) return { ok: false, reason: "尚未选择调查入口。", progress };
  if (!progress.unlockedLocationIds.includes(found.locationId)) return { ok: false, reason: "这个地点尚未在地图上显影。", progress };
  if (progress.completedActionIds.includes(actionId)) return { ok: false, reason: "这段调查已经归档。", progress };
  if (!requirementMet(progress, found.action.requires)) return { ok: false, reason: found.action.requirementHint ?? "当前证据或准备不足。", progress };

  const corruptionDelta = found.action.effects.corruption ?? 0;
  const threatDelta = found.action.effects.threat ?? 0;
  const location = content.locations.find((item) => item.id === found.locationId)!;
  const entry: SandboxResolution["entry"] = {
    id: `${progress.log.length + 1}-${actionId}`,
    actionId,
    locationId: found.locationId,
    title: `${location.name} · ${found.action.title}`,
    result: progress.reducedHorror && found.action.reducedResult ? found.action.reducedResult : found.action.result,
    corruptionDelta,
    threatDelta,
  };
  const npcStates = { ...progress.npcStates };
  for (const effect of found.action.effects.npc ?? []) npcStates[effect.npcId] = effect.state;

  return {
    ok: true,
    entry,
    progress: {
      ...progress,
      unlockedLocationIds: unique([...progress.unlockedLocationIds, ...(found.action.effects.unlockLocationIds ?? [])]),
      visitedLocationIds: unique([...progress.visitedLocationIds, found.locationId]),
      completedActionIds: unique([...progress.completedActionIds, actionId]),
      clueIds: unique([...progress.clueIds, ...(found.action.effects.clueIds ?? [])]),
      handoutIds: unique([...progress.handoutIds, ...(found.action.effects.handoutIds ?? [])]),
      itemIds: unique([...progress.itemIds, ...(found.action.effects.itemIds ?? [])]),
      corruption: clamp(progress.corruption + corruptionDelta, 0, 7),
      threat: clamp(progress.threat + threatDelta, 0, 6),
      npcStates,
      log: [...progress.log, entry],
    },
  };
}

export function availableSandboxEndings(
  content: SandboxCampaignContent,
  progress: SandboxProgress,
): SandboxEnding[] {
  const available = content.endings.filter((ending) => requirementMet(progress, ending.requires));
  const terminal = available.filter((ending) => ending.terminal);
  return terminal.length > 0 ? terminal : available;
}

export function chooseSandboxEnding(
  content: SandboxCampaignContent,
  progress: SandboxProgress,
  endingId: string,
): SandboxProgress {
  const ending = availableSandboxEndings(content, progress).find((item) => item.id === endingId);
  return ending ? { ...progress, endingId } : progress;
}

export function assertSandboxCampaign(content: SandboxCampaignContent): SandboxCampaignContent {
  const locationIds = unique(content.locations.map((item) => item.id));
  const clueIds = unique(content.clues.map((item) => item.id));
  const handoutIds = unique(content.handouts.map((item) => item.id));
  const itemIds = unique(content.items.map((item) => item.id));
  const npcIds = unique(content.npcs.map((item) => item.id));
  const actionIds = unique(content.locations.flatMap((location) => location.actions.map((action) => action.id)));
  if (locationIds.length !== content.locations.length) throw new Error(`Sandbox ${content.title} has duplicate location ids`);
  if (clueIds.length !== content.clues.length) throw new Error(`Sandbox ${content.title} has duplicate clue ids`);
  if (handoutIds.length !== content.handouts.length) throw new Error(`Sandbox ${content.title} has duplicate handout ids`);
  if (itemIds.length !== content.items.length) throw new Error(`Sandbox ${content.title} has duplicate item ids`);
  if (npcIds.length !== content.npcs.length) throw new Error(`Sandbox ${content.title} has duplicate npc ids`);
  if (actionIds.length !== content.locations.flatMap((location) => location.actions).length) throw new Error(`Sandbox ${content.title} has duplicate action ids`);
  if (content.origins.length < 2) throw new Error(`Sandbox ${content.title} needs at least two origins`);
  if (content.corruptionStages.map((stage) => stage.stage).join(",") !== "0,1,2,3,4,5,6,7") {
    throw new Error(`Sandbox ${content.title} needs corruption stages 0-7`);
  }

  const assertIds = (values: string[] | undefined, valid: string[], label: string) => {
    for (const value of values ?? []) if (!valid.includes(value)) throw new Error(`Sandbox ${content.title} ${label} references ${value}`);
  };
  for (const origin of content.origins) {
    assertIds(origin.startingLocationIds, locationIds, "origin location");
    assertIds(origin.startingClueIds, clueIds, "origin clue");
    assertIds(origin.startingItemIds, itemIds, "origin item");
  }
  for (const location of content.locations) {
    for (const action of location.actions) {
      assertIds(action.effects.clueIds, clueIds, "action clue");
      assertIds(action.effects.handoutIds, handoutIds, "action handout");
      assertIds(action.effects.itemIds, itemIds, "action item");
      assertIds(action.effects.unlockLocationIds, locationIds, "action location");
      assertIds(action.requires?.allClueIds, clueIds, "requirement clue");
      assertIds(action.requires?.anyClueIds, clueIds, "requirement clue");
      assertIds(action.requires?.allItemIds, itemIds, "requirement item");
      assertIds(action.requires?.allActionIds, actionIds, "requirement action");
      assertIds(action.requires?.anyActionIds, actionIds, "requirement action");
      assertIds(action.requires?.noneActionIds, actionIds, "requirement action");
      for (const effect of action.effects.npc ?? []) if (!npcIds.includes(effect.npcId)) throw new Error(`Sandbox ${content.title} action npc references ${effect.npcId}`);
    }
  }
  for (const clue of content.clues) assertIds(clue.relatedIds, clueIds, "clue relation");
  for (const ending of content.endings) {
    assertIds(ending.requires.allClueIds, clueIds, "ending clue");
    assertIds(ending.requires.anyClueIds, clueIds, "ending clue");
    assertIds(ending.requires.allItemIds, itemIds, "ending item");
    assertIds(ending.requires.allActionIds, actionIds, "ending action");
    assertIds(ending.requires.anyActionIds, actionIds, "ending action");
    assertIds(ending.requires.noneActionIds, actionIds, "ending action");
  }
  return content;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
