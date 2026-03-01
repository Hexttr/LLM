import { NextResponse } from "next/server";
import { getModelInfo } from "@/lib/litellm";

export async function GET() {
  try {
    const data = await getModelInfo();
    return NextResponse.json({ models: data });
  } catch (e) {
    console.error("Models error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch models" },
      { status: 500 }
    );
  }
}
