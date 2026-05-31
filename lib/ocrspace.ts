interface OcrSpaceParsedResult {
  ParsedText?: string;
  TextOverlay?: {
    Lines?: Array<{
      MinTop?: number;
      MaxHeight?: number;
      Words?: Array<{
        Left?: number;
        Top?: number;
        Height?: number;
        Width?: number;
        WordText?: string;
      }>;
    }>;
  };
}

interface OcrSpaceResponse {
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string[] | string;
  ParsedResults?: OcrSpaceParsedResult[];
}

export interface OcrSpaceExtractionResult {
  text: string;
  language: "ara" | "eng";
}

function getApiKey(): string {
  const key = process.env.OCR_SPACE_API_KEY || process.env.OCRSPACE_API_KEY;
  if (!key) {
    throw new Error("Missing OCR_SPACE_API_KEY (or OCRSPACE_API_KEY)");
  }
  return key;
}

function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\u0640/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    // OCR often inserts hard line wraps inside a single paragraph.
    // Keep true paragraph breaks (\n\n), but unwrap single line breaks.
    .replace(/([^\n])\n(?!\n)([^\n])/g, "$1 $2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractParsedText(payload: OcrSpaceResponse, preferRtl: boolean): string {
  const merged = (payload.ParsedResults ?? [])
    .map((item) => extractParsedResultText(item, preferRtl))
    .filter(Boolean)
    .join("\n")
    .trim();
  return normalizeText(merged);
}

function extractParsedResultText(result: OcrSpaceParsedResult, preferRtl: boolean): string {
  const overlayLines = result.TextOverlay?.Lines ?? [];
  if (overlayLines.length === 0) {
    return result.ParsedText ?? "";
  }

  const orderedLines = [...overlayLines].sort((a, b) => {
    const topA = a.MinTop ?? 0;
    const topB = b.MinTop ?? 0;
    if (Math.abs(topA - topB) <= 4) {
      return 0;
    }
    return topA - topB;
  });

  const textLines = orderedLines
    .map((line) => {
      const words = line.Words ?? [];
      if (words.length === 0) {
        return "";
      }

      const rawLine = words.map((word) => word.WordText ?? "").join(" ").trim();
      const lineArabicRatio = getArabicRatio(rawLine);
      const isRtlLine = preferRtl || lineArabicRatio >= 0.3;

      const sortedWords = [...words].sort((a, b) => {
        const leftA = a.Left ?? 0;
        const leftB = b.Left ?? 0;
        return isRtlLine ? leftB - leftA : leftA - leftB;
      });

      return sortedWords
        .map((word) => word.WordText ?? "")
        .filter(Boolean)
        .join(" ")
        .trim();
    })
    .filter(Boolean);

  if (textLines.length > 0) {
    return textLines.join("\n");
  }

  return result.ParsedText ?? "";
}

function getArabicRatio(text: string): number {
  const letters = text.match(/[A-Za-z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ?? [];
  if (letters.length === 0) return 0;
  const arabic = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ?? [];
  return arabic.length / letters.length;
}

async function postToOcrSpace(
  file: File,
  options: { language?: string; engine?: "1" | "2" | "3" }
): Promise<OcrSpaceResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (options.language) {
    formData.append("language", options.language);
  }
  if (options.engine) {
    formData.append("OCREngine", options.engine);
  }
  formData.append("isOverlayRequired", "true");
  formData.append("scale", "true");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      apikey: getApiKey()
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`OCR_SPACE_HTTP_${response.status}`);
  }

  return (await response.json()) as OcrSpaceResponse;
}

async function callOcrSpace(file: File, language: "ara" | "eng"): Promise<string> {
  const attempts: Array<{ language?: string; engine?: "1" | "2" | "3" }> =
    language === "ara"
      ? [
          { language: "ara", engine: "1" },
          { language: "ara", engine: "2" },
          { language: "auto", engine: "2" }
        ]
      : [
          { language: "eng", engine: "1" },
          { language: "eng", engine: "2" }
        ];

  let lastError = "OCR processing failed.";
  for (const attempt of attempts) {
    const payload = await postToOcrSpace(file, attempt);
    if (payload.IsErroredOnProcessing) {
      const message = Array.isArray(payload.ErrorMessage)
        ? payload.ErrorMessage.join(", ")
        : payload.ErrorMessage || "OCR processing failed.";
      lastError = message;
      if (String(message).includes("E201")) {
        continue;
      }
      throw new Error(message);
    }

    return extractParsedText(payload, language === "ara");
  }

  throw new Error(lastError);
}

/**
 * Extracts OCR text using OCR.space with Arabic-first strategy.
 * If Arabic result is weak/non-Arabic, it falls back to English OCR.
 */
export async function extractTextWithOcrSpace(file: File): Promise<OcrSpaceExtractionResult> {
  const arabicText = await callOcrSpace(file, "ara");
  const arabicRatio = getArabicRatio(arabicText);

  if (arabicText && arabicRatio >= 0.35) {
    return {
      text: arabicText,
      language: "ara"
    };
  }

  const englishText = await callOcrSpace(file, "eng");
  if (arabicText && arabicText.length >= englishText.length * 0.9) {
    return {
      text: arabicText,
      language: "ara"
    };
  }

  return {
    text: englishText || arabicText,
    language: englishText ? "eng" : "ara"
  };
}
