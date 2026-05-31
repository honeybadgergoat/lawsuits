"use client";

import { useI18n } from "@/components/LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <select
      aria-label={t("language")}
      title={t("language")}
      className="min-h-9 w-16 rounded-md border border-slate-200 bg-white px-2 text-sm"
      value={locale}
      onChange={(event) => setLocale(event.target.value as "ar" | "fr" | "en")}
    >
      <option value="ar">🇸🇦</option>
      <option value="fr">🇫🇷</option>
      <option value="en">🇬🇧</option>
    </select>
  );
}
