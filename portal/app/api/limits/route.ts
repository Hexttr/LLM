import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBearerToken, verifyToken } from "@/lib/auth";

/** Возвращает лимиты текущего пользователя (те же, что задаются при создании ключа). */
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

  const maxBudget = process.env.DEFAULT_MAX_BUDGET ? parseFloat(process.env.DEFAULT_MAX_BUDGET) : null;
  const rpmLimit = process.env.DEFAULT_RPM_LIMIT ? parseInt(process.env.DEFAULT_RPM_LIMIT, 10) : null;
  const tpmLimit = process.env.DEFAULT_TPM_LIMIT ? parseInt(process.env.DEFAULT_TPM_LIMIT, 10) : null;
  const budgetDuration = process.env.BUDGET_DURATION || null;

  return NextResponse.json({
    maxBudget,
    rpmLimit,
    tpmLimit,
    budgetDuration,
  });
}
