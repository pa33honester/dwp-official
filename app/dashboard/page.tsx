"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoDepositGrid } from "@/components/CryptoDepositGrid";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getExplorerUrl } from "@/lib/explorer-urls";

type WalletApplication = {
  vault_name: string | null;
  connected_address: string | null;
  balance_usd: number | string | null;
};

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

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const userId = data.session.user.id;
      const [walletRes, depositsRes, assetsRes] = await Promise.all([
        supabase
          .from("wallet_applications")
          .select("vault_name, connected_address, balance_usd")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_deposits")
          .select("id, asset, amount_usd, amount_crypto, tx_hash, network, note, created_at")
          .eq("user_id", userId)
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

  if (!ready) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-elevated" />
        <div className="mt-4 h-12 w-64 animate-pulse rounded bg-elevated" />
        <div className="mt-10 h-40 animate-pulse rounded-2xl bg-elevated/50" />
      </main>
    );
  }

  const connected = Boolean(wallet?.connected_address);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-400">Welcome back</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Portfolio Value
            </p>
            <p className="font-display text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(wallet?.balance_usd ?? 0))}
            </p>
          </div>
          <div className="rounded-md border border-border bg-elevated px-3 py-1.5 text-xs text-zinc-400 break-all">
            Wallet:{" "}
            <span className="text-gold">
              {connected
                ? `${wallet?.connected_address?.slice(0, 6)}…${wallet?.connected_address?.slice(-4)}`
                : "Not connected"}
            </span>
          </div>
        </div>
      </div>

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

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center sm:p-10">
        <h2 className="text-lg font-medium text-white">
          Deposit crypto to activate your wallet environment
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
          Choose an asset below to view your deposit address. All deposits are
          received into your DWP-secured custody wallet.
        </p>
      </section>

      <section className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
          Quick Deposit
        </h3>
        <CryptoDepositGrid />
      </section>
    </main>
  );
}
