import { NextResponse } from "next/server";
import {
  authorizeKeepsakeMint,
  INJECTIVE_EVM_TESTNET_CHAIN_ID,
  INJECTIVE_EVM_TESTNET_EXPLORER_URL,
  INJECTIVE_EVM_TESTNET_RPC_URL,
  mintKeepsakeRequestSchema,
  readInjectiveMintConfig,
  resolveKeepsake,
  type InjectiveMintConfig,
  type MintAuthorizationResponse,
  type MintKeepsakeRequest,
} from "./keepsake";

const MAX_REQUEST_BYTES = 1_024;
const WINDOW_MS = 60 * 60 * 1_000;
const MAX_ATTEMPTS_PER_WINDOW = 8;
const AUTHORIZATION_CACHE_MS = 15 * 60 * 1_000;

type Authorize = (
  input: MintKeepsakeRequest,
  requestOrigin: string,
  config: InjectiveMintConfig,
  now?: number,
) => Promise<MintAuthorizationResponse>;

export function createInjectiveMintAuthorizationHandler(options: {
  getConfig?: () => InjectiveMintConfig | null;
  authorize?: Authorize;
  now?: () => number;
} = {}) {
  const getConfig = options.getConfig ?? readInjectiveMintConfig;
  const authorize = options.authorize ?? authorizeKeepsakeMint;
  const now = options.now ?? Date.now;
  const attempts = new Map<string, number[]>();
  const authorizations = new Map<string, { expiresAt: number; response: Promise<MintAuthorizationResponse> }>();

  return async function POST(request: Request) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== requestUrl.origin) return NextResponse.json({ error: "cross-origin-request" }, { status: 403 });
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) return NextResponse.json({ error: "request-too-large" }, { status: 413 });

    let input: MintKeepsakeRequest;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) throw new Error("request-too-large");
      input = mintKeepsakeRequestSchema.parse(JSON.parse(text));
    } catch (error) {
      const oversized = error instanceof Error && error.message === "request-too-large";
      return NextResponse.json({ error: oversized ? "request-too-large" : "invalid-request" }, { status: oversized ? 413 : 400 });
    }
    if (!resolveKeepsake(input.campaignId, input.collectibleId)) {
      return NextResponse.json({ error: "unknown-collectible" }, { status: 404 });
    }

    const config = getConfig();
    if (!config) return NextResponse.json({ error: "mint-not-configured" }, { status: 503 });

    const timestamp = now();
    const cacheKey = `${input.requestId}:${input.recipient.toLowerCase()}:${input.campaignId}:${input.collectibleId}`;
    const cached = authorizations.get(cacheKey);
    if (cached && cached.expiresAt > timestamp) {
      try {
        return NextResponse.json(await cached.response);
      } catch {
        authorizations.delete(cacheKey);
      }
    }

    const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("cf-connecting-ip")
      || "local";
    const recentAttempts = (attempts.get(clientKey) ?? []).filter((entry) => timestamp - entry < WINDOW_MS);
    if (recentAttempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
      return NextResponse.json({ error: "mint-rate-limited" }, { status: 429, headers: { "Retry-After": "3600" } });
    }
    attempts.set(clientKey, [...recentAttempts, timestamp]);

    const entry = {
      expiresAt: timestamp + AUTHORIZATION_CACHE_MS,
      response: authorize(input, config.metadataOrigin ?? requestUrl.origin, config, timestamp),
    };
    authorizations.set(cacheKey, entry);

    try {
      return NextResponse.json(await entry.response);
    } catch (error) {
      authorizations.delete(cacheKey);
      const message = error instanceof Error ? error.message : "authorization-failed";
      const known = message === "unknown-collectible";
      return NextResponse.json({ error: known ? message : "authorization-failed" }, { status: known ? 404 : 502 });
    }
  };
}

export function getInjectiveMintStatus() {
  const config = readInjectiveMintConfig();
  return {
    configured: Boolean(config),
    chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID,
    chainName: "Injective EVM Testnet",
    rpcUrl: config?.rpcUrl ?? INJECTIVE_EVM_TESTNET_RPC_URL,
    explorerUrl: INJECTIVE_EVM_TESTNET_EXPLORER_URL,
    contractAddress: config?.contractAddress,
  };
}
