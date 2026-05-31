"use client";

import { useState } from "react";
import { ImageConversation } from "@/components/ImageConversation";
import { FieldReviewForm } from "@/components/FieldReviewForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientAuth } from "@/lib/firebase-client";
import { useI18n } from "@/components/LanguageProvider";

type FlowStep = "OCR" | "FIELDS" | "EXPORT";

export default function NewCasePage() {
  const { t } = useI18n();
  const [step, setStep] = useState<FlowStep>("OCR");
  const [rawOcrText, setRawOcrText] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [caseId, setCaseId] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function authHeader(): Promise<HeadersInit> {
    const token = await clientAuth.currentUser?.getIdToken();
    if (!token) {
      throw new Error(t("missingSession"));
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }

  async function runFieldExtraction(fullText: string) {
    setLoading(true);
    setMessage("");
    setRawOcrText(fullText);
    try {
      const response = await fetch("/api/ai/populate", {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({
          caseId,
          ocrText: fullText,
          fieldHints: {
            CLIENT_NAME: "Full legal name of claimant",
            CASE_NUMBER: "Official court case number",
            HEARING_DATE: "Date of hearing",
            JUDGE_NAME: "Judge name",
            CASE_SUMMARY: "Concise case summary"
          }
        })
      });

      const payload = (await response.json()) as { fields?: Record<string, string>; error?: { message: string } };
      if (!response.ok || !payload.fields) {
        throw new Error(payload.error?.message ?? t("ocrFailed"));
      }

      setFields(payload.fields);
      setStep("FIELDS");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("ocrFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function exportDocx() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({
          caseId,
          title,
          rawOcrText,
          fields,
          notes
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message: string } };
        throw new Error(payload.error?.message ?? t("generateDocument"));
      }

      const newCaseId = response.headers.get("x-case-id");
      if (newCaseId) {
        setCaseId(newCaseId);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.headers.get("x-filename") ?? "case-export.docx";
      anchor.click();
      URL.revokeObjectURL(url);
      setStep("EXPORT");
      setMessage(t("caseCompleted"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("generateDocument"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("newCaseTitle")}</h1>
      {step === "OCR" ? <ImageConversation onFinalize={(text) => void runFieldExtraction(text)} /> : null}
      {step === "FIELDS" ? (
        <div className="space-y-4">
          <FieldReviewForm fields={fields} onChange={setFields} />
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">{t("caseMetadata")}</h2>
            <Input placeholder={t("caseTitle")} value={title} onChange={(event) => setTitle(event.target.value)} />
            <Textarea placeholder={t("optionalNotes")} value={notes} onChange={(event) => setNotes(event.target.value)} />
            <Button disabled={loading || !title.trim()} onClick={() => void exportDocx()}>
              {loading ? t("generating") : t("generateDocument")}
            </Button>
          </Card>
        </div>
      ) : null}
      {step === "EXPORT" ? <Card>{t("caseCompleted")}</Card> : null}
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
