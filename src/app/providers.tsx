"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { base, mainnet, sepolia } from "viem/chains";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: [
          "email",
          "wallet",
          "google",
          "twitter",
          "discord",
          "apple",
        ],
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
          logo: "",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        // Supported chains
        supportedChains: [mainnet, base, sepolia],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
