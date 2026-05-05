"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/forms/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getExplorerUrl, MULTI_CHAIN_ASSETS } from "@/lib/explorer-urls";

type Tab = "users" | "addresses" | "deposits" | "withdrawals";

type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  vaultName: string | null;
  balanceUsd: number;
  lockedBalanceUsd: number;
  returnEarningsUsd: number;
  dailyWithdrawalLimitUsd: number;
  hasWallet: boolean;
  role: "admin" | "user" | null;
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
            ["users", "Users"],
            ["deposits", "Deposits"],
            ["withdrawals", "Withdrawals"],
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
        {tab === "users" && <UsersTab />}
        {tab === "deposits" && <DepositsTab />}
        {tab === "withdrawals" && <WithdrawalsTab />}
        {tab === "addresses" && <AddressesTab />}
      </div>
    </main>
  );
}

function CreateUserDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [vaultName, setVaultName] = useState("Main Vault");
  const [balanceUsd, setBalanceUsd] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke(
        "admin-create-user",
        {
          body: {
            email,
            password,
            fullName,
            vaultName: vaultName.trim() || undefined,
            balanceUsd: Number(balanceUsd),
          },
        },
      );
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string; userId?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

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
        <h3 className="font-display text-xl font-semibold text-white">Create user</h3>
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
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-outline text-xs">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-gold text-xs">
            {submitting ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null);
    });
    load();
  }, []);

  async function saveBalance(userId: string) {
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

  async function deleteUser(u: AdminUser) {
    if (!window.confirm(`Delete ${u.email ?? u.id}? This cannot be undone.`)) return;
    setDeletingId(u.id);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: u.id },
      });
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  if (users === null) {
    return <p className="text-sm text-zinc-400">Loading users…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {users.length} user{users.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn-gold text-xs"
        >
          + Create User
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {users.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-zinc-500">
          No users yet. Click <span className="text-gold">+ Create User</span> to add one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-elevated text-left text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Vault</th>
                <th className="px-4 py-3">Current balance</th>
                <th className="px-4 py-3">Set balance (USD)</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <p className="text-white">{u.fullName ?? "—"}</p>
                        {u.role === "admin" && (
                          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                            Admin
                          </span>
                        )}
                      </div>
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
                      <button
                        type="button"
                        disabled={savingId === u.id || !edits[u.id]}
                        onClick={() => saveBalance(u.id)}
                        className="btn-outline ml-2 text-xs"
                      >
                        {savingId === u.id
                          ? "Saving…"
                          : savedId === u.id
                            ? "Saved"
                            : "Save"}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(u)}
                          className="btn-outline text-xs"
                        >
                          Edit
                        </button>
                        {!isSelf && u.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => deleteUser(u)}
                            disabled={deletingId === u.id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:text-zinc-600"
                          >
                            {deletingId === u.id ? "Deleting…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditUserDialog
          user={editing}
          isSelf={editing.id === currentUserId}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      {creating && (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function PercentField({
  label,
  raw,
  onRawChange,
  mode,
  onModeChange,
  resolved,
  total,
  allowNegative = false,
}: {
  label: string;
  raw: string;
  onRawChange: (v: string) => void;
  mode: "$" | "%";
  onModeChange: (m: "$" | "%") => void;
  resolved: number | null;
  total: number;
  allowNegative?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-zinc-400">
        {label}
        <div className="mt-1 flex items-stretch gap-2">
          <input
            type="number"
            step="0.01"
            min={allowNegative ? undefined : "0"}
            value={raw}
            onChange={(e) => onRawChange(e.target.value)}
            className="input flex-1"
          />
          <div className="inline-flex overflow-hidden rounded-md border border-border">
            {(["$", "%"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                className={`px-3 text-xs ${
                  mode === m ? "bg-gold text-zinc-900" : "bg-elevated text-zinc-400"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </label>
      {mode === "%" && resolved !== null && (
        <p className="mt-1 text-[10px] text-zinc-500">
          ≈ {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(resolved)}{" "}
          (of {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)} total)
        </p>
      )}
    </div>
  );
}

function resolveValue(
  raw: string,
  mode: "$" | "%",
  total: number,
): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return mode === "%" ? (total * n) / 100 : n;
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function EditUserDialog({
  user,
  isSelf,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">(user.role === "admin" ? "admin" : "user");
  const [vaultName, setVaultName] = useState(user.vaultName ?? "");
  const [lockedRaw, setLockedRaw] = useState(String(user.lockedBalanceUsd ?? 0));
  const [lockedMode, setLockedMode] = useState<"$" | "%">("$");
  const [returnRaw, setReturnRaw] = useState(String(user.returnEarningsUsd ?? 0));
  const [returnMode, setReturnMode] = useState<"$" | "%">("$");
  const [dailyLimit, setDailyLimit] = useState(String(user.dailyWithdrawalLimitUsd ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Number(user.balanceUsd ?? 0);
  const lockedResolved = resolveValue(lockedRaw, lockedMode, total);
  const returnResolved = resolveValue(returnRaw, returnMode, total);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      type Body = {
        userId: string;
        fullName?: string;
        email?: string;
        password?: string;
        role?: "admin" | "user";
        vaultName?: string;
        lockedBalanceUsd?: number;
        returnEarningsUsd?: number;
        dailyWithdrawalLimitUsd?: number;
      };
      const body: Body = { userId: user.id };
      if (fullName.trim() && fullName.trim() !== (user.fullName ?? "")) {
        body.fullName = fullName.trim();
      }
      if (email.trim() && email.trim() !== (user.email ?? "")) {
        body.email = email.trim();
      }
      if (password) body.password = password;
      if (role !== (user.role === "admin" ? "admin" : "user")) body.role = role;
      if (vaultName.trim() && vaultName.trim() !== (user.vaultName ?? "")) {
        body.vaultName = vaultName.trim();
      }
      if (lockedResolved !== null && lockedResolved !== Number(user.lockedBalanceUsd ?? 0)) {
        if (lockedResolved < 0) throw new Error("Locked balance must be non-negative.");
        body.lockedBalanceUsd = roundCents(lockedResolved);
      }
      if (returnResolved !== null && returnResolved !== Number(user.returnEarningsUsd ?? 0)) {
        body.returnEarningsUsd = roundCents(returnResolved);
      }
      const limitNum = Number(dailyLimit);
      if (
        Number.isFinite(limitNum) &&
        limitNum >= 0 &&
        limitNum !== Number(user.dailyWithdrawalLimitUsd ?? 0)
      ) {
        body.dailyWithdrawalLimitUsd = roundCents(limitNum);
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke("admin-update-user", {
        body,
      });
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  }

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
        <h3 className="font-display text-xl font-semibold text-white">Edit user</h3>
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="New password (leave blank to keep)"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Minimum 8 characters."
        />
        <label className="block text-xs uppercase tracking-wider text-zinc-400">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
            disabled={isSelf}
            className="input mt-1 w-full"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          {isSelf && (
            <span className="mt-1 block text-[10px] text-zinc-500">
              You can&apos;t change your own role.
            </span>
          )}
        </label>
        <Input
          label="Vault name"
          value={vaultName}
          onChange={(e) => setVaultName(e.target.value)}
        />
        <PercentField
          label="Locked / Staked balance"
          raw={lockedRaw}
          onRawChange={setLockedRaw}
          mode={lockedMode}
          onModeChange={setLockedMode}
          resolved={lockedResolved}
          total={total}
        />
        <PercentField
          label="Return earnings"
          raw={returnRaw}
          onRawChange={setReturnRaw}
          mode={returnMode}
          onModeChange={setReturnMode}
          resolved={returnResolved}
          total={total}
          allowNegative
        />
        <Input
          label="Daily withdrawal limit (USD)"
          type="number"
          min="0"
          step="0.01"
          value={dailyLimit}
          onChange={(e) => setDailyLimit(e.target.value)}
          hint="0 means no limit set."
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-outline text-xs">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-gold text-xs">
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
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
  const [recording, setRecording] = useState(false);

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

  if (users === null || assets === null) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  const userById = new Map(users.map((u) => [u.id, u]));
  const assetByTicker = new Map(assets.map((a) => [a.ticker, a]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {deposits?.length ?? 0} deposit{(deposits?.length ?? 0) === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDeposits}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setRecording(true)}
            className="btn-gold text-xs"
          >
            + Record Deposit
          </button>
        </div>
      </div>
      {depositsError && (
        <p className="text-xs text-red-400">{depositsError}</p>
      )}
      {deposits === null ? (
        <p className="text-sm text-zinc-400">Loading deposits…</p>
      ) : deposits.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-zinc-500">
          No deposits recorded yet. Click <span className="text-gold">+ Record Deposit</span> to log one.
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

      {recording && (
        <RecordDepositDialog
          users={users}
          assets={assets}
          onClose={() => setRecording(false)}
          onRecorded={async () => {
            setRecording(false);
            await loadDeposits();
          }}
        />
      )}
    </div>
  );
}

function RecordDepositDialog({
  users,
  assets,
  onClose,
  onRecorded,
}: {
  users: AdminUser[];
  assets: DepositAddress[];
  onClose: () => void;
  onRecorded: () => void | Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [asset, setAsset] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [amountCrypto, setAmountCrypto] = useState("");
  const [txHash, setTxHash] = useState("");
  const [network, setNetwork] = useState("");
  const [note, setNote] = useState("");
  const [alsoIncrementBalance, setAlsoIncrementBalance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
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
      const { data, error: invokeError } = await supabase.functions.invoke(
        "admin-record-deposit",
        {
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
        },
      );
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string; depositId?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      await onRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record deposit.");
    } finally {
      setSubmitting(false);
    }
  }

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
        <h3 className="font-display text-xl font-semibold text-white">Record deposit</h3>
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
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-outline text-xs">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-gold text-xs">
            {submitting ? "Recording…" : "Record deposit"}
          </button>
        </div>
      </form>
    </div>
  );
}

type WithdrawalRecord = {
  id: string;
  user_id: string;
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

function WithdrawalsTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approveFor, setApproveFor] = useState<WithdrawalRecord | null>(null);

  async function load() {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const [usersRes, withdrawalsRes] = await Promise.all([
      supabase.functions.invoke("admin-list-users", { body: {} }),
      supabase
        .from("user_withdrawals")
        .select(
          "id, user_id, asset, amount_usd, amount_crypto, destination_address, network, note, status, tx_hash, admin_note, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (usersRes.error) setError(usersRes.error.message);
    setUsers(((usersRes.data as { users?: AdminUser[] })?.users) ?? []);
    if (withdrawalsRes.error) setError(withdrawalsRes.error.message);
    setWithdrawals((withdrawalsRes.data as WithdrawalRecord[] | null) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function reject(w: WithdrawalRecord) {
    const reason =
      window.prompt(`Reject withdrawal ${fmtUsd(Number(w.amount_usd))}? Optional note:`, "") ?? null;
    if (reason === null) return;
    setActingId(w.id);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke(
        "admin-reject-withdrawal",
        { body: { withdrawalId: w.id, adminNote: reason || null } },
      );
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject withdrawal.");
    } finally {
      setActingId(null);
    }
  }

  if (users === null || withdrawals === null) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  const userById = new Map(users.map((u) => [u.id, u]));
  const visible = filter === "pending"
    ? withdrawals.filter((w) => w.status === "pending")
    : withdrawals;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs ${
                filter === f ? "bg-gold text-zinc-900" : "bg-elevated text-zinc-400"
              }`}
            >
              {f === "pending" ? "Pending" : "All"}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} className="text-xs text-zinc-400 hover:text-white">
          Refresh
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-zinc-500">
          No withdrawals.
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
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((w) => {
                const u = userById.get(w.user_id);
                const explorer = w.tx_hash
                  ? getExplorerUrl(w.asset, w.tx_hash, w.network)
                  : null;
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
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-4 py-3 align-top text-zinc-300">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-white">{u?.fullName ?? u?.email ?? "—"}</p>
                      <p className="text-xs text-zinc-500">{u?.email ?? w.user_id}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-300">{w.asset}</td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-white">{fmtUsd(Number(w.amount_usd))}</p>
                      {w.amount_crypto !== null && (
                        <p className="text-xs text-zinc-500">
                          {Number(w.amount_crypto)} {w.asset}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-xs">
                      <span className="break-all text-zinc-300" title={w.destination_address}>
                        {shortDest}
                      </span>
                      {w.network && (
                        <p className="font-sans text-[10px] text-zinc-500">on {w.network}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusPill}`}
                        >
                          {w.status[0].toUpperCase() + w.status.slice(1)}
                        </span>
                        {w.tx_hash && (
                          <span className="font-mono text-[10px]">
                            {explorer ? (
                              <a
                                href={explorer}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold hover:underline"
                              >
                                tx ↗
                              </a>
                            ) : (
                              <span className="text-zinc-400">tx logged</span>
                            )}
                          </span>
                        )}
                        {w.admin_note && (
                          <span className="font-sans text-[10px] text-zinc-500">
                            “{w.admin_note}”
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {w.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setApproveFor(w)}
                            disabled={actingId === w.id}
                            className="btn-outline text-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(w)}
                            disabled={actingId === w.id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:text-zinc-600"
                          >
                            {actingId === w.id ? "…" : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {approveFor && (
        <ApproveWithdrawalDialog
          withdrawal={approveFor}
          onClose={() => setApproveFor(null)}
          onApproved={async () => {
            setApproveFor(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ApproveWithdrawalDialog({
  withdrawal,
  onClose,
  onApproved,
}: {
  withdrawal: WithdrawalRecord;
  onClose: () => void;
  onApproved: () => void | Promise<void>;
}) {
  const [txHash, setTxHash] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!txHash.trim()) throw new Error("Transaction hash is required.");
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke(
        "admin-approve-withdrawal",
        {
          body: {
            withdrawalId: withdrawal.id,
            txHash: txHash.trim(),
            adminNote: adminNote.trim() || null,
          },
        },
      );
      if (invokeError) throw invokeError;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "Failed");
      await onApproved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve withdrawal.");
    } finally {
      setSubmitting(false);
    }
  }

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
          <h3 className="font-display text-xl font-semibold text-white">
            Approve withdrawal
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Sending {fmtUsd(Number(withdrawal.amount_usd))} of {withdrawal.asset} to{" "}
            <span className="font-mono break-all">{withdrawal.destination_address}</span>.
          </p>
        </div>
        <Input
          label="Transaction hash"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          hint="Paste the on-chain tx hash after sending. The user will see this as proof."
          required
        />
        <Input
          label="Note (optional)"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-outline text-xs">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-gold text-xs">
            {submitting ? "Approving…" : "Mark completed"}
          </button>
        </div>
      </form>
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
