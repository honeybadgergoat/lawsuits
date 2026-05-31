"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toLoginMessage(error: unknown): string {
    const authError = error as AuthError;
    switch (authError.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return t("invalidCredentials");
      case "auth/user-disabled":
        return t("firebaseUserDisabled");
      case "auth/invalid-api-key":
        return t("invalidApiKey");
      case "auth/network-request-failed":
        return t("authNetworkError");
      case "auth/too-many-requests":
        return t("tooManyAttempts");
      default:
        if (error instanceof Error && error.message) {
          return error.message;
        }
        return authError.code
          ? `Login failed: ${authError.code}`
          : t("loginFailed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-bold">{t("judgeLogin")}</h1>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("email")} type="email" />
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("password")}
          type="password"
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError("");
            try {
              const credential = await signInWithEmailAndPassword(clientAuth, email, password);
              const token = await credential.user.getIdToken();
              const sessionResponse = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
              });
              if (!sessionResponse.ok) {
                throw new Error(t("failedSession"));
              }
              router.push("/dashboard");
            } catch (error) {
              setError(toLoginMessage(error));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t("signingIn") : t("signIn")}
        </Button>
      </Card>
    </main>
  );
}
