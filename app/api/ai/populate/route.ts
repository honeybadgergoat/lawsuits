import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { readCaseTemplate, extractTemplateFieldsFromBuffer } from "@/lib/docx";
import { extractFieldsWithGemini } from "@/lib/gemini";
import { enforceDailyAiLimit, logAiUsage } from "@/lib/rateLimiter";
import { toApiError } from "@/lib/utils";

const bodySchema = z.object({
  caseId: z.string().optional(),
  ocrText: z.string().min(50).max(80000),
  fieldHints: z.record(z.string()).default({})
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return toApiError("BAD_REQUEST", "Invalid populate payload.");
    }

    const usage = await enforceDailyAiLimit(auth.uid, auth.user.dailyLimit);
    const template = await readCaseTemplate();
    const templateFields = extractTemplateFieldsFromBuffer(template);

    const fields = await extractFieldsWithGemini(
      templateFields,
      parsed.data.ocrText,
      parsed.data.fieldHints
    );

    await logAiUsage(auth.uid);
    return Response.json({
      fields,
      usage: {
        today: usage.today + 1,
        dailyLimit: usage.dailyLimit
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
      if (error.message === "LIMIT_REACHED") {
        return toApiError(
          "LIMIT_REACHED",
          "Daily usage limit reached. Contact your administrator."
        );
      }
    }
    return toApiError("INTERNAL_ERROR", "Failed to populate fields.");
  }
}
