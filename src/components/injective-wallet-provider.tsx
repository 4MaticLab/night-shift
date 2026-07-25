"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { injectiveWagmiConfig } from "@/src/lib/injective/wagmi";

export function InjectiveWalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <WagmiProvider config={injectiveWagmiConfig} reconnectOnMount>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </WagmiProvider>;
}
