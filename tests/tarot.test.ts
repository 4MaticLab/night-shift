import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getLocalDateKey,
  getTarotCard,
  getTarotRecordKey,
  nightOmenCards,
  selectDailyTarot,
} from "@/src/content/tarot";

describe("night omen tarot draw", () => {
  it("defines an original, non-scoring deck backed by reviewed artwork", () => {
    expect(nightOmenCards).toHaveLength(9);
    expect(new Set(nightOmenCards.map((card) => card.id))).toHaveLength(nightOmenCards.length);
    expect(new Set(nightOmenCards.map((card) => card.number))).toHaveLength(nightOmenCards.length);

    for (const card of nightOmenCards) {
      expect(card).not.toHaveProperty("rarity");
      expect(card).not.toHaveProperty("reward");
      expect(card.upright.zh.length).toBeGreaterThan(30);
      expect(card.reversed.zh.length).toBeGreaterThan(30);
      expect(existsSync(join(process.cwd(), "public", card.assetSrc))).toBe(true);
      expect(getTarotCard(card.id)).toBe(card);
    }
  });

  it("returns a stable card and orientation for one campaign day", () => {
    const first = selectDailyTarot("case-001", "2026-07-24", 430043, "2026-07-24T08:00:00.000Z");
    const repeated = selectDailyTarot("case-001", "2026-07-24", 430043, "2026-07-24T22:00:00.000Z");

    expect(repeated.cardId).toBe(first.cardId);
    expect(repeated.orientation).toBe(first.orientation);
    expect(first.campaignId).toBe("case-001");
    expect(first.dateKey).toBe("2026-07-24");
    expect(["upright", "reversed"]).toContain(first.orientation);
  });

  it("separates records by campaign and local calendar date", () => {
    const base = selectDailyTarot("case-001", "2026-07-24", 430043, "2026-07-24T08:00:00.000Z");
    const nextDay = selectDailyTarot("case-001", "2026-07-25", 430043, "2026-07-25T08:00:00.000Z");
    const otherCampaign = selectDailyTarot("case-002", "2026-07-24", 430043, "2026-07-24T08:00:00.000Z");

    expect(getTarotRecordKey(base.campaignId, base.dateKey)).toBe("case-001|2026-07-24");
    expect(getTarotRecordKey(nextDay.campaignId, nextDay.dateKey)).not.toBe(getTarotRecordKey(base.campaignId, base.dateKey));
    expect(getTarotRecordKey(otherCampaign.campaignId, otherCampaign.dateKey)).not.toBe(getTarotRecordKey(base.campaignId, base.dateKey));
  });

  it("uses the device-local calendar day instead of a UTC slice", () => {
    const localDate = new Date(2026, 0, 2, 0, 5, 0);
    expect(getLocalDateKey(localDate)).toBe("2026-01-02");
  });
});
