"use client";

import { useEffect, useState } from "react";
import { clientAuth } from "@/lib/firebase-client";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/LanguageProvider";

interface StatRow {
  userId: string;
  name: string;
  aiCallsToday: number;
  aiCallsMonth: number;
  totalCasesMonth: number;
}

export default function AdminStatsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<StatRow[]>([]);

  useEffect(() => {
    async function load() {
      const token = await clientAuth.currentUser?.getIdToken();
      if (!token) return;
      const response = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { stats: StatRow[] };
      setRows(payload.stats ?? []);
    }
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("adminStatsTitle")}</h1>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-2">{t("judge")}</th>
              <th className="p-2">{t("aiToday")}</th>
              <th className="p-2">{t("aiMonth")}</th>
              <th className="p-2">{t("casesMonth")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-slate-100">
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.aiCallsToday}</td>
                <td className="p-2">{row.aiCallsMonth}</td>
                <td className="p-2">{row.totalCasesMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
