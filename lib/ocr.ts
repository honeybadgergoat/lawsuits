"use client";

export interface OcrProgress {
  status: string;
  progress: number;
}

/**
 * Runs OCR through server-side OCR.space API.
 */
export async function extractTextFromImage(
  file: File,
  firebaseIdToken: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  onProgress?.({ status: "Uploading image", progress: 0.2 });
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/ocr/extract", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firebaseIdToken}`
    },
    body: formData
  });

  onProgress?.({ status: "Processing OCR", progress: 0.8 });
  const payload = (await response.json()) as {
    text?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.text) {
    throw new Error(payload.error?.message ?? "OCR extraction failed.");
  }

  onProgress?.({ status: "Done", progress: 1 });
  return payload.text;
}
