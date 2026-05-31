"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { OcrPreview } from "@/components/OcrPreview";
import { extractTextFromImage } from "@/lib/ocr";

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
  const [pages, setPages] = useState<ConversationPage[]>([{ id: crypto.randomUUID(), text: "" }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("Idle");
  const [finalText, setFinalText] = useState("");

  const fullText = useMemo(() => pages.map((page) => page.text.trim()).join("\n\n").trim(), [pages]);
  const current = pages[activeIndex];

  useEffect(() => {
    setFinalText(fullText);
  }, [fullText]);

  async function handleFileSelect(file: File) {
    setLoading(true);
    setProgress(`Processing page ${activeIndex + 1}/${pages.length}`);
    const previewUrl = URL.createObjectURL(file);
    const text = await extractTextFromImage(file, (status) => {
      setProgress(`${status.status} ${(status.progress * 100).toFixed(0)}%`);
    });

    setPages((prev) =>
      prev.map((item, index) =>
        index === activeIndex
          ? {
              ...item,
              file,
              previewUrl,
              text
            }
          : item
      )
    );
    setLoading(false);
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Page {activeIndex + 1}</h2>
        <p className="text-sm text-slate-600">Upload one page, review OCR text, then continue.</p>
      </div>

      <Input
        type="file"
        accept="image/*;capture=camera"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) {
            void handleFileSelect(selected);
          }
        }}
      />

      {current.previewUrl ? (
        <Image
          src={current.previewUrl}
          alt={`Page ${activeIndex + 1}`}
          className="max-h-80 w-full rounded-md object-contain"
          width={800}
          height={1000}
          unoptimized
        />
      ) : null}

      <OcrPreview
        label="Extracted OCR text"
        value={current.text}
        onChange={(next) =>
          setPages((prev) => prev.map((item, index) => (index === activeIndex ? { ...item, text: next } : item)))
        }
      />

      <div className="text-xs text-slate-500">{loading ? progress : `Total pages: ${pages.length}`}</div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={activeIndex >= pages.length - 1}
          onClick={() => setActiveIndex((prev) => Math.min(prev + 1, pages.length - 1))}
        >
          Next
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (pages.length >= 10) return;
            setPages((prev) => [...prev, { id: crypto.randomUUID(), text: "" }]);
            setActiveIndex(pages.length);
          }}
        >
          Add page
        </Button>
        <Button
          variant="secondary"
          disabled={pages.length === 1}
          onClick={() => {
            setPages((prev) => prev.filter((_, idx) => idx !== activeIndex));
            setActiveIndex((prev) => Math.max(prev - 1, 0));
          }}
        >
          Remove page
        </Button>
      </div>

      <OcrPreview label="Final concatenated OCR text" value={finalText} onChange={setFinalText} />
      <Button disabled={finalText.length < 50} onClick={() => onFinalize(finalText)}>
        Finalize and extract fields
      </Button>
    </Card>
  );
}
