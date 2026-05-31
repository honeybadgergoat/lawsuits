"use client";

import { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";

interface OcrPreviewProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function OcrPreview({ label, value, onChange, placeholder }: OcrPreviewProps) {
  const isMostlyArabic = useMemo(() => {
    const letters = value.match(/[A-Za-z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ?? [];
    if (letters.length === 0) return false;
    const arabicLetters = value.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ?? [];
    return arabicLetters.length / letters.length >= 0.4;
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <Textarea
        className={`min-h-44 ${isMostlyArabic ? "text-right" : "text-left"}`}
        dir="auto"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
