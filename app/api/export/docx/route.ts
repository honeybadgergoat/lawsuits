import { format } from "date-fns";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { readCaseTemplate, renderTemplate } from "@/lib/docx";
import { upsertCase } from "@/lib/cases";
import { toApiError } from "@/lib/utils";

const bodySchema = z.object({
  caseId: z.string().optional(),
  title: z.string().min(1),
  rawOcrText: z.string().min(1),
  fields: z.record(z.string()).refine((input) => Object.keys(input).length > 0),
  notes: z.string().optional().default("")
});

export function buildFilename(clientName: string): string {
  const safeLastName = clientName.trim().split(/\s+/).slice(-1)[0] || "client";
  return `case-${safeLastName}-${format(new Date(), "yyyy-MM-dd")}.docx`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return toApiError("BAD_REQUEST", "Invalid export payload.");
    }

    const template = await readCaseTemplate();
    const buffer = renderTemplate(template, parsed.data.fields);
    const caseId = await upsertCase({
      caseId: parsed.data.caseId,
      userId: auth.uid,
      role: auth.user.role,
      title: parsed.data.title,
      rawOcrText: parsed.data.rawOcrText,
      fields: parsed.data.fields,
      notes: parsed.data.notes,
      status: "COMPLETED"
    });

    const filename = buildFilename(parsed.data.fields.CLIENT_NAME ?? "client");
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "x-filename": filename,
        "x-case-id": caseId
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return toApiError("UNAUTHORIZED", "Missing or invalid token.");
      }
      if (error.message === "FORBIDDEN") {
        return toApiError("FORBIDDEN", "Account is deactivated. Contact your administrator.");
      }
    }
    return toApiError("INTERNAL_ERROR", "Failed to export docx.");
  }
}
