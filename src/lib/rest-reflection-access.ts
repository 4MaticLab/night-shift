export const REST_REFLECTION_ACCESS_COOKIE = "night-shift-rest-access";

export async function createRestReflectionAccessToken(secret: string, now = Date.now()): Promise<{ token: string; sessionId: string }> {
  const sessionId = crypto.randomUUID();
  const expiresAt = now + 24 * 60 * 60 * 1_000;
  const payload = `${sessionId}.${expiresAt}`;
  return { token: `${payload}.${await sign(payload, secret)}`, sessionId };
}

export async function verifyRestReflectionAccessToken(token: string | undefined, secret: string, now = Date.now()): Promise<string | null> {
  if (!token) return null;
  const [sessionId, rawExpiresAt, signature, ...extra] = token.split(".");
  const expiresAt = Number(rawExpiresAt);
  if (extra.length || !sessionId || !Number.isFinite(expiresAt) || expiresAt <= now || !signature) return null;
  const payload = `${sessionId}.${rawExpiresAt}`;
  return signature === await sign(payload, secret) ? sessionId : null;
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
