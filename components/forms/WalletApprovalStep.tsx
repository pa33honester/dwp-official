"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ConnectWalletPanel } from "@/components/ConnectWalletPanel";

export function WalletApprovalStep({
  onSkip,
}: {
  onSkip: () => void;
}) {
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

      <div>
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          Successfully Approved
        </h2>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          Your DWP Secured Wallet is ready. Connect an existing wallet now or
          skip and transfer funds later.
        </p>
      </div>

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
          <button type="button" onClick={onSkip} className="btn-outline">
            Skip & Transfer Later
          </button>
        </div>
      )}
    </div>
  );
}
