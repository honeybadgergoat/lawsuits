import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getCaseById, softDeleteCase, upsertCase } from "@/lib/cases";
import { toApiError } from "@/lib/utils";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  fields: z.record(z.string()).optional()
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const item = await getCaseById(params.id, auth.uid, auth.user.role);
    if (!item) {
      return toApiError("NOT_FOUND", "Case not found.");
    }
    return Response.json({ case: item });
  } catch {
    return toApiError("FORBIDDEN", "Account is deactivated. Contact your administrator.");
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const existing = await getCaseById(params.id, auth.uid, auth.user.role);
    if (!existing) {
      return toApiError("NOT_FOUND", "Case not found.");
    }
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return toApiError("BAD_REQUEST", "Invalid case update payload.");
    }

    await upsertCase({
      caseId: existing.id,
      userId: existing.judgeId,
      role: auth.user.role,
      title: parsed.data.title ?? existing.title,
      rawOcrText: existing.rawOcrText,
      fields: parsed.data.fields ?? existing.extractedFields,
      notes: parsed.data.notes ?? existing.notes,
      status: existing.status
    });

    return Response.json({ ok: true });
  } catch {
    return toApiError("FORBIDDEN", "Account is deactivated. Contact your administrator.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    const existing = await getCaseById(params.id, auth.uid, auth.user.role);
    if (!existing) {
      return toApiError("NOT_FOUND", "Case not found.");
    }
    await softDeleteCase(existing.id);
    return Response.json({ ok: true });
  } catch {
    return toApiError("FORBIDDEN", "Account is deactivated. Contact your administrator.");
  }
}
