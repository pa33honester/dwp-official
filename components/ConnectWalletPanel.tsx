"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectWalletPanel() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-elevated p-6">
      <p className="text-sm text-zinc-400">
        Connect via MetaMask, Coinbase Wallet, Ledger, Trust Wallet, or any
        WalletConnect-compatible wallet.
      </p>
      <ConnectButton
        accountStatus="address"
        showBalance={false}
        chainStatus="icon"
      />
      <p className="mt-2 text-center text-xs text-zinc-500">
        DWP never asks for your seed phrase or private keys. All connections use
        your wallet&apos;s official provider.
      </p>
    </div>
  );
}
