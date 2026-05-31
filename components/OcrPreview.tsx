"use client";

import { Textarea } from "@/components/ui/textarea";

interface OcrPreviewProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function OcrPreview({ label, value, onChange, placeholder }: OcrPreviewProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <Textarea
        className="min-h-44"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
