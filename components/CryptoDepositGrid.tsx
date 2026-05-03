"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DepositAddress = {
  ticker: string;
  name: string;
  color: string;
  address: string;
};

export function CryptoDepositGrid() {
  const [rows, setRows] = useState<DepositAddress[] | null>(null);
  const [active, setActive] = useState<DepositAddress | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("deposit_addresses")
      .select("ticker, name, color, address")
      .order("ticker")
      .then(({ data }) => {
        setRows((data as DepositAddress[] | null) ?? []);
      });
  }, []);

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
              <div className="rounded-md border border-border bg-canvas p-4 font-mono text-xs break-all text-zinc-300">
                {active.address}
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
