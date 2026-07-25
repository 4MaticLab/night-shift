"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ExternalLink, FileCheck2, LoaderCircle, ShieldCheck, Sparkles, WalletCards, X } from "lucide-react";
import {
  createPublicClient,
  http,
  type Address,
  type Hex,
} from "viem";
import {
  useConnect,
  useConnection,
  useConnectors,
  useSwitchChain,
} from "wagmi";
import { getWalletClient } from "wagmi/actions";
import type { Collectible } from "@/src/lib/game-engine/schema";
import {
  injectiveEvmTestnet,
  INJECTIVE_EVM_TESTNET_CHAIN_ID,
  keepsakeContractAbi,
  mintAuthorizationResponseSchema,
  type MintKeepsakeReceipt,
} from "@/src/lib/injective/keepsake";
import { saveMintReceipt } from "@/src/lib/injective/client";
import { injectiveWagmiConfig } from "@/src/lib/injective/wagmi";
import { useI18n } from "@/src/i18n/provider";
import { useAccessibleDialog } from "@/src/lib/use-accessible-dialog";

type MintStep = "checking" | "unconfigured" | "ready" | "connecting" | "authorizing" | "confirming" | "success" | "error";

interface MintStatus {
  configured: boolean;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress?: Address;
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && error.code === 4001) {
    return "wallet-rejected";
  }
  return error instanceof Error ? error.message : "mint-failed";
}

