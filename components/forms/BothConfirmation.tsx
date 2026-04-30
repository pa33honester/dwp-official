"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ConnectWalletPanel } from "@/components/ConnectWalletPanel";

export function BothConfirmation() {
  const [showConnect, setShowConnect] = useState(false);

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          Welcome to DigitalWealth
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Your wallet has been successfully secured. Your Digital Asset LLC
          application has been submitted to our legal team for review. In the
          meantime, you may fund your wallet and begin utilizing your DWP
          secure wallet while your LLC structure is being finalized.
        </p>
      </div>

      <ul className="grid w-full max-w-xl grid-cols-1 gap-3 text-left text-sm md:grid-cols-3">
        <li className="rounded-xl border border-border bg-elevated p-4">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-gold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="font-medium text-white">Wallet secured</p>
          <p className="mt-1 text-xs text-zinc-400">
            Your DWP custody wallet is live and ready for deposits.
          </p>
        </li>
        <li className="rounded-xl border border-border bg-elevated p-4">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-gold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 8h10M7 12h10M7 16h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="font-medium text-white">LLC under review</p>
          <p className="mt-1 text-xs text-zinc-400">
            Submitted to our legal team. We&apos;ll be in touch within 1–2
            business days.
          </p>
        </li>
        <li className="rounded-xl border border-border bg-elevated p-4">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-gold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h12m0 0-4-4m4 4-4 4M21 5v14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="font-medium text-white">Fund &amp; transact</p>
          <p className="mt-1 text-xs text-zinc-400">
            Use your wallet immediately while the LLC structure is finalized.
          </p>
        </li>
      </ul>

      {showConnect ? (
        <div className="w-full max-w-md">
          <ConnectWalletPanel />
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowConnect(false)}
              className="btn-outline"
            >
              Back
            </button>
            <Link href="/dashboard" className="btn-gold">
              Continue to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowConnect(true)}
            className="btn-gold"
          >
            Connect Wallet
          </button>
          <Link href="/dashboard" className="btn-outline">
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
