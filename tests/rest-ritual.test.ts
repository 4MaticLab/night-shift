import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/rest-reflection/route";
import { GET as GET_ACCESS, POST as POST_ACCESS } from "@/app/api/rest-reflection/access/route";
import { createLocalRestReflection, createRestRitualRecord, restReflectionRequestSchema } from "@/src/lib/rest-ritual";
import { createRestReflectionAccessToken, REST_REFLECTION_ACCESS_COOKIE } from "@/src/lib/rest-reflection-access";

const requestBody = restReflectionRequestSchema.parse({
  requestId: "00000000-0000-4000-8000-000000000001",
  intention: "明天的演示还没准备完，但今晚先到这里。",
  campaignTitle: "零点四十三分的末班车",
  chapterTitle: "一张来自七年前的车票",
  direction: "纸张的证词",
  destination: "灯港旧票据工坊",
  preparation: "侧照灯",
  detectiveName: "林渡",
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("rest intention ritual", () => {
  it("creates a deterministic local-first reflection without changing the input", () => {
    const first = createLocalRestReflection(requestBody);
    const second = createLocalRestReflection(requestBody);
    const record = createRestRitualRecord(1, { intention: requestBody.intention, aiRequested: false }, {
      campaignTitle: requestBody.campaignTitle,
      chapterTitle: requestBody.chapterTitle,
      direction: requestBody.direction,
      destination: requestBody.destination,
      preparation: requestBody.preparation,
      detectiveName: requestBody.detectiveName,
    }, new Date("2026-07-23T23:40:00.000Z"));

    expect(first).toBe(second);
    expect(first).toContain(requestBody.destination);
    expect(record).toMatchObject({ chapter: 1, intention: requestBody.intention, source: "local", status: "local", reason: "local-only", aiRequested: false });
  });

  it("returns the local reflection when no model is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST(new Request("http://localhost/api/rest-reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify(requestBody),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ source: "local", reason: "not-configured" });
  });

  it("uses the configured OpenAI-compatible provider without sending unrelated state", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("REST_REFLECTION_ACCESS_CODE", "demo-access");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "redis-token");
    vi.stubEnv("OPENAI_BASE_URL", "https://models.example/v1/");
    vi.stubEnv("OPENAI_MODEL", "rest-model");
    const providerFetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "https://redis.example") return redisResponse(init);
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("rest-model");
      expect(body.messages.at(-1).content).toContain(requestBody.intention);
      expect(body.messages.at(-1).content).not.toContain("sleepData");
      return new Response(JSON.stringify({ choices: [{ message: { content: "{\"tone\":\"gentle\",\"image\":\"paper\"}" } }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", providerFetch);
    const { token: accessToken } = await createRestReflectionAccessToken("demo-access");

    const response = await POST(new Request("http://localhost/api/rest-reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost", Cookie: `${REST_REFLECTION_ACCESS_COOKIE}=${accessToken}` },
      body: JSON.stringify(requestBody),
    }));

    expect(providerFetch.mock.calls.filter(([url]) => url === "https://models.example/v1/chat/completions")).toHaveLength(1);
    await expect(response.json()).resolves.toMatchObject({ source: "ai", reason: "generated" });
  });

  it("rejects cross-origin and oversized requests before model invocation", async () => {
    const crossOrigin = await POST(new Request("http://localhost/api/rest-reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://attacker.example" },
      body: JSON.stringify(requestBody),
    }));
    expect(crossOrigin.status).toBe(403);

    const oversized = await POST(new Request("http://localhost/api/rest-reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ ...requestBody, padding: "x".repeat(5_000) }),
    }));
    expect(oversized.status).toBe(413);
  });

  it("requires a deployment access code before exposing the configured model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("REST_REFLECTION_ACCESS_CODE", "demo-access");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "redis-token");
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => redisResponse(init)));
    const initial = await GET_ACCESS(new Request("http://localhost/api/rest-reflection/access"));
    await expect(initial.json()).resolves.toEqual({ configured: true, authorized: false });

    const denied = await POST_ACCESS(new Request("http://localhost/api/rest-reflection/access", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ code: "wrong-code" }),
    }));
    expect(denied.status).toBe(401);

    const granted = await POST_ACCESS(new Request("http://localhost/api/rest-reflection/access", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ code: "demo-access" }),
    }));
    expect(granted.status).toBe(200);
    expect(granted.headers.get("set-cookie")).toContain(`${REST_REFLECTION_ACCESS_COOKIE}=`);
    expect(granted.headers.get("set-cookie")).toContain("HttpOnly");
    expect(granted.headers.get("set-cookie")).toContain("SameSite=strict");
  });

  it("keeps the fallback contract closed for maximum valid input and rejects unsafe model output", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("REST_REFLECTION_ACCESS_CODE", "demo-access");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "redis-token");
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => url === "https://redis.example"
      ? redisResponse(init)
      : new Response(JSON.stringify({ choices: [{ message: { content: "{\"tone\":\"medical\",\"image\":\"pills\"}" } }] }), { status: 200 })));
    const { token: accessToken } = await createRestReflectionAccessToken("demo-access");
    const maximumInput = {
      intention: "意".repeat(160),
      requestId: "00000000-0000-4000-8000-000000000002",
      campaignTitle: "案".repeat(120),
      chapterTitle: "章".repeat(120),
      direction: "向".repeat(120),
      destination: "地".repeat(120),
      preparation: "物".repeat(80),
      detectiveName: "林".repeat(40),
    };
    const response = await POST(new Request("http://localhost/api/rest-reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost", Cookie: `${REST_REFLECTION_ACCESS_COOKIE}=${accessToken}` },
      body: JSON.stringify(maximumInput),
    }));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({ source: "local", reason: "invalid-output" });
    expect(payload.reflection.length).toBeLessThanOrEqual(240);
  });
});

function redisResponse(init?: RequestInit): Response {
  const command = JSON.parse(String(init?.body)) as string[];
  const result = command[0] === "SET" ? "OK" : 1;
  return new Response(JSON.stringify({ result }), { status: 200 });
}
