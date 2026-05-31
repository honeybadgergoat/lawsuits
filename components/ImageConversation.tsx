"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { OcrPreview } from "@/components/OcrPreview";
import { extractTextFromImage } from "@/lib/ocr";
import { clientAuth } from "@/lib/firebase-client";

interface ConversationPage {
  id: string;
  file?: File;
  previewUrl?: string;
  text: string;
}

interface ImageConversationProps {
  onFinalize: (fullText: string) => void;
}

export function ImageConversation({ onFinalize }: ImageConversationProps) {
  const [pages, setPages] = useState<ConversationPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("Idle");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState("");
  const addPageInputRef = useRef<HTMLInputElement>(null);

  const fullText = useMemo(() => pages.map((page) => page.text.trim()).join("\n\n").trim(), [pages]);

  useEffect(() => {
    setFinalText(fullText);
  }, [fullText]);

  async function handleFileSelect(file: File, pageId: string, pageNumber: number) {
    setLoading(true);
    setError("");
    setProgress(`Processing page ${pageNumber}`);
    try {
      const previewUrl = URL.createObjectURL(file);
      const token = await clientAuth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Missing auth session. Please sign in again.");
      }

      const text = await extractTextFromImage(file, token, (status) => {
        setProgress(`${status.status} ${(status.progress * 100).toFixed(0)}%`);
      });

      setPages((prev) =>
        prev.map((item) =>
          item.id === pageId
            ? {
                ...item,
                file,
                previewUrl,
                text
              }
            : item
        )
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to extract OCR text.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">OCR conversation</h2>
        <p className="text-sm text-slate-600">
          Final text stays at the top. Add new pages with one button (upload or camera).
        </p>
      </div>

      <Input
        ref={addPageInputRef}
        type="file"
        accept="image/*;capture=camera"
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) {
            const pageId = crypto.randomUUID();
            const pageNumber = pages.length + 1;
            setPages((prev) => [...prev, { id: pageId, text: "" }]);
            void handleFileSelect(selected, pageId, pageNumber);
          }
          event.currentTarget.value = "";
        }}
      />

      <div className="text-xs text-slate-500">{loading ? progress : `Total pages: ${pages.length}`}</div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="space-y-6">
        {pages.map((page, index) => (
          <div key={page.id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-700">Page {index + 1}</h3>
            {page.previewUrl ? (
              <Image
                src={page.previewUrl}
                alt={`Page ${index + 1}`}
                className="max-h-80 w-full rounded-md object-contain"
                width={800}
                height={1000}
                unoptimized
              />
            ) : (
              <p className="text-xs text-slate-500">No image uploaded yet.</p>
            )}
            <OcrPreview
              label="Extracted OCR text"
              value={page.text}
              onChange={(next) =>
                setPages((prev) => prev.map((item) => (item.id === page.id ? { ...item, text: next } : item)))
              }
            />
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        disabled={pages.length >= 10 || loading}
        onClick={() => addPageInputRef.current?.click()}
      >
        Add new page (upload or camera)
      </Button>
      <OcrPreview label="Final concatenated OCR text" value={finalText} onChange={setFinalText} />
      <Button disabled={finalText.length < 50} onClick={() => onFinalize(finalText)}>
        Finalize and extract fields
      </Button>
    </Card>
  );
}
