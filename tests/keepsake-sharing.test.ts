import { describe, expect, it } from "vitest";
import {
  createKeepsakeShareUrl,
  getShareableKeepsake,
  readSharedKeepsakeQuery,
  removeSharedKeepsakeQuery,
  sanitizeKeepsakeIds,
} from "@/src/lib/game-engine/keepsake-sharing";
import { souvenirs } from "@/src/content/souvenirs";

const KNOWN = souvenirs[0].id;
const KNOWN_2 = souvenirs[1].id;

describe("keepsake-sharing", () => {
  it("resolves only known souvenir ids", () => {
    expect(getShareableKeepsake(KNOWN)?.id).toBe(KNOWN);
    expect(getShareableKeepsake("not-a-souvenir")).toBeUndefined();
    expect(getShareableKeepsake(42)).toBeUndefined();
  });

  it("builds a clean share URL carrying only the keepsake id", () => {
    const url = createKeepsakeShareUrl("https://night-shift.example/?ref=1#frag", KNOWN);
    expect(url).toBe(`https://night-shift.example/keepsake?keepsake=${KNOWN}`);
  });

  it("throws when asked to share an unknown keepsake", () => {
    expect(() => createKeepsakeShareUrl("https://night-shift.example/", "nope")).toThrow();
  });

  it("reads a shared keepsake query", () => {
    expect(readSharedKeepsakeQuery(`?keepsake=${KNOWN}`)).toEqual({ present: true, keepsake: souvenirs[0] });
    expect(readSharedKeepsakeQuery("?keepsake=unknown")).toEqual({ present: true, keepsake: undefined });
    expect(readSharedKeepsakeQuery("?other=1")).toEqual({ present: false });
  });

  it("strips the keepsake query for a clean replace", () => {
    expect(removeSharedKeepsakeQuery(`https://night-shift.example/keepsake?keepsake=${KNOWN}&from=qr#x`)).toBe("/keepsake?from=qr#x");
  });

  it("sanitizes ids to known, de-duplicated, content order", () => {
    expect(sanitizeKeepsakeIds([KNOWN_2, "junk", KNOWN, KNOWN, 7])).toEqual([KNOWN, KNOWN_2]);
    expect(sanitizeKeepsakeIds("nope")).toEqual([]);
  });
});
