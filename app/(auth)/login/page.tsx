"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
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
        return "Invalid email or password.";
      case "auth/user-disabled":
        return "This Firebase Auth user is disabled.";
      case "auth/invalid-api-key":
        return "Invalid Firebase API key in NEXT_PUBLIC_FIREBASE_API_KEY.";
      case "auth/network-request-failed":
        return "Network error while contacting Firebase Auth.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait and try again.";
      default:
        if (error instanceof Error && error.message) {
          return error.message;
        }
        return authError.code
          ? `Login failed: ${authError.code}`
          : "Login failed. Check your credentials.";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">Judge Login</h1>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
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
                throw new Error("Failed to establish authenticated session.");
              }
              router.push("/dashboard");
            } catch (error) {
              setError(toLoginMessage(error));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </Card>
    </main>
  );
}
