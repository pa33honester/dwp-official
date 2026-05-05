"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CryptoDepositGrid } from "@/components/CryptoDepositGrid";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getExplorerUrl, MULTI_CHAIN_ASSETS } from "@/lib/explorer-urls";
import { Input } from "@/components/forms/Field";

type WalletApplication = {
  vault_name: string | null;
  connected_address: string | null;
  balance_usd: number | string | null;
  locked_balance_usd: number | string | null;
  return_earnings_usd: number | string | null;
  daily_withdrawal_limit_usd: number | string | null;
};

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

type DepositRow = {
  id: string;
  asset: string;
  amount_usd: number | string;
  amount_crypto: number | string | null;
  tx_hash: string;
  network: string | null;
  note: string | null;
  created_at: string;
};

type WithdrawalRow = {
  id: string;
  asset: string;
  amount_usd: number | string;
  amount_crypto: number | string | null;
  destination_address: string;
  network: string | null;
  note: string | null;
  status: "pending" | "completed" | "rejected";
  tx_hash: string | null;
  admin_note: string | null;
  created_at: string;
};

type LedgerEntry =
  | { kind: "deposit"; row: DepositRow; t: number }
  | { kind: "withdrawal"; row: WithdrawalRow; t: number };

type AssetMeta = { ticker: string; name: string; color: string };

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<WalletApplication | null>(null);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [assets, setAssets] = useState<AssetMeta[]>([]);
  const [assetMeta, setAssetMeta] = useState<Record<string, AssetMeta>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { address, connector, isConnected } = useAccount();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const uid = data.session.user.id;
      setUserId(uid);
      await reloadAll(uid);
      setReady(true);
    });
  }, [router]);

  async function reloadAll(uid: string) {
    const supabase = createSupabaseBrowserClient();
    const [walletRes, depositsRes, withdrawalsRes, assetsRes] = await Promise.all([
      supabase
        .from("wallet_applications")
        .select(
          "vault_name, connected_address, balance_usd, locked_balance_usd, return_earnings_usd, daily_withdrawal_limit_usd",
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("user_deposits")
        .select("id, asset, amount_usd, amount_crypto, tx_hash, network, note, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_withdrawals")
        .select(
          "id, asset, amount_usd, amount_crypto, destination_address, network, note, status, tx_hash, admin_note, created_at",
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("deposit_addresses").select("ticker, name, color"),
    ]);
    setWallet(walletRes.data as WalletApplication | null);
    setDeposits((depositsRes.data as DepositRow[] | null) ?? []);
    setWithdrawals((withdrawalsRes.data as WithdrawalRow[] | null) ?? []);
    const list = (assetsRes.data as AssetMeta[] | null) ?? [];
    setAssets(list);
    const meta: Record<string, AssetMeta> = {};
    for (const a of list) meta[a.ticker] = a;
    setAssetMeta(meta);
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createSupabaseBrowserClient();
    const nextAddress = isConnected && address ? address : null;
    const nextConnector = isConnected && connector?.name ? connector.name : null;
    if (
      (wallet?.connected_address ?? null) === nextAddress &&
      (nextAddress === null || wallet?.connected_address === nextAddress)
    ) {
      return;
    }
    (async () => {
      const { data: latest } = await supabase
        .from("wallet_applications")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latest) return;
      await supabase
        .from("wallet_applications")
        .update({
          connected_address: nextAddress,
          connector_type: nextConnector,
          updated_at: new Date().toISOString(),
        })
        .eq("id", latest.id);
      setWallet((prev) =>
        prev ? { ...prev, connected_address: nextAddress } : prev,
      );
    })();
  }, [userId, address, connector, isConnected, wallet?.connected_address]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-elevated" />
        <div className="mt-4 h-12 w-64 animate-pulse rounded bg-elevated" />
        <div className="mt-10 h-40 animate-pulse rounded-2xl bg-elevated/50" />
      </main>
    );
  }

  const totalUsd = Number(wallet?.balance_usd ?? 0);
  const lockedUsd = Number(wallet?.locked_balance_usd ?? 0);
  const returnUsd = Number(wallet?.return_earnings_usd ?? 0);
  const dailyLimitUsd = Number(wallet?.daily_withdrawal_limit_usd ?? 0);
  const pendingWithdrawalsUsd = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((acc, w) => acc + Number(w.amount_usd ?? 0), 0);
  const availableUsd = Math.max(0, totalUsd - lockedUsd);
  const activated = totalUsd > 0 || deposits.length > 0 || withdrawals.length > 0;

  const ledger: LedgerEntry[] = [
    ...deposits.map<LedgerEntry>((d) => ({
      kind: "deposit",
      row: d,
      t: new Date(d.created_at).getTime(),
    })),
    ...withdrawals.map<LedgerEntry>((w) => ({
      kind: "withdrawal",
      row: w,
      t: new Date(w.created_at).getTime(),
    })),
  ].sort((a, b) => b.t - a.t);

  const allocation = (() => {
    const totals = new Map<string, number>();
    let sum = 0;
    for (const d of deposits) {
      const v = Number(d.amount_usd);
      if (!Number.isFinite(v) || v <= 0) continue;
      totals.set(d.asset, (totals.get(d.asset) ?? 0) + v);
      sum += v;
    }
    if (sum === 0) return null;
    const slices = Array.from(totals.entries())
      .map(([asset, value]) => ({
        asset,
        value,
        pct: (value / sum) * 100,
        color: assetMeta[asset]?.color ?? "#666",
        name: assetMeta[asset]?.name ?? asset,
      }))
      .sort((a, b) => b.value - a.value);
    let cursor = 0;
    const stops = slices.map((s) => {
      const start = cursor;
      cursor += s.pct;
      return `${s.color} ${start}% ${cursor}%`;
    });
    return { slices, gradient: `conic-gradient(${stops.join(", ")})`, sum };
  })();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-400">
          Welcome back{wallet?.vault_name ? `, ${wallet.vault_name}` : ""}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Portfolio Value
            </p>
            <p className="font-display text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
              {fmtUsd(totalUsd)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {availableUsd - pendingWithdrawalsUsd > 0 && (
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="btn-outline text-sm"
              >
                Withdraw
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("quick-deposit")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="btn-gold text-sm"
            >
              Deposit
            </button>
            <Link
              href="/profile"
              className="rounded-md border border-border bg-elevated px-3 py-1.5 text-sm text-zinc-300 transition hover:border-gold/40 hover:text-gold"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>

      {activated && (
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Portfolio" value={fmtUsd(totalUsd)} />
          <StatCard label="Available Balance" value={fmtUsd(availableUsd)} />
          <StatCard label="Locked / Staked" value={fmtUsd(lockedUsd)} />
          <StatCard
            label="Return Earnings"
            value={`${returnUsd >= 0 ? "+" : "-"}${fmtUsd(Math.abs(returnUsd))}`}
            tone={returnUsd >= 0 ? "positive" : "negative"}
          />
        </section>
      )}

      {activated && (
        <section className="mt-10">
          <PortfolioChart deposits={deposits} balanceUsd={totalUsd} />
        </section>
      )}

      {activated && allocation && (
        <section className="mt-10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
            Asset Allocation
          </h3>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-start sm:gap-10">
            <div
              className="relative h-48 w-48 shrink-0 rounded-full"
              style={{ background: allocation.gradient }}
              aria-label="Asset allocation chart"
              role="img"
            >
              <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-surface text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Holdings
                </p>
                <p className="text-lg font-semibold text-white">
                  {fmtUsd(allocation.sum)}
                </p>
              </div>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {allocation.slices.map((s) => (
                <li
                  key={s.asset}
                  className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-none"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-white">{s.name}</span>
                    <span className="text-xs text-zinc-500">{s.asset}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{fmtUsd(s.value)}</p>
                    <p className="text-xs text-zinc-500">{s.pct.toFixed(1)}%</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold">
          Transaction History
          {ledger.length > 0 && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
              {ledger.length}
            </span>
          )}
        </h3>
        {ledger.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-zinc-500">
            No transactions yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-sm">
              <thead className="bg-elevated text-left text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <LedgerRow
                    key={`${entry.kind}-${entry.row.id}`}
                    entry={entry}
                    assetMeta={assetMeta}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!activated && (
        <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center sm:p-10">
          <h2 className="text-lg font-medium text-white">
            Deposit crypto to activate your wallet environment
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Choose an asset below to view your deposit address. All deposits are
            received into your DWP-secured custody wallet.
          </p>
        </section>
      )}

      <section id="quick-deposit" className="mt-8 scroll-mt-20">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
          Quick Deposit
        </h3>
        <CryptoDepositGrid />
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gold">
          Linked Wallet
        </h3>
        <p className="mb-4 text-xs text-zinc-500">
          Optional. Link an external wallet (MetaMask, Trust, Coinbase Wallet, etc.)
          for reference. DWP custody is independent of this connection.
        </p>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;
            if (!ready) {
              return (
                <div
                  aria-hidden
                  style={{ opacity: 0, pointerEvents: "none", userSelect: "none" }}
                />
              );
            }
            if (!connected) {
              return (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="btn-gold text-sm"
                >
                  Connect Wallet
                </button>
              );
            }
            if (chain.unsupported) {
              return (
                <button
                  type="button"
                  onClick={openChainModal}
                  className="btn-outline text-xs text-red-400"
                >
                  Wrong network
                </button>
              );
            }
            return (
              <button
                type="button"
                onClick={openAccountModal}
                className="rounded-md border border-border bg-elevated px-3 py-1.5 text-xs text-zinc-400 break-all hover:border-gold/40"
              >
                Wallet: <span className="text-gold">{account.displayName}</span>
              </button>
            );
          }}
        </ConnectButton.Custom>
      </section>

      {withdrawOpen && userId && (
        <WithdrawDialog
          assets={assets}
          available={Math.max(0, availableUsd - pendingWithdrawalsUsd)}
          dailyLimit={dailyLimitUsd}
          onClose={() => setWithdrawOpen(false)}
          onSubmitted={async () => {
            setWithdrawOpen(false);
            await reloadAll(userId);
          }}
        />
      )}
    </main>
  );
}

function LedgerRow({
  entry,
  assetMeta,
}: {
  entry: LedgerEntry;
  assetMeta: Record<string, AssetMeta>;
}) {
  const asset = entry.row.asset;
  const meta = assetMeta[asset];
  const amount = Number(entry.row.amount_usd);
  const date = new Date(entry.row.created_at).toLocaleString();

  if (entry.kind === "deposit") {
    const d = entry.row;
    const explorer = getExplorerUrl(d.asset, d.tx_hash, d.network);
    const shortHash =
      d.tx_hash.length > 14 ? `${d.tx_hash.slice(0, 8)}…${d.tx_hash.slice(-6)}` : d.tx_hash;
    return (
      <tr className="border-t border-border">
        <td className="px-4 py-3 align-top text-zinc-300">{date}</td>
        <td className="px-4 py-3 align-top">
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
            ↓ Deposit
          </span>
        </td>
        <td className="px-4 py-3 align-top">
          <AssetCell asset={asset} meta={meta} />
        </td>
        <td className="px-4 py-3 align-top">
          <p className="text-white">{fmtUsd(amount)}</p>
          {d.amount_crypto !== null && (
            <p className="text-xs text-zinc-500">
              {Number(d.amount_crypto)} {asset}
            </p>
          )}
        </td>
        <td className="px-4 py-3 align-top font-mono text-xs">
          {explorer ? (
            <a
              href={explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              {shortHash} ↗
            </a>
          ) : (
            <span className="break-all text-zinc-300">{shortHash}</span>
          )}
        </td>
      </tr>
    );
  }

  const w = entry.row;
  const explorer = w.tx_hash ? getExplorerUrl(w.asset, w.tx_hash, w.network) : null;
  const shortHash =
    w.tx_hash && w.tx_hash.length > 14
      ? `${w.tx_hash.slice(0, 8)}…${w.tx_hash.slice(-6)}`
      : w.tx_hash;
  const shortDest =
    w.destination_address.length > 14
      ? `${w.destination_address.slice(0, 8)}…${w.destination_address.slice(-6)}`
      : w.destination_address;
  const statusPill =
    w.status === "pending"
      ? "bg-yellow-500/10 text-yellow-400"
      : w.status === "completed"
        ? "bg-green-500/10 text-green-400"
        : "bg-red-500/10 text-red-400";
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 align-top text-zinc-300">{date}</td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col gap-1">
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
            ↑ Withdrawal
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusPill}`}>
            {w.status[0].toUpperCase() + w.status.slice(1)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <AssetCell asset={asset} meta={meta} />
      </td>
      <td className="px-4 py-3 align-top">
        <p className="text-red-400">−{fmtUsd(amount)}</p>
        {w.amount_crypto !== null && (
          <p className="text-xs text-zinc-500">
            {Number(w.amount_crypto)} {asset}
          </p>
        )}
      </td>
      <td className="px-4 py-3 align-top font-mono text-xs">
        {w.status === "completed" && shortHash ? (
          explorer ? (
            <a
              href={explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              {shortHash} ↗
            </a>
          ) : (
            <span className="break-all text-zinc-300">{shortHash}</span>
          )
        ) : (
          <div className="space-y-1">
            <p className="text-zinc-500">to</p>
            <p className="break-all text-zinc-300">{shortDest}</p>
            {w.status === "rejected" && w.admin_note && (
              <p className="font-sans text-[10px] text-red-400">
                Rejected: {w.admin_note}
              </p>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function AssetCell({ asset, meta }: { asset: string; meta?: AssetMeta }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: meta?.color ?? "#444" }}
      >
        {asset.slice(0, 3)}
      </span>
      <div>
        <p className="text-white">{meta?.name ?? asset}</p>
        <p className="text-xs text-zinc-500">{asset}</p>
      </div>
    </div>
  );
}

function WithdrawDialog({
  assets,
  available,
  dailyLimit,
  onClose,
  onSubmitted,
}: {
  assets: AssetMeta[];
  available: number;
  dailyLimit: number;
  onClose: () => void;
  onSubmitted: () => void | Promise<void>;
}) {
  const [asset, setAsset] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [amountCrypto, setAmountCrypto] = useState("");
  const [destination, setDestination] = useState("");
  const [network, setNetwork] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const usd = Number(amountUsd);
      if (!Number.isFinite(usd) || usd <= 0) throw new Error("Enter a positive amount.");
      if (usd > available) throw new Error(`Only ${fmtUsd(available)} available.`);
      const crypto = amountCrypto.trim() ? Number(amountCrypto) : null;
      if (crypto !== null && (!Number.isFinite(crypto) || crypto <= 0)) {
        throw new Error("Crypto amount must be positive if provided.");
      }
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke(
        "user-request-withdrawal",
        {
          body: {
            asset,
            amountUsd: usd,
            amountCrypto: crypto,
            destinationAddress: destination.trim(),
            network: network.trim() || null,
            note: note.trim() || null,
          },
        },
      );
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      await onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request withdrawal.");
    } finally {
      setSubmitting(false);
    }
  }

  const networkOptions = asset ? MULTI_CHAIN_ASSETS[asset] : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6"
      >
        <div>
          <h3 className="font-display text-xl font-semibold text-white">Withdraw</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Available: {fmtUsd(available)}
            {dailyLimit > 0 && ` · Daily limit: ${fmtUsd(dailyLimit)}`}
          </p>
        </div>
        <label className="block text-xs uppercase tracking-wider text-zinc-400">
          Asset
          <select
            required
            value={asset}
            onChange={(e) => {
              const next = e.target.value;
              setAsset(next);
              const opts = MULTI_CHAIN_ASSETS[next];
              setNetwork(opts ? opts[0].value : "");
            }}
            className="input mt-1 w-full"
          >
            <option value="">Select an asset…</option>
            {assets.map((a) => (
              <option key={a.ticker} value={a.ticker}>
                {a.name} ({a.ticker})
              </option>
            ))}
          </select>
        </label>
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
          label="Amount in crypto (optional)"
          type="number"
          min="0"
          step="any"
          value={amountCrypto}
          onChange={(e) => setAmountCrypto(e.target.value)}
        />
        <Input
          label="Destination address"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          hint="Where the asset should be sent. Double-check before submitting."
          required
        />
        {networkOptions && (
          <label className="block text-xs uppercase tracking-wider text-zinc-400">
            Network
            <select
              required
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="input mt-1 w-full"
            >
              {networkOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <Input
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="text-[10px] text-zinc-500">
          Withdrawals require admin approval. Your balance is reserved while the
          request is pending and refunded if rejected.
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-outline text-xs">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-gold text-xs">
            {submitting ? "Submitting…" : "Request withdrawal"}
          </button>
        </div>
      </form>
    </div>
  );
}

type Range = "1D" | "7D" | "1M" | "6M" | "1Y" | "ALL";

const RANGE_DAYS: Record<Range, number | null> = {
  "1D": 1,
  "7D": 7,
  "1M": 30,
  "6M": 180,
  "1Y": 365,
  ALL: null,
};

function PortfolioChart({
  deposits,
  balanceUsd,
}: {
  deposits: DepositRow[];
  balanceUsd: number;
}) {
  const [range, setRange] = useState<Range>("1M");
  const now = useMemo(() => Date.now(), []);

  const series = useMemo(() => {
    const sorted = [...deposits].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const points: { t: number; v: number }[] = [];
    let cum = 0;
    for (const d of sorted) {
      const t = new Date(d.created_at).getTime();
      points.push({ t, v: cum });
      cum += Number(d.amount_usd) || 0;
      points.push({ t, v: cum });
    }
    if (points.length === 0) {
      points.push({ t: now - 30 * 86400000, v: balanceUsd });
    }
    if (points[points.length - 1].v !== balanceUsd) {
      points.push({ t: now, v: balanceUsd });
    } else if (points[points.length - 1].t < now) {
      points.push({ t: now, v: balanceUsd });
    }
    return points;
  }, [deposits, balanceUsd, now]);

  const visible = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days === null) return series;
    const startTime = now - days * 86400000;
    if (series.length === 0) return [];
    let startValue = series[0].v;
    let firstInRangeIdx = series.length;
    for (let i = 0; i < series.length; i++) {
      if (series[i].t < startTime) {
        startValue = series[i].v;
      } else {
        firstInRangeIdx = i;
        break;
      }
    }
    return [{ t: startTime, v: startValue }, ...series.slice(firstInRangeIdx)];
  }, [series, range, now]);

  const W = 800;
  const H = 240;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xMin = visible[0]?.t ?? now;
  const xMax = visible[visible.length - 1]?.t ?? now;
  const xSpan = Math.max(1, xMax - xMin);
  const yMax = Math.max(1, ...visible.map((p) => p.v)) * 1.1;

  const xScale = (t: number) => padL + ((t - xMin) / xSpan) * innerW;
  const yScale = (v: number) => padT + innerH - (v / yMax) * innerH;

  const linePath = visible
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.t).toFixed(2)} ${yScale(p.v).toFixed(2)}`,
    )
    .join(" ");
  const areaPath =
    visible.length > 0
      ? `${linePath} L ${xScale(visible[visible.length - 1].t).toFixed(2)} ${yScale(0).toFixed(2)} L ${xScale(visible[0].t).toFixed(2)} ${yScale(0).toFixed(2)} Z`
      : "";

  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax * i) / 4);
  const xTickCount = 6;
  const xTicks = Array.from(
    { length: xTickCount },
    (_, i) => xMin + (xSpan * i) / (xTickCount - 1),
  );

  const fmtDate = (t: number) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      new Date(t),
    );

  const fmtAxis = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
          Portfolio Overview
        </h3>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                range === r
                  ? "bg-gold text-zinc-900"
                  : "bg-elevated text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-60 w-full"
      >
        <defs>
          <linearGradient id="portfolio-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <g key={`y-${i}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="#27272A"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={padL - 8}
              y={yScale(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#71717A"
            >
              {fmtAxis(v)}
            </text>
          </g>
        ))}
        {areaPath && <path d={areaPath} fill="url(#portfolio-area)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#D4A24C"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {xTicks.map((t, i) => (
          <text
            key={`x-${i}`}
            x={xScale(t)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            fontSize="10"
            fill="#71717A"
          >
            {fmtDate(t)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? "text-green-400"
      : tone === "negative"
        ? "text-red-400"
        : "text-white";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 font-display text-xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
