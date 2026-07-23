const MAX_ACCESS_ATTEMPTS_PER_HOUR = 8;
const MAX_GLOBAL_ACCESS_ATTEMPTS_PER_DAY = 200;
const MAX_SESSION_GENERATIONS_PER_DAY = 10;
const DEFAULT_GLOBAL_GENERATIONS_PER_DAY = 200;

export function isAiGuardConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function consumeAccessAttempt(request: Request): Promise<boolean> {
  const client = await hashIdentifier(getTrustedClientAddress(request));
  const hour = timeBucket(60 * 60 * 1_000);
  const day = timeBucket(24 * 60 * 60 * 1_000);
  const result = await evalQuotaScript(
    [`night-shift:rest:access:${hour}:${client}`, `night-shift:rest:access-global:${day}`],
    [MAX_ACCESS_ATTEMPTS_PER_HOUR, MAX_GLOBAL_ACCESS_ATTEMPTS_PER_DAY],
    [3_900, 90_000],
  );
  return result === 1;
}

export async function consumeGenerationQuota(sessionId: string, requestId: string): Promise<"allowed" | "duplicate" | "limited"> {
  const day = timeBucket(24 * 60 * 60 * 1_000);
  const globalLimit = parsePositiveInt(process.env.REST_REFLECTION_DAILY_BUDGET, DEFAULT_GLOBAL_GENERATIONS_PER_DAY);
  const result = await evalGenerationScript(
    `night-shift:rest:request:${requestId}`,
    `night-shift:rest:session:${day}:${sessionId}`,
    `night-shift:rest:global-budget:${day}`,
    sessionId,
    globalLimit,
  );
  return result === 1 ? "allowed" : result === -1 ? "duplicate" : "limited";
}

export async function readLimitedJson(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) throw new RequestTooLargeError();
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel("request-too-large");
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body));
}

export class RequestTooLargeError extends Error {}

async function evalQuotaScript(keys: [string, string], limits: [number, number], ttls: [number, number]): Promise<number> {
  const script = [
    "local first = tonumber(redis.call('GET', KEYS[1]) or '0')",
    "local second = tonumber(redis.call('GET', KEYS[2]) or '0')",
    "if first >= tonumber(ARGV[1]) or second >= tonumber(ARGV[2]) then return 0 end",
    "first = redis.call('INCR', KEYS[1])",
    "if first == 1 then redis.call('EXPIRE', KEYS[1], ARGV[3]) end",
    "second = redis.call('INCR', KEYS[2])",
    "if second == 1 then redis.call('EXPIRE', KEYS[2], ARGV[4]) end",
    "return 1",
  ].join("\n");
  return Number(await redisCommand<number>(["EVAL", script, "2", ...keys, ...limits.map(String), ...ttls.map(String)]));
}

async function evalGenerationScript(requestKey: string, sessionKey: string, globalKey: string, sessionId: string, globalLimit: number): Promise<number> {
  const script = [
    "if redis.call('EXISTS', KEYS[1]) == 1 then return -1 end",
    "local session = tonumber(redis.call('GET', KEYS[2]) or '0')",
    "local global = tonumber(redis.call('GET', KEYS[3]) or '0')",
    "if session >= tonumber(ARGV[2]) or global >= tonumber(ARGV[3]) then return 0 end",
    "redis.call('SET', KEYS[1], ARGV[1], 'EX', '900')",
    "session = redis.call('INCR', KEYS[2])",
    "if session == 1 then redis.call('EXPIRE', KEYS[2], '90000') end",
    "global = redis.call('INCR', KEYS[3])",
    "if global == 1 then redis.call('EXPIRE', KEYS[3], ARGV[4]) end",
    "return 1",
  ].join("\n");
  return Number(await redisCommand<number>(["EVAL", script, "3", requestKey, sessionKey, globalKey, sessionId, String(MAX_SESSION_GENERATIONS_PER_DAY), String(globalLimit), String(secondsUntilUtcMidnight())]));
}

async function redisCommand<T = unknown>(command: string[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("ai-guard-not-configured");
  const response = await fetch(url.replace(/\/$/, ""), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error("ai-guard-unavailable");
  const payload = await response.json() as { result?: T; error?: string };
  if (payload.error) throw new Error("ai-guard-error");
  return payload.result as T;
}

function getTrustedClientAddress(request: Request): string {
  if (process.env.VERCEL) return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "unknown-vercel";
  if (process.env.CF_PAGES || process.env.WORKERS_CI) return request.headers.get("cf-connecting-ip") ?? "unknown-cloudflare";
  return "unknown-local";
}

async function hashIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timeBucket(durationMs: number): number {
  return Math.floor(Date.now() / durationMs);
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.ceil((next - now.getTime()) / 1_000));
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
