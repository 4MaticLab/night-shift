import { Bonjour } from "bonjour-service";

export interface DiscoveredHomeAssistant {
  name: string;
  url: string;
  version?: string;
  uuid?: string;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return undefined;
}

interface BonjourServiceRecord {
  txt?: Record<string, unknown>;
  addresses?: string[];
  host?: string;
  port?: number;
  name?: string;
}

function serviceUrl(service: BonjourServiceRecord): string | undefined {
  const internalUrl = text(service.txt?.internal_url);
  if (internalUrl) return internalUrl.replace(/\/$/, "");
  const address = service.addresses?.find((candidate: string) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate))
    ?? service.host;
  if (!address || !service.port) return undefined;
  return `http://${address.replace(/\.$/, "")}:${service.port}`;
}

export async function discoverHomeAssistantInstances(
  timeoutMs = 2_000,
): Promise<DiscoveredHomeAssistant[]> {
  const bonjour = new Bonjour(undefined, () => undefined);
  const found = new Map<string, DiscoveredHomeAssistant>();
  const browser = bonjour.find({ type: "home-assistant", protocol: "tcp" }, (service: BonjourServiceRecord) => {
    const url = serviceUrl(service);
    if (!url) return;
    found.set(url, {
      name: text(service.txt?.location_name) || service.name || "Home Assistant",
      url,
      version: text(service.txt?.version),
      uuid: text(service.txt?.uuid),
    });
  });

  await new Promise((resolve) => setTimeout(resolve, Math.max(100, timeoutMs)));
  browser.stop();
  bonjour.destroy();
  return [...found.values()].sort((first, second) => first.name.localeCompare(second.name));
}
