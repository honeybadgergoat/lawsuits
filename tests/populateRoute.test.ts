import { describe, expect, it } from "vitest";
import { buildExtractionPrompt } from "@/lib/gemini";

describe("populate prompt builder", () => {
  it("includes field list, hints and OCR text", () => {
    const prompt = buildExtractionPrompt(
      ["CLIENT_NAME", "CASE_NUMBER"],
      "OCR CONTENT",
      { CLIENT_NAME: "Full name" }
    );

    expect(prompt).toContain("CLIENT_NAME");
    expect(prompt).toContain("Full name");
    expect(prompt).toContain("CASE_NUMBER");
    expect(prompt).toContain("OCR CONTENT");
    expect(prompt).toContain("Return valid JSON only");
  });
});
