import { mintReceiptSchema, type MintKeepsakeReceipt } from "./keepsake";

export const INJECTIVE_MINT_STORAGE_KEY = "night-shift-injective-mints-v1";

export function mintReceiptKey(campaignId: string, collectibleId: string, wallet: string): string {
  return `${campaignId}:${collectibleId}:${wallet.toLowerCase()}`;
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem">;

export function readMintReceipts(storage: ReadableStorage = window.localStorage): Record<string, MintKeepsakeReceipt> {
  try {
    const raw = storage.getItem(INJECTIVE_MINT_STORAGE_KEY);
    if (!raw) return {};
    const entries = Object.entries(JSON.parse(raw) as Record<string, unknown>).flatMap(([key, value]) => {
      const parsed = mintReceiptSchema.safeParse(value);
      return parsed.success ? [[key, parsed.data] as const] : [];
    });
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export function saveMintReceipt(
  receipt: MintKeepsakeReceipt,
  storage: WritableStorage = window.localStorage,
): MintKeepsakeReceipt {
  const parsed = mintReceiptSchema.parse(receipt);
  const receipts = readMintReceipts(storage);
  receipts[mintReceiptKey(parsed.campaignId, parsed.collectibleId, parsed.wallet)] = parsed;
  storage.setItem(INJECTIVE_MINT_STORAGE_KEY, JSON.stringify(receipts));
  return parsed;
}
