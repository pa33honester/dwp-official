"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CryptoDepositGrid } from "@/components/CryptoDepositGrid";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getExplorerUrl } from "@/lib/explorer-urls";

type WalletApplication = {
  vault_name: string | null;
  connected_address: string | null;
  balance_usd: number | string | null;
  locked_balance_usd: number | string | null;
  return_earnings_usd: number | string | null;
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

type AssetMeta = { ticker: string; name: string; color: string };

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<WalletApplication | null>(null);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [assetMeta, setAssetMeta] = useState<Record<string, AssetMeta>>({});
  const [userId, setUserId] = useState<string | null>(null);
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
      const [walletRes, depositsRes, assetsRes] = await Promise.all([
        supabase
          .from("wallet_applications")
          .select("vault_name, connected_address, balance_usd, locked_balance_usd, return_earnings_usd")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_deposits")
          .select("id, asset, amount_usd, amount_crypto, tx_hash, network, note, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase.from("deposit_addresses").select("ticker, name, color"),
      ]);
      setWallet(walletRes.data as WalletApplication | null);
      setDeposits((depositsRes.data as DepositRow[] | null) ?? []);
      const meta: Record<string, AssetMeta> = {};
      for (const a of (assetsRes.data as AssetMeta[] | null) ?? []) {
        meta[a.ticker] = a;
      }
      setAssetMeta(meta);
      setReady(true);
    });
  }, [router]);

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
  const availableUsd = Math.max(0, totalUsd - lockedUsd);
  const activated = totalUsd > 0 || deposits.length > 0;

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
          {deposits.length > 0 && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
              {deposits.length}
            </span>
          )}
        </h3>
        {deposits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-zinc-500">
            No deposits yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-sm">
              <thead className="bg-elevated text-left text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Proof</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => {
                  const meta = assetMeta[d.asset];
                  const explorer = getExplorerUrl(d.asset, d.tx_hash, d.network);
                  const shortHash =
                    d.tx_hash.length > 14
                      ? `${d.tx_hash.slice(0, 8)}…${d.tx_hash.slice(-6)}`
                      : d.tx_hash;
                  return (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-3 align-top text-zinc-300">
                        {new Date(d.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: meta?.color ?? "#444" }}
                          >
                            {d.asset.slice(0, 3)}
                          </span>
                          <div>
                            <p className="text-white">{meta?.name ?? d.asset}</p>
                            <p className="text-xs text-zinc-500">{d.asset}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-white">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(Number(d.amount_usd))}
                        </p>
                        {d.amount_crypto !== null && (
                          <p className="text-xs text-zinc-500">
                            {Number(d.amount_crypto)} {d.asset}
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
                })}
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

      <section className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
          Quick Deposit
        </h3>
        <CryptoDepositGrid />
      </section>
    </main>
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
