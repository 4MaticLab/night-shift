import { NextResponse } from "next/server";
import { z } from "zod";
import { createRestReflectionAccessToken, readCookie, REST_REFLECTION_ACCESS_COOKIE, verifyRestReflectionAccessToken } from "@/src/lib/rest-reflection-access";
import { consumeAccessAttempt, isAiGuardConfigured, readLimitedJson, RequestTooLargeError } from "@/src/lib/server-ai-guard";

export const runtime = "edge";

const accessRequestSchema = z.object({ code: z.string().min(1).max(128) });
const MAX_ACCESS_REQUEST_BYTES = 512;

export async function GET(request: Request) {
  const secret = process.env.REST_REFLECTION_ACCESS_CODE;
  if (!secret || !process.env.OPENAI_API_KEY || !isAiGuardConfigured()) return NextResponse.json({ configured: false, authorized: false });
  const sessionId = await verifyRestReflectionAccessToken(readCookie(request, REST_REFLECTION_ACCESS_COOKIE), secret);
  return NextResponse.json({ configured: true, authorized: Boolean(sessionId) });
}

export async function POST(request: Request) {
  const secret = process.env.REST_REFLECTION_ACCESS_CODE;
  if (!secret || !process.env.OPENAI_API_KEY || !isAiGuardConfigured()) return NextResponse.json({ configured: false, authorized: false }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ configured: true, authorized: false }, { status: 403 });
  let code: string;
  try {
    code = accessRequestSchema.parse(await readLimitedJson(request, MAX_ACCESS_REQUEST_BYTES)).code;
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ configured: true, authorized: false }, { status: 413 });
    return NextResponse.json({ configured: true, authorized: false }, { status: 400 });
  }
  try {
    if (!await consumeAccessAttempt(request)) return NextResponse.json({ configured: true, authorized: false }, { status: 429, headers: { "Retry-After": "3600" } });
  } catch {
    return NextResponse.json({ configured: true, authorized: false }, { status: 503 });
  }
  if (!await constantTimeSecretMatch(code, secret)) return NextResponse.json({ configured: true, authorized: false }, { status: 401 });
  const { token } = await createRestReflectionAccessToken(secret);
  const response = NextResponse.json({ configured: true, authorized: true });
  response.cookies.set(REST_REFLECTION_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/rest-reflection",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

async function constantTimeSecretMatch(provided: string, expected: string): Promise<boolean> {
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [left, right] = await Promise.all([digest(provided), digest(expected)]);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  return difference === 0;
}
