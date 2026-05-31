import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { App } from "firebase-admin/app";

let cachedApp: App | null = null;

function getPrivateKey(): string {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) {
    throw new Error("Missing FIREBASE_ADMIN_PRIVATE_KEY");
  }
  return key.replace(/\\n/g, "\n");
}

function getAdminApp(): App {
  if (cachedApp) {
    return cachedApp;
  }

  cachedApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: getPrivateKey()
      })
    });

  return cachedApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
