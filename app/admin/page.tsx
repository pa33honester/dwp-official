"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/forms/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getExplorerUrl, MULTI_CHAIN_ASSETS } from "@/lib/explorer-urls";

type Tab = "users" | "balances" | "addresses" | "deposits";

type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  vaultName: string | null;
  balanceUsd: number;
  hasWallet: boolean;
  createdAt: string;
};

type DepositAddress = {
  ticker: string;
  name: string;
  color: string;
  address: string;
};

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      const role = (data.session?.user.app_metadata as Record<string, unknown> | null)?.role;
      if (!data.session || role !== "admin") {
        router.replace("/login");
        return;
      }
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-elevated" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-white">
        Admin Console
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Create users, manage balances, and update deposit addresses.
      </p>

      <div className="mt-6 flex gap-2 border-b border-border">
        {(
          [
            ["users", "Create User"],
            ["balances", "Balances"],
            ["deposits", "Record Deposit"],
            ["addresses", "Deposit Addresses"],
          ] as Array<[Tab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
              tab === key
                ? "border-gold text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "users" && <CreateUserTab />}
        {tab === "balances" && <BalancesTab />}
        {tab === "deposits" && <DepositsTab />}
        {tab === "addresses" && <AddressesTab />}
      </div>
    </main>
  );
}

function CreateUserTab() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [vaultName, setVaultName] = useState("Main Vault");
  const [balanceUsd, setBalanceUsd] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email,
          password,
          fullName,
          vaultName: vaultName.trim() || undefined,
          balanceUsd: Number(balanceUsd),
        },
      });
      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string; userId?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      setMessage({ kind: "ok", text: `User created (${payload.userId}).` });
      setEmail("");
      setPassword("");
      setFullName("");
      setVaultName("Main Vault");
      setBalanceUsd("0");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to create user.";
      setMessage({ kind: "err", text });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Temporary password"
        type="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="Minimum 8 characters. Share with the user securely."
        required
      />
      <Input
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        label="Vault name"
        value={vaultName}
        onChange={(e) => setVaultName(e.target.value)}
        hint="A DWP wallet is created for every new user."
        required
      />
      <Input
        label="Initial balance (USD)"
        type="number"
        min="0"
        step="0.01"
        value={balanceUsd}
        onChange={(e) => setBalanceUsd(e.target.value)}
      />
      {message && (
        <p className={`text-xs ${message.kind === "ok" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn-gold w-full">
        {submitting ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}

function BalancesTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke("admin-list-users", {
        body: {},
      });
      if (invokeError) throw invokeError;
      const payload = data as { users?: AdminUser[]; error?: string };
      if (payload?.error) throw new Error(payload.error);
      setUsers(payload.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(userId: string) {
    setSavingId(userId);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const value = Number(edits[userId]);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("Enter a non-negative number.");
      }
      const { data, error: invokeError } = await supabase.functions.invoke("admin-set-balance", {
        body: { userId, balanceUsd: value },
      });
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      setSavedId(userId);
      setTimeout(() => setSavedId((c) => (c === userId ? null : c)), 1500);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save balance.");
    } finally {
      setSavingId(null);
    }
  }

  if (users === null) {
    return <p className="text-sm text-zinc-400">Loading users…</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {users.length === 0 ? (
        <p className="text-sm text-zinc-400">No users yet. Create one in the Create User tab.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-elevated text-left text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Vault</th>
                <th className="px-4 py-3">Current balance</th>
                <th className="px-4 py-3">Set balance (USD)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 align-top">
                    <p className="text-white">{u.fullName ?? "—"}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-300">
                    {u.vaultName ?? (
                      <span className="text-zinc-600">Auto-create on save</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-300">
                    {u.hasWallet ? fmtUsd(u.balanceUsd) : fmtUsd(0)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={String(u.balanceUsd)}
                      value={edits[u.id] ?? ""}
                      onChange={(e) =>
                        setEdits((c) => ({ ...c, [u.id]: e.target.value }))
                      }
                      className="input w-32"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      disabled={savingId === u.id || !edits[u.id]}
                      onClick={() => save(u.id)}
                      className="btn-outline text-xs"
                    >
                      {savingId === u.id
                        ? "Saving…"
                        : savedId === u.id
                          ? "Saved"
                          : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type DepositRecord = {
  id: string;
  user_id: string;
  asset: string;
  amount_usd: number | string;
  amount_crypto: number | string | null;
  tx_hash: string;
  network: string | null;
  note: string | null;
  created_at: string;
};

function DepositsTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [assets, setAssets] = useState<DepositAddress[] | null>(null);
  const [deposits, setDeposits] = useState<DepositRecord[] | null>(null);
  const [depositsError, setDepositsError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [asset, setAsset] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [amountCrypto, setAmountCrypto] = useState("");
  const [txHash, setTxHash] = useState("");
  const [network, setNetwork] = useState("");
  const [note, setNote] = useState("");
  const [alsoIncrementBalance, setAlsoIncrementBalance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function loadDeposits() {
    setDepositsError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("user_deposits")
      .select("id, user_id, asset, amount_usd, amount_crypto, tx_hash, network, note, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      setDepositsError(error.message);
      setDeposits([]);
      return;
    }
    setDeposits((data as DepositRecord[] | null) ?? []);
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.functions.invoke("admin-list-users", { body: {} }).then(({ data, error }) => {
      if (error) {
        setUsers([]);
        return;
      }
      const payload = data as { users?: AdminUser[] };
      setUsers(payload?.users ?? []);
    });
    supabase
      .from("deposit_addresses")
      .select("ticker, name, color, address")
      .order("ticker")
      .then(({ data }) => setAssets((data as DepositAddress[] | null) ?? []));
    loadDeposits();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const usd = Number(amountUsd);
      if (!Number.isFinite(usd) || usd <= 0) {
        throw new Error("Amount (USD) must be a positive number.");
      }
      const crypto = amountCrypto.trim() ? Number(amountCrypto) : null;
      if (crypto !== null && (!Number.isFinite(crypto) || crypto <= 0)) {
        throw new Error("Amount (crypto) must be a positive number if provided.");
      }
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.functions.invoke("admin-record-deposit", {
        body: {
          userId,
          asset,
          amountUsd: usd,
          amountCrypto: crypto,
          txHash: txHash.trim(),
          network: network.trim() || null,
          note: note.trim() || null,
          alsoIncrementBalance,
        },
      });
      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string; depositId?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      setMessage({ kind: "ok", text: `Deposit recorded (${payload.depositId}).` });
      setAmountUsd("");
      setAmountCrypto("");
      setTxHash("");
      setNetwork("");
      setNote("");
      await loadDeposits();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to record deposit.";
      setMessage({ kind: "err", text });
    } finally {
      setSubmitting(false);
    }
  }

  if (users === null || assets === null) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  const userById = new Map(users.map((u) => [u.id, u]));
  const assetByTicker = new Map(assets.map((a) => [a.ticker, a]));

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6"
      >
      <label className="block text-xs uppercase tracking-wider text-zinc-400">
        User
        <select
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="input mt-1 w-full"
        >
          <option value="">Select a user…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {(u.fullName ?? u.email) ?? u.id} {u.email ? `(${u.email})` : ""}
            </option>
          ))}
        </select>
      </label>

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
        hint="Native token amount, e.g. 0.05 for BTC."
      />
      <Input
        label="Transaction hash"
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
        hint="Used as proof; will link to the relevant block explorer."
        required
      />
      {MULTI_CHAIN_ASSETS[asset] && (
        <label className="block text-xs uppercase tracking-wider text-zinc-400">
          Network
          <select
            required
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="input mt-1 w-full"
          >
            {MULTI_CHAIN_ASSETS[asset].map((o) => (
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

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={alsoIncrementBalance}
          onChange={(e) => setAlsoIncrementBalance(e.target.checked)}
        />
        Also add this amount to the user&apos;s portfolio balance
      </label>

      {message && (
        <p className={`text-xs ${message.kind === "ok" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn-gold w-full">
        {submitting ? "Recording…" : "Record deposit"}
      </button>
      </form>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Recent deposits
          </h2>
          <button
            type="button"
            onClick={loadDeposits}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Refresh
          </button>
        </div>
        {depositsError && (
          <p className="mb-2 text-xs text-red-400">{depositsError}</p>
        )}
        {deposits === null ? (
          <p className="text-sm text-zinc-400">Loading deposits…</p>
        ) : deposits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-zinc-500">
            No deposits recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-sm">
              <thead className="bg-elevated text-left text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">TX hash</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => {
                  const u = userById.get(d.user_id);
                  const meta = assetByTicker.get(d.asset);
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
                        <p className="text-white">{u?.fullName ?? u?.email ?? "—"}</p>
                        <p className="text-xs text-zinc-500">{u?.email ?? d.user_id}</p>
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
                        <p className="text-white">{fmtUsd(Number(d.amount_usd))}</p>
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
                      <td className="px-4 py-3 align-top text-zinc-300">
                        {d.note ?? <span className="text-zinc-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AddressesTab() {
  const [rows, setRows] = useState<DepositAddress[] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingTicker, setSavingTicker] = useState<string | null>(null);
  const [savedTicker, setSavedTicker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: queryError } = await supabase
      .from("deposit_addresses")
      .select("ticker, name, color, address")
      .order("ticker");
    if (queryError) {
      setError(queryError.message);
      setRows([]);
      return;
    }
    setRows((data as DepositAddress[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(ticker: string) {
    setSavingTicker(ticker);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const address = (edits[ticker] ?? "").trim();
      const { data, error: invokeError } = await supabase.functions.invoke("admin-update-address", {
        body: { ticker, address },
      });
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      setSavedTicker(ticker);
      setTimeout(() => setSavedTicker((c) => (c === ticker ? null : c)), 1500);
      setEdits((c) => {
        const next = { ...c };
        delete next[ticker];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setSavingTicker(null);
    }
  }

  if (rows === null) {
    return <p className="text-sm text-zinc-400">Loading addresses…</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-elevated text-left text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Current address</th>
              <th className="px-4 py-3">New address</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticker} className="border-t border-border">
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: r.color }}
                    >
                      {r.ticker.slice(0, 3)}
                    </span>
                    <div>
                      <p className="text-white">{r.name}</p>
                      <p className="text-xs text-zinc-500">{r.ticker}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="font-mono text-xs break-all text-zinc-300">
                    {r.address || <span className="text-zinc-600">Not set</span>}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="text"
                    placeholder={r.address || "Enter deposit address"}
                    value={edits[r.ticker] ?? ""}
                    onChange={(e) =>
                      setEdits((c) => ({ ...c, [r.ticker]: e.target.value }))
                    }
                    className="input w-full min-w-[260px] font-mono text-xs"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <button
                    type="button"
                    disabled={savingTicker === r.ticker || !edits[r.ticker]}
                    onClick={() => save(r.ticker)}
                    className="btn-outline text-xs"
                  >
                    {savingTicker === r.ticker
                      ? "Saving…"
                      : savedTicker === r.ticker
                        ? "Saved"
                        : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
