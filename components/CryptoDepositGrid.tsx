"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/forms/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DepositAddress = {
  ticker: string;
  name: string;
  color: string;
  address: string;
  qr_image_data_url: string | null;
};

export function CryptoDepositGrid({
  onSubmitted,
}: {
  onSubmitted?: () => void | Promise<void>;
}) {
  const [rows, setRows] = useState<DepositAddress[] | null>(null);
  const [active, setActive] = useState<DepositAddress | null>(null);

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
          <DepositAssetModal
            asset={active}
            onClose={() => setActive(null)}
            onSubmitted={async () => {
              setActive(null);
              if (onSubmitted) await onSubmitted();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function DepositAssetModal({
  asset,
  onClose,
  onSubmitted,
}: {
  asset: DepositAddress;
  onClose: () => void;
  onSubmitted: () => void | Promise<void>;
}) {
  const [amountUsd, setAmountUsd] = useState("");
  const [amountCrypto, setAmountCrypto] = useState("");
  const [senderInitials, setSenderInitials] = useState("");
  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedAmount, setSubmittedAmount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const submitted = submittedAmount !== null;

  async function copyAddress() {
    if (!asset.address) return;
    try {
      await navigator.clipboard.writeText(asset.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const usd = Number(amountUsd);
      if (!Number.isFinite(usd) || usd <= 0) throw new Error("Enter a positive amount.");
      const crypto = amountCrypto.trim() ? Number(amountCrypto) : null;
      if (crypto !== null && (!Number.isFinite(crypto) || crypto <= 0)) {
        throw new Error("Crypto amount must be positive if provided.");
      }
      if (!senderInitials.trim()) throw new Error("Sender initials are required.");
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke(
        "user-request-deposit",
        {
          body: {
            asset: asset.ticker,
            amountUsd: usd,
            amountCrypto: crypto,
            senderInitials: senderInitials.trim(),
            txHash: txHash.trim() || null,
            note: note.trim() || null,
          },
        },
      );
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      setSubmittedAmount(usd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit deposit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={submitted ? onSubmitted : onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: asset.color }}
          >
            {asset.ticker.slice(0, 3)}
          </span>
          <div>
            <p className="font-medium text-white">Deposit {asset.name}</p>
            <p className="text-xs text-zinc-500">{asset.ticker}</p>
          </div>
        </div>

        <div className="mx-auto mb-4 flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
          {asset.qr_image_data_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.qr_image_data_url}
              alt={`${asset.ticker} deposit QR`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-canvas text-center">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                QR
              </span>
              <span className="text-xs text-zinc-600">Coming soon</span>
            </div>
          )}
        </div>

        <p className="mb-2 text-center text-xs uppercase tracking-wider text-zinc-500">
          Your {asset.ticker} Address
        </p>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 rounded-md border border-border bg-canvas p-3 font-mono text-xs break-all text-zinc-300">
            {asset.address}
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
          Send only {asset.ticker} to this address. Other assets sent here may be lost.
        </p>

        <hr className="my-5 border-border" />

        {submitted ? (
          <div className="space-y-3 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 text-green-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="font-display text-lg font-semibold text-white">
              Request submitted
            </p>
            <p className="text-sm text-zinc-300">
              Send{" "}
              <span className="font-semibold text-white">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(submittedAmount!)}
              </span>{" "}
              of {asset.name} to the address above. Admin will verify and credit
              your portfolio. You&apos;ll see a Pending row in Transaction History
              until then.
            </p>
            <button
              type="button"
              onClick={() => onSubmitted()}
              className="btn-gold mt-2 text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Submit deposit details
            </p>
            <Input
              label="Amount (USD)"
              type="number"
              min="0"
              step="0.01"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              required
            />
            <Input
              label={`Amount in ${asset.ticker} (optional)`}
              type="number"
              min="0"
              step="any"
              value={amountCrypto}
              onChange={(e) => setAmountCrypto(e.target.value)}
            />
            <Input
              label="Sender initials"
              value={senderInitials}
              onChange={(e) => setSenderInitials(e.target.value)}
              hint="Acts as a signature so admin can attribute the on-chain transfer to you."
              required
            />
            <Input
              label="Transaction hash (optional)"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              hint="Paste once you have it. Speeds up verification."
            />
            <Input
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-outline text-xs">
                Close
              </button>
              <button type="submit" disabled={submitting} className="btn-gold text-xs">
                {submitting ? "Submitting…" : "Submit deposit"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
