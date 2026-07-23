import { describe, expect, it, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { verifyTypedData, type Address, type Hex } from "viem";
import { campaignRegistry } from "@/src/content/campaigns/registry";
import {
  authorizeKeepsakeMint,
  createKeepsakeMetadataUri,
  INJECTIVE_EVM_TESTNET_CHAIN_ID,
  INJECTIVE_EVM_TESTNET_EXPLORER_URL,
  mintAuthorizationResponseSchema,
  resolveKeepsake,
  voucherTypes,
  type InjectiveMintConfig,
  type MintAuthorizationResponse,
  type MintKeepsakeRequest,
} from "@/src/lib/injective/keepsake";
import {
  INJECTIVE_MINT_STORAGE_KEY,
  mintReceiptKey,
  readMintReceipts,
  saveMintReceipt,
} from "@/src/lib/injective/client";
import { createInjectiveMintAuthorizationHandler } from "@/src/lib/injective/server";

const signerPrivateKey = `0x${"11".repeat(32)}` as Hex;
const signer = privateKeyToAccount(signerPrivateKey);
const contractAddress = "0x1111111111111111111111111111111111111111" as Address;
const recipient = "0x2222222222222222222222222222222222222222" as Address;
const campaign = campaignRegistry[0];
const collectible = campaign.case.collectibles[0];
const input: MintKeepsakeRequest = {
  campaignId: campaign.id,
  collectibleId: collectible.id,
  recipient,
  requestId: "request-0001",
};
const config: InjectiveMintConfig = {
  signerPrivateKey,
  contractAddress,
  rpcUrl: "https://rpc.invalid",
};

function memoryStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

function authorizedResponse(request: MintKeepsakeRequest): MintAuthorizationResponse {
  return mintAuthorizationResponseSchema.parse({
    status: "authorized",
    campaignId: request.campaignId,
    collectibleId: request.collectibleId,
    recipient: request.recipient,
    voucher: {
      recipient: request.recipient,
      campaignKey: `0x${"01".repeat(32)}`,
      collectibleKey: `0x${"02".repeat(32)}`,
      tokenUriHash: `0x${"03".repeat(32)}`,
      deadline: "9999999999",
    },
    metadataUri: "data:application/json;base64,e30=",
    signature: `0x${"04".repeat(65)}`,
    contractAddress,
    chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID,
  });
}

function requestFor(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://night-shift.test/api/injective/mint-authorization", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("Injective keepsake mint", () => {
  it("only resolves registered campaign collectibles and authors canonical metadata", () => {
    expect(resolveKeepsake(campaign.id, collectible.id)?.collectible.id).toBe(collectible.id);
    expect(resolveKeepsake("case-999", collectible.id)).toBeNull();
    expect(resolveKeepsake(campaign.id, "forged-collectible")).toBeNull();

    const uri = createKeepsakeMetadataUri(campaign.id, collectible.id, "https://night-shift.test");
    const metadata = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf8"));
    expect(metadata.name).toContain(collectible.title);
    expect(metadata.image).toMatch(/^https:\/\/night-shift\.test\//);
    expect(metadata.description).toContain("不证明链下通关");
    expect(metadata.attributes).toContainEqual({ trait_type: "Network", value: "Injective EVM Testnet" });
  });

  it("signs a short-lived EIP-712 voucher without exposing the server key", async () => {
    const now = Date.parse("2026-07-24T00:00:00.000Z");
    const response = await authorizeKeepsakeMint(
      input,
      "https://night-shift.test",
      config,
      now,
      { readTokenOf: async () => BigInt(0) },
    );
    expect(response.status).toBe("authorized");
    if (response.status !== "authorized") throw new Error("expected authorization");
    expect(response.voucher.deadline).toBe(String(Math.floor(now / 1_000) + 900));
    expect(JSON.stringify(response)).not.toContain(signerPrivateKey);
    expect(await verifyTypedData({
      address: signer.address,
      domain: {
        name: "Night Shift Keepsakes",
        version: "1",
        chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID,
        verifyingContract: contractAddress,
      },
      types: voucherTypes,
      primaryType: "MintVoucher",
      message: {
        recipient: response.voucher.recipient as Address,
        campaignKey: response.voucher.campaignKey as Hex,
        collectibleKey: response.voucher.collectibleKey as Hex,
        tokenUriHash: response.voucher.tokenUriHash as Hex,
        deadline: BigInt(response.voucher.deadline),
      },
      signature: response.signature as Hex,
    })).toBe(true);
  });

  it("returns an existing token instead of authorizing a duplicate", async () => {
    const response = await authorizeKeepsakeMint(
      input,
      "https://night-shift.test",
      config,
      Date.now(),
      { readTokenOf: async () => BigInt(7) },
    );
    expect(response).toMatchObject({
      status: "already-minted",
      tokenId: "7",
      explorerUrl: `${INJECTIVE_EVM_TESTNET_EXPLORER_URL}/token/${contractAddress}/instance/7`,
    });
    expect(response).not.toHaveProperty("signature");
  });

  it("fails closed when unconfigured and rejects cross-origin or unknown requests", async () => {
    const unconfigured = createInjectiveMintAuthorizationHandler({ getConfig: () => null });
    expect((await unconfigured(requestFor(input))).status).toBe(503);

    const handler = createInjectiveMintAuthorizationHandler({
      getConfig: () => config,
      authorize: async (request) => authorizedResponse(request),
    });
    expect((await handler(requestFor(input, { origin: "https://attacker.invalid" }))).status).toBe(403);
    expect((await handler(requestFor({ ...input, collectibleId: "forged" }))).status).toBe(404);
    expect((await handler(requestFor({ ...input, recipient: "not-an-address" }))).status).toBe(400);
  });

  it("reuses identical authorization requests without consuming extra attempts", async () => {
    const authorize = vi.fn(async (request: MintKeepsakeRequest) => authorizedResponse(request));
    let timestamp = 1_000_000;
    const handler = createInjectiveMintAuthorizationHandler({
      getConfig: () => config,
      authorize,
      now: () => timestamp,
    });

    const first = await handler(requestFor(input, { "x-forwarded-for": "198.51.100.8" }));
    timestamp += 100;
    const repeated = await handler(requestFor(input, { "x-forwarded-for": "198.51.100.8" }));
    expect(first.status).toBe(200);
    expect(repeated.status).toBe(200);
    expect(await repeated.json()).toEqual(await first.json());
    expect(authorize).toHaveBeenCalledTimes(1);

    for (let index = 2; index <= 8; index += 1) {
      const response = await handler(requestFor(
        { ...input, requestId: `request-000${index}` },
        { "x-forwarded-for": "198.51.100.8" },
      ));
      expect(response.status).toBe(200);
    }
    const limited = await handler(requestFor(
      { ...input, requestId: "request-0009" },
      { "x-forwarded-for": "198.51.100.8" },
    ));
    expect(limited.status).toBe(429);
  });

  it("keeps only schema-valid local receipts", () => {
    const receipt = {
      campaignId: campaign.id,
      collectibleId: collectible.id,
      recipient,
      wallet: recipient,
      tokenId: "5",
      txHash: `0x${"aa".repeat(32)}`,
      explorerUrl: `${INJECTIVE_EVM_TESTNET_EXPLORER_URL}/tx/0x${"aa".repeat(32)}`,
      contractAddress,
      chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID as const,
      mintedAt: "2026-07-24T00:00:00.000Z",
    };
    const storage = memoryStorage();
    saveMintReceipt(receipt, storage);
    const key = mintReceiptKey(campaign.id, collectible.id, recipient);
    expect(readMintReceipts(storage)[key]).toEqual(receipt);

    const corrupted = memoryStorage({
      [INJECTIVE_MINT_STORAGE_KEY]: JSON.stringify({ valid: receipt, invalid: { signerPrivateKey } }),
    });
    expect(readMintReceipts(corrupted)).toEqual({ valid: receipt });
  });
});
