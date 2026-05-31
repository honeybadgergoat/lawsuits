"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { OcrPreview } from "@/components/OcrPreview";
import { extractTextFromImage } from "@/lib/ocr";
import { clientAuth } from "@/lib/firebase-client";
import { useI18n } from "@/components/LanguageProvider";

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
  const { t } = useI18n();
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
    setProgress(t("processingPage", { count: pageNumber }));
    try {
      const previewUrl = URL.createObjectURL(file);
      const token = await clientAuth.currentUser?.getIdToken();
      if (!token) {
        throw new Error(t("missingSession"));
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
      setError(nextError instanceof Error ? nextError.message : t("ocrFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4 border-0 bg-transparent p-0 shadow-none">
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

      <div className="text-xs text-slate-500">
        {loading ? progress : t("totalPages", { count: pages.length })}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="space-y-6">
        {pages.map((page, index) => (
          <div key={page.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="w-[85%] max-w-xl rounded-2xl rounded-br-md bg-blue-50/60 p-3">
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
                  <p className="text-xs text-slate-500">{t("noImageUploaded")}</p>
                )}
                <p className="mt-2 text-right text-xs text-slate-500">{t("pageNumber", { count: index + 1 })}</p>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="w-[90%] max-w-xl rounded-2xl rounded-bl-md bg-white/90 p-3">
                <OcrPreview
                  label={t("ocrOutput")}
                  value={page.text}
                  onChange={(next) =>
                    setPages((prev) =>
                      prev.map((item) => (item.id === page.id ? { ...item, text: next } : item))
                    )
                  }
                />
                <p className="mt-2 text-left text-xs text-slate-500">{t("assistant")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        disabled={pages.length >= 10 || loading}
        onClick={() => addPageInputRef.current?.click()}
      >
        {t("addPage")}
      </Button>
      <OcrPreview label={t("finalOcrText")} value={finalText} onChange={setFinalText} />
      <Button disabled={finalText.length < 50} onClick={() => onFinalize(finalText)}>
        {t("finalizeExtract")}
      </Button>
    </Card>
  );
}
