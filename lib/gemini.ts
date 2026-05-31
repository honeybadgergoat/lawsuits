import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-pro";

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  return new GoogleGenerativeAI(key);
}

/**
 * Builds a strict JSON extraction prompt.
 */
export function buildExtractionPrompt(
  fields: string[],
  ocrText: string,
  fieldHints: Record<string, string>
): string {
  const fieldLines = fields
    .map((field) => `- ${field}: ${fieldHints[field] ?? "Extract from legal OCR context."}`)
    .join("\n");

  return [
    "You are assisting a judge. Extract values for template fields from OCR text.",
    "Return valid JSON only. No markdown. No extra keys.",
    "If unknown, return empty string for that field.",
    "Fields:",
    fieldLines,
    "OCR Text:",
    ocrText
  ].join("\n\n");
}

/**
 * Calls Gemini and returns parsed field map.
 */
export async function extractFieldsWithGemini(
  fields: string[],
  ocrText: string,
  fieldHints: Record<string, string>
): Promise<Record<string, string>> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const prompt = buildExtractionPrompt(fields, ocrText, fieldHints);
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const normalized = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  const parsed = JSON.parse(normalized) as Record<string, unknown>;
  const sanitized: Record<string, string> = {};
  for (const field of fields) {
    const value = parsed[field];
    sanitized[field] = typeof value === "string" ? value : "";
  }
  return sanitized;
}
