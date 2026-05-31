import { describe, expect, it } from "vitest";
import { buildFilename } from "@/app/api/export/docx/route";

describe("docx export filename", () => {
  it("uses client last name and date format", () => {
    const filename = buildFilename("Jane Smith");
    expect(filename).toMatch(/^case-Smith-\d{4}-\d{2}-\d{2}\.docx$/);
  });
});
