import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, toBytes, type Address, type Hex } from "viem";

const voucherTypes = {
  MintVoucher: [
    { name: "recipient", type: "address" },
    { name: "campaignKey", type: "bytes32" },
    { name: "collectibleKey", type: "bytes32" },
    { name: "tokenUriHash", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

describe("NightShiftKeepsake", async () => {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [owner, recipient, stranger] = await viem.getWalletClients();
  const chainId = await publicClient.getChainId();

  async function deploy() {
    return viem.deployContract("NightShiftKeepsake", [owner.account.address, owner.account.address]);
  }

  async function signVoucher(contractAddress: Address, overrides: Partial<{
    recipient: Address;
    campaignKey: Hex;
    collectibleKey: Hex;
    tokenUriHash: Hex;
    deadline: bigint;
  }> = {}, signer = owner) {
    const metadataUri = "data:application/json;base64,e30=";
    const voucher = {
      recipient: overrides.recipient ?? recipient.account.address,
      campaignKey: overrides.campaignKey ?? keccak256(toBytes("case-001")),
      collectibleKey: overrides.collectibleKey ?? keccak256(toBytes("torn-ticket")),
      tokenUriHash: overrides.tokenUriHash ?? keccak256(toBytes(metadataUri)),
      deadline: overrides.deadline ?? BigInt(Math.floor(Date.now() / 1_000) + 600),
    };
    const signature = await signer.signTypedData({
      account: signer.account,
      domain: { name: "Night Shift Keepsakes", version: "1", chainId, verifyingContract: contractAddress },
      types: voucherTypes,
      primaryType: "MintVoucher",
      message: voucher,
    });
    return { metadataUri, signature, voucher };
  }

  it("lets the recipient redeem one signed voucher", async () => {
    const contract = await deploy();
    const signed = await signVoucher(contract.address);

    await viem.assertions.emitWithArgs(
      contract.write.redeem([signed.voucher, signed.metadataUri, signed.signature], { account: recipient.account }),
      contract,
      "KeepsakeMinted",
      [recipient.account.address, BigInt(1), signed.voucher.campaignKey, signed.voucher.collectibleKey],
    );

    assert.equal(
      (await contract.read.ownerOf([BigInt(1)])).toLowerCase(),
      recipient.account.address.toLowerCase(),
    );
    assert.equal(await contract.read.tokenOf([
      recipient.account.address,
      signed.voucher.campaignKey,
      signed.voucher.collectibleKey,
    ]), BigInt(1));
    await viem.assertions.revertWithCustomError(
      contract.write.redeem([signed.voucher, signed.metadataUri, signed.signature], { account: recipient.account }),
      contract,
      "AlreadyMinted",
    );
  });

  it("rejects a different wallet, an expired voucher, a changed URI, and a wrong signer", async () => {
    const contract = await deploy();
    const valid = await signVoucher(contract.address);
    await viem.assertions.revertWithCustomError(
      contract.write.redeem([valid.voucher, valid.metadataUri, valid.signature], { account: stranger.account }),
      contract,
      "RecipientMustRedeem",
    );

    const expired = await signVoucher(contract.address, { deadline: BigInt(1) });
    await viem.assertions.revertWithCustomError(
      contract.write.redeem([expired.voucher, expired.metadataUri, expired.signature], { account: recipient.account }),
      contract,
      "ExpiredVoucher",
    );

    await viem.assertions.revertWithCustomError(
      contract.write.redeem([valid.voucher, `${valid.metadataUri}tampered`, valid.signature], { account: recipient.account }),
      contract,
      "InvalidMetadataUri",
    );

    const wrongSigner = await signVoucher(contract.address, {}, stranger);
    await viem.assertions.revertWithCustomError(
      contract.write.redeem([wrongSigner.voucher, wrongSigner.metadataUri, wrongSigner.signature], { account: recipient.account }),
      contract,
      "InvalidClaimSigner",
    );
  });
});
