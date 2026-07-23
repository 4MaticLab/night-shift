import { z } from "zod";
import {
  createPublicClient,
  defineChain,
  http,
  isAddress,
  keccak256,
  parseAbi,
  toBytes,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getAsset } from "@/src/content/assets";
import { getCampaign, isCampaignId } from "@/src/content/campaigns/registry";

export const INJECTIVE_EVM_TESTNET_CHAIN_ID = 1439;
export const INJECTIVE_EVM_TESTNET_RPC_URL = "https://k8s.testnet.json-rpc.injective.network/";
export const INJECTIVE_EVM_TESTNET_EXPLORER_URL = "https://testnet.blockscout.injective.network";
export const MINT_VOUCHER_TTL_SECONDS = 15 * 60;

export const injectiveEvmTestnet = defineChain({
  id: INJECTIVE_EVM_TESTNET_CHAIN_ID,
  name: "Injective EVM Testnet",
  nativeCurrency: { name: "Injective", symbol: "INJ", decimals: 18 },
  rpcUrls: { default: { http: [INJECTIVE_EVM_TESTNET_RPC_URL] } },
  blockExplorers: {
    default: { name: "Injective Testnet Blockscout", url: INJECTIVE_EVM_TESTNET_EXPLORER_URL },
  },
  testnet: true,
});

export const keepsakeContractAbi = parseAbi([
  "struct MintVoucher { address recipient; bytes32 campaignKey; bytes32 collectibleKey; bytes32 tokenUriHash; uint256 deadline; }",
  "function redeem(MintVoucher voucher, string metadataUri, bytes signature) returns (uint256 tokenId)",
  "function tokenOf(address recipient, bytes32 campaignKey, bytes32 collectibleKey) view returns (uint256 tokenId)",
  "event KeepsakeMinted(address indexed recipient, uint256 indexed tokenId, bytes32 indexed campaignKey, bytes32 collectibleKey)",
]);

export const voucherTypes = {
  MintVoucher: [
    { name: "recipient", type: "address" },
    { name: "campaignKey", type: "bytes32" },
    { name: "collectibleKey", type: "bytes32" },
    { name: "tokenUriHash", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export const mintKeepsakeRequestSchema = z.object({
  campaignId: z.string().min(1).max(64),
  collectibleId: z.string().min(1).max(96),
  recipient: z.string().refine(isAddress, "Invalid EVM address"),
  requestId: z.string().min(8).max(100),
});
export type MintKeepsakeRequest = z.infer<typeof mintKeepsakeRequestSchema>;

export const mintVoucherSchema = z.object({
  recipient: z.string(),
  campaignKey: z.string(),
  collectibleKey: z.string(),
  tokenUriHash: z.string(),
  deadline: z.string(),
});

export const mintAuthorizationResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("authorized"),
    campaignId: z.string(),
    collectibleId: z.string(),
    recipient: z.string(),
    voucher: mintVoucherSchema,
    metadataUri: z.string(),
    signature: z.string(),
    contractAddress: z.string(),
    chainId: z.literal(INJECTIVE_EVM_TESTNET_CHAIN_ID),
  }),
  z.object({
    status: z.literal("already-minted"),
    campaignId: z.string(),
    collectibleId: z.string(),
    recipient: z.string(),
    tokenId: z.string(),
    explorerUrl: z.string().url(),
    contractAddress: z.string(),
    chainId: z.literal(INJECTIVE_EVM_TESTNET_CHAIN_ID),
  }),
]);
export type MintAuthorizationResponse = z.infer<typeof mintAuthorizationResponseSchema>;

export const mintReceiptSchema = z.object({
  campaignId: z.string(),
  collectibleId: z.string(),
  recipient: z.string(),
  wallet: z.string(),
  tokenId: z.string(),
  txHash: z.string().optional(),
  explorerUrl: z.string().url(),
  contractAddress: z.string(),
  chainId: z.literal(INJECTIVE_EVM_TESTNET_CHAIN_ID),
  mintedAt: z.string().datetime(),
});
export type MintKeepsakeReceipt = z.infer<typeof mintReceiptSchema>;

export interface InjectiveMintConfig {
  contractAddress: Address;
  signerPrivateKey: Hex;
  rpcUrl: string;
  metadataOrigin?: string;
}

export function resolveKeepsake(campaignId: string, collectibleId: string) {
  if (!isCampaignId(campaignId)) return null;
  const campaign = getCampaign(campaignId);
  const collectible = campaign.case.collectibles.find((item) => item.id === collectibleId);
  if (!collectible) return null;
  return {
    campaign,
    collectible,
    asset: getAsset(collectible.assetId),
    campaignKey: keccak256(toBytes(campaign.id)),
    collectibleKey: keccak256(toBytes(collectible.id)),
  };
}