export function InjectiveMintDialog({
  campaignId,
  collectible,
  asset,
  onClose,
  onMinted,
}: {
  campaignId: string;
  collectible: Collectible;
  asset: { src: string; alt: string };
  onClose: () => void;
  onMinted: (receipt: MintKeepsakeReceipt) => void;
}) {
  const { locale, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const connection = useConnection();
  const connectors = useConnectors();
  type InjectiveConnector = (typeof connectors)[number];
  const { mutateAsync: connect } = useConnect();
  const { mutateAsync: switchChain } = useSwitchChain();
  const [step, setStep] = useState<MintStep>("checking");
  const [status, setStatus] = useState<MintStatus | null>(null);
  const [availableConnectorUids, setAvailableConnectorUids] = useState<readonly string[]>([]);
  const [walletsChecked, setWalletsChecked] = useState(false);
  const [receipt, setReceipt] = useState<MintKeepsakeReceipt | null>(null);
  const [problem, setProblem] = useState("");
  const wallet = connection.address ?? null;
  const availableConnectors = connectors.filter((connector) => availableConnectorUids.includes(connector.uid));

  useAccessibleDialog(dialogRef, onClose);

  useEffect(() => {
    let active = true;
    fetch("/api/injective/mint-authorization")
      .then(async (response) => {
        if (!response.ok) throw new Error("status-unavailable");
        return response.json() as Promise<MintStatus>;
      })
      .then((nextStatus) => {
        if (!active) return;
        setStatus(nextStatus);
        setStep(nextStatus.configured ? "ready" : "unconfigured");
      })
      .catch(() => {
        if (!active) return;
        setProblem("status-unavailable");
        setStep("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all(connectors.map(async (connector) => {
      try {
        const provider = await connector.getProvider();
        return provider ? { connector, provider } : null;
      } catch {
        return null;
      }
    })).then((resolved) => {
      if (!active) return;
      const seenProviders = new Set<unknown>();
      const ordered = resolved
        .filter((result) => result !== null)
        .sort((left, right) => Number(Boolean(right.connector.rdns)) - Number(Boolean(left.connector.rdns)));
      setAvailableConnectorUids(ordered.flatMap(({ connector, provider }) => {
        if (seenProviders.has(provider)) return [];
        seenProviders.add(provider);
        return [connector.uid];
      }));
      setWalletsChecked(true);
    });
    return () => {
      active = false;
    };
  }, [connectors]);

  const connectWallet = async (connector: InjectiveConnector) => {
    setProblem("");
    setStep("connecting");
    try {
      const connected = await connect({ connector });
      const account = connected.accounts[0];
      if (!account) throw new Error("wallet-empty");
      if (connected.chainId !== INJECTIVE_EVM_TESTNET_CHAIN_ID) {
        await switchChain({ chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID });
      }
      setStep("ready");
      return account;
    } catch (error) {
      setProblem(errorMessage(error));
      setStep("error");
      return null;
    }
  };

  const mint = async () => {
    const account = wallet;
    if (!account || !status?.contractAddress) return;
    setProblem("");
    setStep("authorizing");
    try {
      if (connection.chainId !== INJECTIVE_EVM_TESTNET_CHAIN_ID) {
        await switchChain({ chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID });
      }
      const response = await fetch("/api/injective/mint-authorization", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignId,
          collectibleId: collectible.id,
          recipient: account,
          requestId: crypto.randomUUID(),
        }),
      });
      const payload = await response.json() as unknown;
      if (!response.ok) {
        const code = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "authorization-failed";
        throw new Error(code);
      }
      const authorization = mintAuthorizationResponseSchema.parse(payload);
      if (authorization.status === "already-minted") {
        const existingReceipt = saveMintReceipt({
          campaignId,
          collectibleId: collectible.id,
          recipient: authorization.recipient,
          wallet: account,
          tokenId: authorization.tokenId,
          explorerUrl: authorization.explorerUrl,
          contractAddress: authorization.contractAddress,
          chainId: authorization.chainId,
          mintedAt: new Date().toISOString(),
        });
        setReceipt(existingReceipt);
        onMinted(existingReceipt);
        setStep("success");
        return;
      }

      setStep("confirming");
      const walletClient = await getWalletClient(injectiveWagmiConfig, {
        chainId: INJECTIVE_EVM_TESTNET_CHAIN_ID,
      });
      const txHash = await walletClient.writeContract({
        account,
        address: authorization.contractAddress as Address,
        abi: keepsakeContractAbi,
        functionName: "redeem",
        args: [{
          recipient: authorization.voucher.recipient as Address,
          campaignKey: authorization.voucher.campaignKey as Hex,
          collectibleKey: authorization.voucher.collectibleKey as Hex,
          tokenUriHash: authorization.voucher.tokenUriHash as Hex,
          deadline: BigInt(authorization.voucher.deadline),
        }, authorization.metadataUri, authorization.signature as Hex],
      });
      const publicClient = createPublicClient({
        chain: injectiveEvmTestnet,
        transport: http(status.rpcUrl, { timeout: 20_000 }),
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
      const tokenId = await publicClient.readContract({
        address: authorization.contractAddress as Address,
        abi: keepsakeContractAbi,
        functionName: "tokenOf",
        args: [
          account,
          authorization.voucher.campaignKey as Hex,
          authorization.voucher.collectibleKey as Hex,
        ],
      });
      const nextReceipt = saveMintReceipt({
        campaignId,
        collectibleId: collectible.id,
        recipient: account,
        wallet: account,
        tokenId: tokenId.toString(),
        txHash,
        explorerUrl: `${status.explorerUrl}/tx/${txHash}`,
        contractAddress: authorization.contractAddress,
        chainId: authorization.chainId,
        mintedAt: new Date().toISOString(),
      });
      setReceipt(nextReceipt);
      onMinted(nextReceipt);
      setStep("success");
    } catch (error) {
      setProblem(errorMessage(error));
      setStep("error");
    }
  };

  const retry = () => {
    setProblem("");
    setStep(status?.configured ? "ready" : "unconfigured");
  };
  const busy = ["checking", "connecting", "authorizing", "confirming"].includes(step);
  const problemCopy: Record<string, string> = {
    "wallet-missing": t("没有检测到浏览器钱包。请安装支持 EVM 的钱包后重试。"),
    "wallet-rejected": t("钱包没有批准这次操作。收藏品仍安全地留在本机档案里。"),
    "mint-rate-limited": t("今晚的链上归档请求有些拥挤，请稍后再试。"),
    "mint-not-configured": t("当前部署尚未开放链上归档。游戏与本地收藏不受影响。"),
    "status-unavailable": t("暂时无法读取链上归档状态。游戏与本地收藏不受影响。"),
  };

  return <motion.div
    className="injective-mint-backdrop"
    data-dialog-layer
    role="presentation"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <motion.section
      ref={dialogRef}
      className="injective-mint-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="injective-mint-title"
      tabIndex={-1}
      initial={{ y: 22, opacity: 0, scale: .985 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 16, opacity: 0, scale: .985 }}
    >
      <button className="injective-mint-close" type="button" data-dialog-initial-focus onClick={onClose} aria-label={t("关闭链上归档")}><X /></button>
      <div className="injective-mint-plate">
        <span className="injective-chain-mark">INJ · 1439</span>
        <Image src={asset.src} alt={asset.alt} fill sizes="(max-width: 600px) 100vw, 430px" />
        <div><small>TESTNET KEEPSAKE · {collectible.rarity}</small><strong>{collectible.title}</strong><span>{collectible.district}</span></div>
      </div>
      <div className="injective-mint-copy">
        <header>
          <p>INJECTIVE EVM TESTNET · NIGHT ARCHIVE</p>
          <h2 id="injective-mint-title">{t("把这件夜班藏品封进链上档案")}</h2>
          <span>{t("事务所签发一张十五分钟有效的领取凭证，由你的钱包亲自完成铸造。服务端密钥不会离开后室。")}</span>
        </header>

        <div className="injective-mint-route" aria-label={t("链上归档步骤")}>
          <span className={wallet ? "done" : step === "connecting" ? "active" : ""}><i>01</i>{t("连接钱包")}</span>
          <span className={["authorizing", "confirming", "success"].includes(step) ? "done" : ""}><i>02</i>{t("领取签章")}</span>
          <span className={step === "confirming" ? "active" : step === "success" ? "done" : ""}><i>03</i>{t("钱包铸造")}</span>
        </div>

        {wallet && step !== "success" && <p className="injective-wallet-line"><WalletCards /> {t("领取钱包")} <b>{shortAddress(wallet)}</b></p>}
        {step === "ready" && !wallet && walletsChecked && availableConnectors.length === 0 && <div className="injective-mint-notice"><WalletCards /><div><b>{t("没有检测到浏览器钱包")}</b><p>{t("请安装支持 EVM 的浏览器钱包，或在钱包内置浏览器中打开本站后重试。当前版本不启用 WalletConnect。")}</p></div></div>}
        {step === "unconfigured" && <div className="injective-mint-notice"><FileCheck2 /><div><b>{t("链上档案尚未开门")}</b><p>{t("部署者配置合约地址与签名密钥后，这里会自动启用；本地收藏和主线不受影响。")}</p></div></div>}
        {step === "error" && <div className="injective-mint-notice error" role="alert"><ShieldCheck /><div><b>{t("这次没有写入链上")}</b><p>{problemCopy[problem] ?? t("链上归档暂时没有完成。收藏品仍安全地留在本机档案里。")}</p></div></div>}
        {busy && <div className="injective-mint-progress" role="status"><LoaderCircle /><div><b>{step === "checking" ? t("正在确认档案室") : step === "connecting" ? t("等待钱包回应") : step === "authorizing" ? t("正在领取事务所签章") : t("请在钱包中确认铸造")}</b><p>{step === "confirming" ? t("交易确认后，这张回执会自动留在浏览器里。") : t("请保留这个窗口，主线游戏不会因此暂停或改变。")}</p></div></div>}
        {step === "success" && receipt && <div className="injective-mint-success" role="status"><Sparkles /><small>ARCHIVE RECEIPT · TOKEN #{receipt.tokenId}</small><h3>{t("雾灯城记住了这件东西")}</h3><p>{t("这是一枚测试网纪念凭证，不证明链下通关，也不赋予游戏优势或资产价值。")}</p><a href={receipt.explorerUrl} target="_blank" rel="noreferrer">{t("在 Injective 浏览器查看回执")} <ExternalLink /></a></div>}

        <footer>
          {step === "ready" && !wallet && availableConnectors.length > 0 && <div className="injective-wallet-options" role="group" aria-label={t("选择浏览器钱包")}>{availableConnectors.map((connector) => {
            const connectorName = connector.name === "Injected" ? t("默认浏览器钱包") : connector.name;
            return <button
              type="button"
              key={connector.uid}
              onClick={() => connectWallet(connector)}
              aria-label={`${t("连接钱包，准备归档")}：${connectorName}`}
            ><WalletCards /><span><b>{connectorName}</b><small>{t("浏览器钱包")}</small></span></button>;
          })}</div>}
          {step === "ready" && wallet && <button type="button" className="injective-mint-primary" onClick={mint}><Sparkles /> {t("领取签章并铸造")}</button>}
          {step === "error" && <button type="button" className="injective-mint-primary" onClick={retry}>{t("重新尝试")}</button>}
          {step === "success" && <button type="button" className="injective-mint-primary" onClick={onClose}>{t("收好回执")}</button>}
          {step === "unconfigured" && <button type="button" className="injective-mint-secondary" onClick={onClose}>{t("留在本地收藏")}</button>}
          <small>{locale === "en" ? "Testnet only · no purchase, proof of play, or gameplay advantage" : "仅测试网 · 无购买、无通关证明、无游戏优势"}</small>
        </footer>
      </div>
    </motion.section>
  </motion.div>;
}
