import { describe, expect, it } from "vitest";
import { a1z26Rows, getCipherReference, listCipherReferenceMappings, morseRows } from "@/src/content/cipher-references";
import { getCampaignCipherChallenges } from "@/src/content/ciphers";
import { campaignRegistry } from "@/src/content/campaigns/registry";

describe("cipher desk reference folio", () => {
  it("maps every registered cipher challenge to a general reference method", () => {
    const challengeIds = campaignRegistry.flatMap((campaign) => getCampaignCipherChallenges(campaign.id).map((challenge) => challenge.id));
    expect(challengeIds).toHaveLength(15);
    expect(Object.keys(listCipherReferenceMappings()).sort()).toEqual([...challengeIds].sort());
    for (const challengeId of challengeIds) expect(getCipherReference(challengeId)).toBeTruthy();
  });

  it("provides complete alphabets instead of answer-shaped lookup fragments", () => {
    expect(a1z26Rows.join(" ")).toContain("A 01");
    expect(a1z26Rows.join(" ")).toContain("Z 26");
    expect(morseRows.join(" ")).toContain("A ·−");
    expect(morseRows.join(" ")).toContain("Z −−··");
  });

  it("does not copy challenge answers or reveal titles into reference descriptions", () => {
    for (const campaign of campaignRegistry) {
      for (const challenge of getCampaignCipherChallenges(campaign.id)) {
        const reference = getCipherReference(challenge.id)!;
        const text = `${reference.title} ${reference.description}`.toLocaleUpperCase();
        expect(challenge.answerAliases.some((answer) => answer.length >= 4 && text.includes(answer.toLocaleUpperCase()))).toBe(false);
        expect(text).not.toContain(challenge.revealTitle.toLocaleUpperCase());
      }
    }
  });
});
