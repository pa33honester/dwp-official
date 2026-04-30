import { CryptoDepositGrid } from "@/components/CryptoDepositGrid";

export const metadata = {
  title: "Portfolio — DigitalWealth Partners",
};

export default function DashboardPage() {
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
            Wallet: <span className="text-gold">Not connected</span>
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
