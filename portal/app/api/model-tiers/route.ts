import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const path = join(process.cwd(), "data", "model-tiers.json");
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid model-tiers format" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("model-tiers read error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load model tiers" },
      { status: 500 }
    );
  }
}
