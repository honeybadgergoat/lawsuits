import { describe, expect, it } from "vitest";
import { toApiError } from "@/lib/utils";

describe("auth guard error shape", () => {
  it("returns consistent unauthorized format", async () => {
    const response = toApiError("UNAUTHORIZED", "Missing or invalid token.");
    expect(response.status).toBe(401);
    const json = (await response.json()) as { error: { code: string; message: string } };
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toContain("token");
  });
});
