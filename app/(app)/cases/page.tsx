"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CaseCard } from "@/components/CaseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CaseDocument } from "@/lib/types";
import { clientAuth } from "@/lib/firebase-client";
import { useI18n } from "@/components/LanguageProvider";

export default function CasesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<CaseDocument[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | "DRAFT" | "COMPLETED">("");

  const loadCases = useCallback(async () => {
    const token = await clientAuth.currentUser?.getIdToken();
    if (!token) return;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const response = await fetch(`/api/cases?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = (await response.json()) as { cases: CaseDocument[] };
    setItems(payload.cases ?? []);
  }, [status]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const filtered = useMemo(
    () => items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("caseHistory")}</h1>
      <div className="flex gap-2">
        <Input placeholder={t("searchTitle")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <select
          className="min-h-12 rounded-md border border-slate-300 px-3"
          value={status}
          onChange={(event) => setStatus(event.target.value as "" | "DRAFT" | "COMPLETED")}
        >
          <option value="">{t("all")}</option>
          <option value="DRAFT">{t("draft")}</option>
          <option value="COMPLETED">{t("completed")}</option>
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map((item) => (
          <CaseCard
            key={item.id}
            item={item}
            onOpen={(id) => router.push(`/cases/${id}`)}
            onDelete={async (id) => {
              const token = await clientAuth.currentUser?.getIdToken();
              if (!token) return;
              await fetch(`/api/cases/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
              });
              await loadCases();
            }}
          />
        ))}
      </div>
      <Button variant="secondary" onClick={() => void loadCases()}>
        {t("refresh")}
      </Button>
    </div>
  );
}
