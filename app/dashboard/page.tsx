"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoDepositGrid } from "@/components/CryptoDepositGrid";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type WalletApplication = {
  vault_name: string | null;
  connected_address: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<WalletApplication | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: row } = await supabase
        .from("wallet_applications")
        .select("vault_name, connected_address")
        .eq("user_id", data.session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setWallet(row as WalletApplication | null);
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-elevated" />
        <div className="mt-4 h-12 w-64 animate-pulse rounded bg-elevated" />
        <div className="mt-10 h-40 animate-pulse rounded-2xl bg-elevated/50" />
      </main>
    );
  }

  const connected = Boolean(wallet?.connected_address);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-400">Welcome back</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Portfolio Value
            </p>
            <p className="font-display text-4xl font-semibold text-white md:text-5xl">
              $0.00
            </p>
          </div>
          <div className="rounded-md border border-border bg-elevated px-3 py-1.5 text-xs text-zinc-400">
            Wallet:{" "}
            <span className="text-gold">
              {connected
                ? `${wallet?.connected_address?.slice(0, 6)}…${wallet?.connected_address?.slice(-4)}`
                : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
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
