import { getAdminDb } from "@/lib/firebase-admin";
import { AppUser, UserRole } from "@/lib/types";

/**
 * Loads a user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  if (!data) {
    return null;
  }

  return {
    uid: snapshot.id,
    email: String(data.email ?? ""),
    name: String(data.name ?? ""),
    role: data.role as UserRole,
    isActive: Boolean(data.isActive),
    dailyLimit: Number(data.dailyLimit ?? 20),
    createdAt: data.createdAt?.toDate?.() ?? new Date()
  };
}

/**
 * Ensures user has an active account.
 */
export function assertUserIsActive(user: AppUser | null): asserts user is AppUser {
  if (!user || !user.isActive) {
    throw new Error("Account is deactivated. Contact your administrator.");
  }
}

/**
 * Updates activation status for a user.
 */
export async function setUserActiveState(uid: string, isActive: boolean): Promise<void> {
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        isActive,
        updatedAt: new Date()
      },
      { merge: true }
    );
}

/**
 * Lists all users for admin UI.
 */
export async function listUsers(): Promise<AppUser[]> {
  const snapshot = await getAdminDb().collection("users").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      email: String(data.email ?? ""),
      name: String(data.name ?? ""),
      role: data.role as UserRole,
      isActive: Boolean(data.isActive),
      dailyLimit: Number(data.dailyLimit ?? 20),
      createdAt: data.createdAt?.toDate?.() ?? new Date()
    };
  });
}
