import { requireAuth } from "@/lib/auth";
import { extractTextWithOcrSpace } from "@/lib/ocrspace";
import { toApiError } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return toApiError("BAD_REQUEST", "Missing image file.");
    }

    const { text, language } = await extractTextWithOcrSpace(file);
    return Response.json({
      text,
      language
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return toApiError("UNAUTHORIZED", "Missing or invalid token.");
      }
      if (error.message === "FORBIDDEN") {
        return toApiError("FORBIDDEN", "Account is deactivated. Contact your administrator.");
      }
      if (error.message.includes("Missing OCR_SPACE_API_KEY")) {
        return toApiError("INTERNAL_ERROR", "OCR service key is missing.");
      }
      if (error.message.startsWith("OCR_SPACE_HTTP_")) {
        return toApiError("INTERNAL_ERROR", `OCR.space request failed (${error.message}).`);
      }
      return toApiError("INTERNAL_ERROR", `OCR failed: ${error.message}`);
    }
    return toApiError("INTERNAL_ERROR", "Failed to process OCR.");
  }
}
