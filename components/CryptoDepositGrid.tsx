"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DepositAddress = {
  ticker: string;
  name: string;
  color: string;
  address: string;
  qr_image_data_url: string | null;
};

export function CryptoDepositGrid() {
  const [rows, setRows] = useState<DepositAddress[] | null>(null);
  const [active, setActive] = useState<DepositAddress | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("deposit_addresses")
      .select("ticker, name, color, address, qr_image_data_url")
      .order("ticker")
      .then(({ data }) => {
        setRows((data as DepositAddress[] | null) ?? []);
      });
  }, []);

  async function copyAddress() {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard might be blocked in some browsers
    }
  }

  if (rows === null) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-[124px] animate-pulse rounded-xl border border-border bg-elevated/40"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Deposit addresses are not yet configured. Please check back shortly.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {rows.map((c) => {
          const ready = c.address.trim().length > 0;
          return (
            <button
              key={c.ticker}
              type="button"
              disabled={!ready}
              onClick={() => ready && setActive(c)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-elevated p-5 transition enabled:hover:border-gold enabled:hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-60"
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
              <span className="text-xs font-medium text-gold opacity-0 transition group-enabled:group-hover:opacity-100">
                {ready ? "Deposit →" : "Coming soon"}
              </span>
            </button>
          );
        })}
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

              <div className="mx-auto mb-4 flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
                {active.qr_image_data_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.qr_image_data_url}
                    alt={`${active.ticker} deposit QR`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-canvas text-center">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      QR
                    </span>
                    <span className="text-xs text-zinc-600">
                      Coming soon
                    </span>
                  </div>
                )}
              </div>

              <p className="mb-2 text-center text-xs uppercase tracking-wider text-zinc-500">
                Your {active.ticker} Address
              </p>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 rounded-md border border-border bg-canvas p-3 font-mono text-xs break-all text-zinc-300">
                  {active.address}
                </div>
                <button
                  type="button"
                  onClick={copyAddress}
                  aria-label="Copy address"
                  title={copied ? "Copied!" : "Copy address"}
                  className="flex h-auto w-10 shrink-0 items-center justify-center rounded-md border border-border bg-elevated text-zinc-400 transition hover:border-gold hover:text-gold"
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="9"
                        y="9"
                        width="11"
                        height="11"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 15V6a2 2 0 0 1 2-2h9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
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
