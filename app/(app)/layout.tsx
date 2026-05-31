"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const token = await user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      setReady(true);
    });

    return unsubscribe;
  }, [router]);

  if (!ready) {
    return <main className="p-4 text-sm text-slate-600">Checking session...</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <nav className="flex items-center justify-between">
          <div className="flex gap-2 text-sm">
            <Link className={pathname === "/dashboard" ? "font-semibold text-accent" : "text-slate-600"} href="/dashboard">
              Dashboard
            </Link>
            <Link className={pathname.startsWith("/new-case") ? "font-semibold text-accent" : "text-slate-600"} href="/new-case">
              New Case
            </Link>
            <Link className={pathname.startsWith("/cases") ? "font-semibold text-accent" : "text-slate-600"} href="/cases">
              Cases
            </Link>
            <Link className={pathname.startsWith("/admin") ? "font-semibold text-accent" : "text-slate-600"} href="/admin">
              Admin
            </Link>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              await signOut(clientAuth);
              router.replace("/login");
            }}
          >
            Sign out
          </Button>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl p-4">{children}</main>
    </div>
  );
}
