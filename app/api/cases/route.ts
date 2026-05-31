import { requireAuth } from "@/lib/auth";
import { listCases } from "@/lib/cases";
import { toApiError } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const cases = await listCases({
      userId: auth.uid,
      role: auth.user.role,
      status: status === "DRAFT" || status === "COMPLETED" ? status : undefined
    });
    return Response.json({ cases });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return toApiError("UNAUTHORIZED", "Missing or invalid token.");
    }
    return toApiError("FORBIDDEN", "Account is deactivated. Contact your administrator.");
  }
}
