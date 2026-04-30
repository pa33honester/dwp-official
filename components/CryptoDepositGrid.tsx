"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CRYPTOS = [
  { ticker: "BTC", name: "Bitcoin", color: "#F7931A" },
  { ticker: "ETH", name: "Ethereum", color: "#627EEA" },
  { ticker: "XRP", name: "XRP", color: "#23292F" },
  { ticker: "XLM", name: "Stellar", color: "#7D00FF" },
  { ticker: "ADA", name: "Cardano", color: "#0033AD" },
  { ticker: "SOL", name: "Solana", color: "#14F195" },
  { ticker: "HBAR", name: "Hedera", color: "#222222" },
  { ticker: "TRX", name: "TRON", color: "#FF060A" },
  { ticker: "DOGE", name: "Dogecoin", color: "#C2A633" },
  { ticker: "USDT", name: "Tether", color: "#26A17B" },
] as const;

type Crypto = (typeof CRYPTOS)[number];

function placeholderAddress(ticker: string) {
  const map: Record<string, string> = {
    BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ETH: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    XRP: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh",
    XLM: "GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6EFIBNDQTCQHGZJEUCB7Y6F",
    ADA: "addr1q9zw0xkmpgkc6t6qj3sff8hsh4xrjr8w6h6vd0xn5x9k4ll9z2",
    SOL: "7XSY3MrYxs5oU7GbSRksQqNs5wf1n4vnj5xK4mEGqWi9",
    HBAR: "0.0.123456",
    TRX: "TQrZ9wBxJkCKNmvc8yGyKt3wSxq3p8ME8q",
    DOGE: "D8vFz4p9L3stXUiYR1MBqbvVy4YQq6EnnH",
    USDT: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  };
  return map[ticker] ?? "";
}

export function CryptoDepositGrid() {
  const [active, setActive] = useState<Crypto | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {CRYPTOS.map((c) => (
          <button
            key={c.ticker}
            type="button"
            onClick={() => setActive(c)}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-elevated p-5 transition hover:border-gold hover:shadow-gold"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.ticker.slice(0, 3)}
            </span>
            <div className="text-center">
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p className="text-xs text-zinc-500">{c.ticker}</p>
            </div>
            <span className="text-xs font-medium text-gold opacity-0 transition group-hover:opacity-100">
              Deposit →
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6"
            >
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: active.color }}
                >
                  {active.ticker.slice(0, 3)}
                </span>
                <div>
                  <p className="font-medium text-white">Deposit {active.name}</p>
                  <p className="text-xs text-zinc-500">{active.ticker}</p>
                </div>
              </div>
              <div className="rounded-md border border-border bg-canvas p-4 font-mono text-xs break-all text-zinc-300">
                {placeholderAddress(active.ticker)}
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Send only {active.ticker} to this address. Other assets sent to
                this address may be lost.
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="btn-outline"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
