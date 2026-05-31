import { getAdminAuth } from "@/lib/firebase-admin";
import { AppUser } from "@/lib/types";
import { getUserProfile } from "@/lib/users";

export interface AuthenticatedRequest {
  uid: string;
  user: AppUser;
}

/**
 * Authenticates a Next Request using Firebase ID token.
 */
export async function requireAuth(request: Request): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.slice("Bearer ".length);
  const decoded = await getAdminAuth().verifyIdToken(token);
  const user = await getUserProfile(decoded.uid);
  if (!user || !user.isActive) {
    throw new Error("FORBIDDEN");
  }

  return {
    uid: decoded.uid,
    user
  };
}

/**
 * Authenticates and asserts admin role.
 */
export async function requireAdmin(request: Request): Promise<AuthenticatedRequest> {
  const auth = await requireAuth(request);
  if (auth.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return auth;
}
