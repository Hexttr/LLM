import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { chatWithUserKey } from "@/lib/litellm";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = getBearerToken(request) ?? cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { apiKey: true },
  });
  if (!user?.apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { model?: string; messages?: { role: string; content: string }[] };
    const model = body.model?.trim();
    const messages = body.messages;
    if (!model || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "model and messages required" }, { status: 400 });
    }

    const result = await chatWithUserKey(user.apiKey, { model, messages });
    return NextResponse.json(result);
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
