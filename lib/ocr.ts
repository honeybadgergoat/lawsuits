"use client";

import { createWorker } from "tesseract.js";

export interface OcrProgress {
  status: string;
  progress: number;
}

/**
 * Runs OCR in browser for a single image file.
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (onProgress) {
        onProgress({
          status: message.status,
          progress: message.progress ?? 0
        });
      }
    }
  });

  const output = await worker.recognize(file);
  await worker.terminate();
  return output.data.text.trim();
}
