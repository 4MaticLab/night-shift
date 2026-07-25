import { headers } from "next/headers";
import QRCode from "qrcode";
import { souvenirs } from "@/src/content/souvenirs";
import { getAsset } from "@/src/content/assets";
import { createKeepsakeShareUrl } from "@/src/lib/game-engine/keepsake-sharing";
import { KeepsakeExchange, type KeepsakeCard } from "@/src/components/keepsake/keepsake-exchange";
import "./keepsake.css";

async function getOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function KeepsakePage() {
  const origin = await getOrigin();
  const cards: KeepsakeCard[] = await Promise.all(souvenirs.map(async (souvenir) => {
    const asset = getAsset(souvenir.assetId);
    const shareUrl = createKeepsakeShareUrl(origin, souvenir.id);
    const qr = await QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 320,
      color: { dark: "#141a2b", light: "#f4ecd9" },
    });
    return {
      id: souvenir.id,
      name: souvenir.name,
      archiveName: souvenir.archiveName,
      provenance: souvenir.provenance,
      fieldNote: souvenir.fieldNote,
      cityRumor: souvenir.cityRumor,
      art: asset.src,
      alt: asset.alt,
      shareUrl,
      qr,
    };
  }));

  return <KeepsakeExchange cards={cards} />;
}
