import { describe, expect, it } from "vitest";
import { canUseDailyQuota } from "@/lib/rateLimiter";

describe("daily quota helper", () => {
  it("allows calls below daily limit", () => {
    expect(canUseDailyQuota(3, 20)).toBe(true);
  });

  it("blocks calls at daily limit", () => {
    expect(canUseDailyQuota(20, 20)).toBe(false);
  });
});
