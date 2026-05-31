import { getAdminDb } from "@/lib/firebase-admin";
import { UsageSummary } from "@/lib/types";

/**
 * Pure helper for deterministic limit checks.
 */
export function canUseDailyQuota(todayCount: number, dailyLimit: number): boolean {
  return todayCount < dailyLimit;
}

/**
 * Counts today's AI calls for a user and enforces daily limit.
 */
export async function enforceDailyAiLimit(
  userId: string,
  dailyLimit: number
): Promise<UsageSummary> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const usageCollection = getAdminDb().collection("usageLogs");

  const snapshot = await usageCollection
    .where("userId", "==", userId)
    .where("action", "==", "AI_POPULATE")
    .where("createdAt", ">=", startOfDay)
    .get();

  const today = snapshot.size;
  if (!canUseDailyQuota(today, dailyLimit)) {
    throw new Error("LIMIT_REACHED");
  }

  return { today, dailyLimit };
}

/**
 * Logs successful AI usage event.
 */
export async function logAiUsage(userId: string): Promise<void> {
  await getAdminDb().collection("usageLogs").add({
    userId,
    action: "AI_POPULATE",
    createdAt: new Date()
  });
}
