import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { getUserInfo } from "@/lib/litellm";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = getBearerToken(request) ?? cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const info = await getUserInfo(payload.sub);
    return NextResponse.json({
      spend: info.spend ?? 0,
      keys: info.keys ?? [],
    });
  } catch (e) {
    console.error("Usage error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
