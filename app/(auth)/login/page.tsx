"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
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
              await signInWithEmailAndPassword(clientAuth, email, password);
              router.push("/dashboard");
            } catch {
              setError("Login failed. Check your credentials.");
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
