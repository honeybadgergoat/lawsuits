"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/LanguageProvider";

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{t("dashboardTitle")}</h1>
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">{t("startNewCase")}</h2>
        <p className="text-sm text-slate-600">{t("dashboardBody")}</p>
        <Link href="/new-case" className="text-sm font-medium text-accent underline">
          {t("openConversationalFlow")}
        </Link>
      </Card>
    </div>
  );
}
