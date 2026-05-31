import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { toApiError } from "@/lib/utils";

interface StatsRow {
  userId: string;
  name: string;
  aiCallsToday: number;
  aiCallsMonth: number;
  totalCasesMonth: number;
}

function monthStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = monthStart(now);
    const db = getAdminDb();

    const usersSnapshot = await db.collection("users").get();
    const rows: StatsRow[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();
      const [todayUsage, monthUsage, monthCases] = await Promise.all([
        db
          .collection("usageLogs")
          .where("userId", "==", userDoc.id)
          .where("createdAt", ">=", today)
          .get(),
        db
          .collection("usageLogs")
          .where("userId", "==", userDoc.id)
          .where("createdAt", ">=", month)
          .get(),
        db
          .collection("cases")
          .where("judgeId", "==", userDoc.id)
          .where("createdAt", ">=", month)
          .where("deletedAt", "==", null)
          .get()
      ]);

      rows.push({
        userId: userDoc.id,
        name: String(data.name ?? data.email ?? userDoc.id),
        aiCallsToday: todayUsage.size,
        aiCallsMonth: monthUsage.size,
        totalCasesMonth: monthCases.size
      });
    }

    return Response.json({ stats: rows });
  } catch {
    return toApiError("FORBIDDEN", "Admin access required.");
  }
}
