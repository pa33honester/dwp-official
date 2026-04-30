"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, base, arbitrum, optimism } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "DigitalWealth Partners",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo",
  chains: [mainnet, base, polygon, arbitrum, optimism],
  ssr: true,
});
