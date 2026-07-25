import { describe, expect, it } from "vitest";
import { CIPHER_NOTEBOOK_MAX_LENGTH, sanitizeCipherNote, sanitizeCipherNotes } from "@/src/stores/cipher-notebook-store";

describe("case cipher notebook", () => {
  it("normalizes line endings and caps notes without interpreting content", () => {
    expect(sanitizeCipherNote("A\r\nB\rC")).toBe("A\nB\nC");
    expect(sanitizeCipherNote("x".repeat(CIPHER_NOTEBOOK_MAX_LENGTH + 50))).toHaveLength(CIPHER_NOTEBOOK_MAX_LENGTH);
    expect(sanitizeCipherNote({ answer: "00:43" })).toBe("");
  });

  it("keeps only valid campaign-scoped string notes", () => {
    expect(sanitizeCipherNotes({
      "case-001": "13=M",
      "case-002": "97.3?",
      invalid: "discard",
      "case-003": 43,
      "case-004": "",
    })).toEqual({ "case-001": "13=M", "case-002": "97.3?" });
  });
});
