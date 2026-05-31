"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppLocale = "ar" | "fr" | "en";

type TranslationKey = keyof (typeof translations)["en"];

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "app.locale";

const translations = {
  en: {
    language: "Language",
    arabic: "Arabic",
    french: "French",
    english: "English",
    checkingSession: "Checking session...",
    dashboard: "Dashboard",
    newCase: "New Case",
    cases: "Cases",
    admin: "Admin",
    signOut: "Sign out",
    judgeLogin: "Judge Login",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    invalidCredentials: "Invalid email or password.",
    firebaseUserDisabled: "This Firebase Auth user is disabled.",
    invalidApiKey: "Invalid Firebase API key in NEXT_PUBLIC_FIREBASE_API_KEY.",
    authNetworkError: "Network error while contacting Firebase Auth.",
    tooManyAttempts: "Too many attempts. Please wait and try again.",
    loginFailed: "Login failed. Check your credentials.",
    failedSession: "Failed to establish authenticated session.",
    ocrFailed: "Failed to extract OCR text.",
    missingSession: "Missing auth session. Please sign in again.",
    totalPages: "Total pages: {{count}}",
    processingPage: "Processing page {{count}}",
    noImageUploaded: "No image uploaded yet.",
    ocrOutput: "OCR output",
    assistant: "Assistant",
    addPage: "Add new page (upload or camera)",
    finalOcrText: "Final concatenated OCR text",
    finalizeExtract: "Finalize and extract fields",
    ocrConversationHint: "Chat-style flow: your image on the right, OCR output on the left.",
    pageNumber: "Page {{count}}",
    fieldReview: "Field review",
    needsReview: "Needs review",
    dashboardTitle: "Dashboard",
    startNewCase: "Start a new case",
    dashboardBody: "Upload pages one by one, review OCR, extract fields, then export the docx.",
    openConversationalFlow: "Open conversational flow",
    caseHistory: "Case History",
    searchTitle: "Search title",
    all: "All",
    draft: "Draft",
    completed: "Completed",
    refresh: "Refresh",
    open: "Open",
    softDelete: "Soft delete",
    caseDetails: "Case Details",
    loadingCase: "Loading case...",
    saveDraft: "Save draft",
    reExport: "Re-export",
    newCaseTitle: "New Case",
    caseMetadata: "Case metadata",
    caseTitle: "Case title",
    optionalNotes: "Optional notes",
    generating: "Generating...",
    generateDocument: "Generate document",
    caseCompleted: "Case completed. You can reopen it in Case History.",
    adminUsersTitle: "Admin · Users",
    createJudgeAccount: "Create judge account",
    name: "Name",
    temporaryPassword: "Temporary password",
    createJudge: "Create judge",
    deactivate: "Deactivate",
    activate: "Activate",
    adminStatsTitle: "Admin · Usage stats",
    judge: "Judge",
    aiToday: "AI today",
    aiMonth: "AI month",
    casesMonth: "Cases month"
  },
  ar: {
    language: "اللغة",
    arabic: "العربية",
    french: "الفرنسية",
    english: "الإنجليزية",
    checkingSession: "جاري التحقق من الجلسة...",
    dashboard: "الرئيسية",
    newCase: "قضية جديدة",
    cases: "القضايا",
    admin: "الإدارة",
    signOut: "تسجيل الخروج",
    judgeLogin: "تسجيل دخول القاضي",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول...",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    firebaseUserDisabled: "حساب Firebase Auth هذا معطل.",
    invalidApiKey: "مفتاح Firebase API غير صالح في NEXT_PUBLIC_FIREBASE_API_KEY.",
    authNetworkError: "خطأ شبكة أثناء الاتصال بـ Firebase Auth.",
    tooManyAttempts: "محاولات كثيرة. يرجى الانتظار ثم المحاولة مرة أخرى.",
    loginFailed: "فشل تسجيل الدخول. تحقق من بياناتك.",
    failedSession: "فشل إنشاء جلسة مصادقة.",
    ocrFailed: "فشل استخراج النص من OCR.",
    missingSession: "جلسة المصادقة مفقودة. يرجى تسجيل الدخول مجددًا.",
    totalPages: "إجمالي الصفحات: {{count}}",
    processingPage: "جاري معالجة الصفحة {{count}}",
    noImageUploaded: "لم يتم رفع صورة بعد.",
    ocrOutput: "ناتج OCR",
    assistant: "المساعد",
    addPage: "إضافة صفحة جديدة (رفع أو كاميرا)",
    finalOcrText: "النص النهائي المدمج من OCR",
    finalizeExtract: "إنهاء واستخراج الحقول",
    ocrConversationHint: "نمط محادثة: صورتك على اليمين وناتج OCR على اليسار.",
    pageNumber: "الصفحة {{count}}",
    fieldReview: "مراجعة الحقول",
    needsReview: "تحتاج مراجعة",
    dashboardTitle: "الرئيسية",
    startNewCase: "ابدأ قضية جديدة",
    dashboardBody: "ارفع الصفحات واحدة تلو الأخرى، راجع OCR، استخرج الحقول، ثم صدّر ملف docx.",
    openConversationalFlow: "فتح التدفق الحواري",
    caseHistory: "سجل القضايا",
    searchTitle: "البحث بالعنوان",
    all: "الكل",
    draft: "مسودة",
    completed: "مكتملة",
    refresh: "تحديث",
    open: "فتح",
    softDelete: "حذف مرن",
    caseDetails: "تفاصيل القضية",
    loadingCase: "جاري تحميل القضية...",
    saveDraft: "حفظ المسودة",
    reExport: "إعادة التصدير",
    newCaseTitle: "قضية جديدة",
    caseMetadata: "بيانات القضية",
    caseTitle: "عنوان القضية",
    optionalNotes: "ملاحظات اختيارية",
    generating: "جارٍ التوليد...",
    generateDocument: "توليد المستند",
    caseCompleted: "اكتملت القضية. يمكنك إعادة فتحها من سجل القضايا.",
    adminUsersTitle: "الإدارة · المستخدمون",
    createJudgeAccount: "إنشاء حساب قاضٍ",
    name: "الاسم",
    temporaryPassword: "كلمة مرور مؤقتة",
    createJudge: "إنشاء قاضٍ",
    deactivate: "تعطيل",
    activate: "تفعيل",
    adminStatsTitle: "الإدارة · إحصاءات الاستخدام",
    judge: "القاضي",
    aiToday: "استدعاءات الذكاء اليوم",
    aiMonth: "استدعاءات الذكاء هذا الشهر",
    casesMonth: "القضايا هذا الشهر"
  },
  fr: {
    language: "Langue",
    arabic: "Arabe",
    french: "Français",
    english: "Anglais",
    checkingSession: "Vérification de la session...",
    dashboard: "Tableau de bord",
    newCase: "Nouveau dossier",
    cases: "Dossiers",
    admin: "Admin",
    signOut: "Se déconnecter",
    judgeLogin: "Connexion du juge",
    email: "E-mail",
    password: "Mot de passe",
    signIn: "Se connecter",
    signingIn: "Connexion...",
    invalidCredentials: "E-mail ou mot de passe invalide.",
    firebaseUserDisabled: "Ce compte Firebase Auth est désactivé.",
    invalidApiKey: "Clé Firebase API invalide dans NEXT_PUBLIC_FIREBASE_API_KEY.",
    authNetworkError: "Erreur réseau lors de l'appel Firebase Auth.",
    tooManyAttempts: "Trop de tentatives. Réessayez plus tard.",
    loginFailed: "Échec de connexion. Vérifiez vos identifiants.",
    failedSession: "Échec de création de session authentifiée.",
    ocrFailed: "Échec de l'extraction OCR.",
    missingSession: "Session d'authentification manquante. Reconnectez-vous.",
    totalPages: "Pages totales : {{count}}",
    processingPage: "Traitement de la page {{count}}",
    noImageUploaded: "Aucune image importée.",
    ocrOutput: "Résultat OCR",
    assistant: "Assistant",
    addPage: "Ajouter une nouvelle page (import ou caméra)",
    finalOcrText: "Texte OCR concaténé final",
    finalizeExtract: "Finaliser et extraire les champs",
    ocrConversationHint: "Style chat : votre image à droite, la sortie OCR à gauche.",
    pageNumber: "Page {{count}}",
    fieldReview: "Revue des champs",
    needsReview: "À vérifier",
    dashboardTitle: "Tableau de bord",
    startNewCase: "Démarrer un nouveau dossier",
    dashboardBody:
      "Importez les pages une par une, relisez l'OCR, extrayez les champs puis exportez le docx.",
    openConversationalFlow: "Ouvrir le flux conversationnel",
    caseHistory: "Historique des dossiers",
    searchTitle: "Rechercher par titre",
    all: "Tous",
    draft: "Brouillon",
    completed: "Terminé",
    refresh: "Actualiser",
    open: "Ouvrir",
    softDelete: "Suppression logique",
    caseDetails: "Détails du dossier",
    loadingCase: "Chargement du dossier...",
    saveDraft: "Enregistrer le brouillon",
    reExport: "Ré-exporter",
    newCaseTitle: "Nouveau dossier",
    caseMetadata: "Métadonnées du dossier",
    caseTitle: "Titre du dossier",
    optionalNotes: "Notes facultatives",
    generating: "Génération...",
    generateDocument: "Générer le document",
    caseCompleted: "Dossier terminé. Vous pouvez le rouvrir dans l'historique.",
    adminUsersTitle: "Admin · Utilisateurs",
    createJudgeAccount: "Créer un compte juge",
    name: "Nom",
    temporaryPassword: "Mot de passe temporaire",
    createJudge: "Créer le juge",
    deactivate: "Désactiver",
    activate: "Activer",
    adminStatsTitle: "Admin · Statistiques d'usage",
    judge: "Juge",
    aiToday: "IA aujourd'hui",
    aiMonth: "IA ce mois",
    casesMonth: "Dossiers ce mois"
  }
} as const;

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}`, String(value)),
    template
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>("ar");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "fr" || stored === "en") {
      setLocale(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => {
        const template = translations[locale][key] ?? translations.en[key] ?? key;
        return interpolate(template, vars);
      }
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return context;
}
