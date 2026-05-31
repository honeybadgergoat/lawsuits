import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(10)
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid session payload."
        }
      },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("firebaseToken", parsed.data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return response;
}
