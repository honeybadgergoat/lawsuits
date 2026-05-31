"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FieldReviewForm } from "@/components/FieldReviewForm";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CaseDocument } from "@/lib/types";
import { clientAuth } from "@/lib/firebase-client";

export default function CaseDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<CaseDocument | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const token = await clientAuth.currentUser?.getIdToken();
      if (!token) return;
      const response = await fetch(`/api/cases/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        router.push("/cases");
        return;
      }
      const payload = (await response.json()) as { case: CaseDocument };
      setItem(payload.case);
      setFields(payload.case.extractedFields ?? {});
      setTitle(payload.case.title);
      setNotes(payload.case.notes);
    }
    void load();
  }, [params.id, router]);

  if (!item) {
    return <p className="text-sm text-slate-600">Loading case...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Case Details</h1>
      <Card className="space-y-2">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Card>
      <FieldReviewForm fields={fields} onChange={setFields} />
      <div className="flex gap-2">
        <Button
          onClick={async () => {
            const token = await clientAuth.currentUser?.getIdToken();
            if (!token) return;
            await fetch(`/api/cases/${params.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                title,
                notes,
                fields
              })
            });
            router.push("/cases");
          }}
        >
          Save draft
        </Button>
        <Button variant="secondary" onClick={() => router.push("/new-case")}>
          Re-export
        </Button>
      </div>
    </div>
  );
}
