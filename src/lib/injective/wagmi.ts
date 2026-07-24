import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { injectiveEvmTestnet } from "./keepsake";

export const injectiveWagmiConfig = createConfig({
  chains: [injectiveEvmTestnet],
  connectors: [injected()],
  transports: {
    [injectiveEvmTestnet.id]: http(injectiveEvmTestnet.rpcUrls.default.http[0]),
  },
  multiInjectedProviderDiscovery: true,
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof injectiveWagmiConfig;
  }
}
