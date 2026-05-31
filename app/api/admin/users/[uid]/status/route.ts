import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getAdminAuth } from "@/lib/firebase-admin";
import { setUserActiveState } from "@/lib/users";
import { toApiError } from "@/lib/utils";

const bodySchema = z.object({
  isActive: z.boolean()
});

export async function PATCH(request: Request, { params }: { params: { uid: string } }) {
  try {
    await requireAdmin(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return toApiError("BAD_REQUEST", "Invalid status payload.");
    }

    await setUserActiveState(params.uid, parsed.data.isActive);
    await getAdminAuth().updateUser(params.uid, { disabled: !parsed.data.isActive });
    return Response.json({ ok: true });
  } catch {
    return toApiError("FORBIDDEN", "Admin access required.");
  }
}
