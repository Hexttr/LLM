import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createKey } from "@/lib/litellm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      website?: string;
      _ready?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // Защита от ботов: honeypot — если заполнено, считаем ботом
    if (body.website?.trim()) {
      return NextResponse.json({ error: "Registration failed" }, { status: 400 });
    }
    // Защита от ботов: форма должна быть открыта минимум несколько секунд (_ready ставится JS)
    if (body._ready !== "1") {
      return NextResponse.json({ error: "Please wait a moment and try again" }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const apiKey = await createKey(user.id, user.email);
    await prisma.user.update({
      where: { id: user.id },
      data: { apiKey },
    });

    const { signToken } = await import("@/lib/auth");
    const token = await signToken({ sub: user.id });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email },
      token,
    });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registration failed" },
      { status: 500 }
    );
  }
}
