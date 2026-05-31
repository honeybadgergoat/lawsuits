"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/LanguageProvider";

interface FieldReviewFormProps {
  fields: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

export function FieldReviewForm({ fields, onChange }: FieldReviewFormProps) {
  const { t } = useI18n();
  const keys = Object.keys(fields);

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">{t("fieldReview")}</h2>
      {keys.map((keyName) => {
        const value = fields[keyName];
        const isFlagged = value.trim().length < 3;
        const Element = value.length > 120 ? Textarea : Input;
        return (
          <div key={keyName} className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              {keyName}
              {isFlagged ? <span className="ml-2 text-xs text-amber-700">{t("needsReview")}</span> : null}
            </label>
            <Element
              className={isFlagged ? "border-amber-500" : ""}
              value={value}
              onChange={(event) =>
                onChange({
                  ...fields,
                  [keyName]: event.target.value
                })
              }
            />
          </div>
        );
      })}
    </Card>
  );
}
