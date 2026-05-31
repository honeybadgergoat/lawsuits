"use client";

import { useEffect, useState } from "react";
import { clientAuth } from "@/lib/firebase-client";
import { AppUser } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/LanguageProvider";

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function loadUsers() {
    const token = await clientAuth.currentUser?.getIdToken();
    if (!token) return;
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = (await response.json()) as { users: AppUser[] };
    setUsers(payload.users ?? []);
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("adminUsersTitle")}</h1>
      <Card className="space-y-2">
        <h2 className="font-semibold">{t("createJudgeAccount")}</h2>
        <Input placeholder={t("name")} value={name} onChange={(event) => setName(event.target.value)} />
        <Input placeholder={t("email")} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input
          placeholder={t("temporaryPassword")}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          onClick={async () => {
            const token = await clientAuth.currentUser?.getIdToken();
            if (!token) return;
            await fetch("/api/admin/users", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ name, email, password })
            });
            setName("");
            setEmail("");
            setPassword("");
            await loadUsers();
          }}
        >
          {t("createJudge")}
        </Button>
      </Card>

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.uid} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-slate-500">
                  {user.email} · {user.role}
                </p>
              </div>
              <Button
                variant={user.isActive ? "destructive" : "secondary"}
                onClick={async () => {
                  const token = await clientAuth.currentUser?.getIdToken();
                  if (!token) return;
                  await fetch(`/api/admin/users/${user.uid}/status`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ isActive: !user.isActive })
                  });
                  await loadUsers();
                }}
              >
                {user.isActive ? t("deactivate") : t("activate")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
