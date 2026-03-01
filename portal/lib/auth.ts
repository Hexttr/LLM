import * as jose from "jose";
import bcrypt from "bcrypt";

const JWT_ALG = "HS256";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { sub: string }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setExpirationTime("7d")
    .setSubject(payload.sub)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub as string;
    return sub ? { sub } : null;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