export function createKeepsakeMetadataUri(campaignId: string, collectibleId: string, origin: string): string {
  const resolved = resolveKeepsake(campaignId, collectibleId);
  if (!resolved) throw new Error("unknown-collectible");
  const { campaign, collectible, asset } = resolved;
  const metadata = {
    name: `${collectible.title} · 夜班藏品`,
    description: `${collectible.revealedDescription}\n\n来自《${campaign.case.title}》的测试网档案副本。它不提供案件优势、稀有度承诺或资产价值，也不证明链下通关。`,
    image: new URL(asset.src, origin).toString(),
    external_url: new URL(`/?case=${encodeURIComponent(campaign.id)}`, origin).toString(),
    attributes: [
      { trait_type: "Case", value: campaign.case.title },
      { trait_type: "Campaign ID", value: campaign.id },
      { trait_type: "Collectible ID", value: collectible.id },
      { trait_type: "District", value: collectible.district },
      { trait_type: "Recovered Night", value: collectible.chapter },
      { trait_type: "Network", value: "Injective EVM Testnet" },
    ],
  };
  return `data:application/json;base64,${encodeBase64(JSON.stringify(metadata))}`;
}

export function readInjectiveMintConfig(): InjectiveMintConfig | null {
  const signerPrivateKey = process.env.INJECTIVE_MINT_SIGNER_PRIVATE_KEY;
  const contractAddress = process.env.INJECTIVE_NFT_CONTRACT_ADDRESS;
  if (!signerPrivateKey || !/^0x[0-9a-fA-F]{64}$/.test(signerPrivateKey) || !contractAddress || !isAddress(contractAddress)) return null;
  return {
    signerPrivateKey: signerPrivateKey as Hex,
    contractAddress,
    rpcUrl: process.env.INJECTIVE_EVM_RPC_URL ?? INJECTIVE_EVM_TESTNET_RPC_URL,
    metadataOrigin: process.env.INJECTIVE_NFT_METADATA_ORIGIN,
  };
}

export async function authorizeKeepsakeMint(
  input: MintKeepsakeRequest,
  requestOrigin: string,
  config: InjectiveMintConfig,
  now = Date.now(),
  dependencies: {
    readTokenOf?: (
      recipient: Address,
      campaignKey: Hex,
      collectibleKey: Hex,
      contractAddress: Address,
    ) => Promise<bigint>;
  } = {},
): Promise<MintAuthorizationResponse> {
  const resolved = resolveKeepsake(input.campaignId, input.collectibleId);
  if (!resolved) throw new Error("unknown-collectible");
  const recipient = input.recipient as Address;
  const existingTokenId = dependencies.readTokenOf
    ? await dependencies.readTokenOf(
      recipient,
      resolved.campaignKey,
      resolved.collectibleKey,
      config.contractAddress,
    )
    : await createPublicClient({
      chain: injectiveEvmTestnet,
      transport: http(config.rpcUrl, { timeout: 15_000 }),
    }).readContract({
      address: config.contractAddress,
      abi: keepsakeContractAbi,
      functionName: "tokenOf",
      args: [recipient, resolved.campaignKey, resolved.collectibleKey],
    });
  if (existingTokenId > BigInt(0)) {
    return mintAuthorizationResponseSchema.parse({
      status: "already-minted",
      campaignId: input.campaignId,
      collectibleId: input.collectibleId,
      recipient,
      tokenId: existingTokenId.toString(),
      explorerUrl: `${INJECTIVE_EVM_TESTNET_EXPLORER_URL}/token/${config.contractAddress}/instance/${existingTokenId}`,
      contractAddress: config.contractAddress,
      chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID,
    });
  }

  const metadataUri = createKeepsakeMetadataUri(input.campaignId, input.collectibleId, config.metadataOrigin ?? requestOrigin);
  const voucher = {
    recipient,
    campaignKey: resolved.campaignKey,
    collectibleKey: resolved.collectibleKey,
    tokenUriHash: keccak256(toBytes(metadataUri)),
    deadline: BigInt(Math.floor(now / 1_000) + MINT_VOUCHER_TTL_SECONDS),
  };
  const signer = privateKeyToAccount(config.signerPrivateKey);
  const signature = await signer.signTypedData({
    domain: {
      name: "Night Shift Keepsakes",
      version: "1",
      chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID,
      verifyingContract: config.contractAddress,
    },
    types: voucherTypes,
    primaryType: "MintVoucher",
    message: voucher,
  });

  return mintAuthorizationResponseSchema.parse({
    status: "authorized",
    campaignId: input.campaignId,
    collectibleId: input.collectibleId,
    recipient,
    voucher: { ...voucher, deadline: voucher.deadline.toString() },
    metadataUri,
    signature,
    contractAddress: config.contractAddress,
    chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID,
  });
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
