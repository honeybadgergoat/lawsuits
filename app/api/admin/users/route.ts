import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { toApiError } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const users = await listUsers();
    return Response.json({ users });
  } catch {
    return toApiError("FORBIDDEN", "Admin access required.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return toApiError("BAD_REQUEST", "Invalid create user payload.");
    }

    const userRecord = await getAdminAuth().createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.name
    });

    await getAdminDb().collection("users").doc(userRecord.uid).set({
      email: parsed.data.email,
      name: parsed.data.name,
      role: "JUDGE",
      isActive: true,
      dailyLimit: 20,
      createdAt: new Date()
    });

    return Response.json({ uid: userRecord.uid }, { status: 201 });
  } catch {
    return toApiError("FORBIDDEN", "Admin access required.");
  }
}
