import { describe, expect, it } from "vitest";
import { nextCipherHintStage, type CipherHintStage } from "@/src/components/game/progressive-cipher-hints";

describe("progressive cipher hints", () => {
  it("reveals exactly one additional hint at a time and caps at two", () => {
    const stages: CipherHintStage[] = [0];
    stages.push(nextCipherHintStage(stages.at(-1)!));
    stages.push(nextCipherHintStage(stages.at(-1)!));
    stages.push(nextCipherHintStage(stages.at(-1)!));
    expect(stages).toEqual([0, 1, 2, 2]);
  });
});
