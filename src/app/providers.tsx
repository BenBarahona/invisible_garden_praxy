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
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false,
        },
        // Supported chains
        supportedChains: [mainnet, base, sepolia],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
