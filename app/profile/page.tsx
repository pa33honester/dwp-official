"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/forms/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = { kind: "ok" | "err" | "info"; text: string } | null;

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [currentEmail, setCurrentEmail] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailStatus, setEmailStatus] = useState<Status>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<Status>(null);
  const [savingPhone, setSavingPhone] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [walletId, setWalletId] = useState<string | null>(null);
  const [limit, setLimit] = useState("0");
  const [limitStatus, setLimitStatus] = useState<Status>(null);
  const [savingLimit, setSavingLimit] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const uid = data.session.user.id;
      setUserId(uid);
      setCurrentEmail(data.session.user.email ?? "");
      setEmailDraft(data.session.user.email ?? "");
      const [profileRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("phone").eq("id", uid).maybeSingle(),
        supabase
          .from("wallet_applications")
          .select("id, daily_withdrawal_limit_usd")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setPhone((profileRes.data?.phone as string | null) ?? "");
      if (walletRes.data) {
        setWalletId(walletRes.data.id as string);
        setLimit(String(walletRes.data.daily_withdrawal_limit_usd ?? 0));
      }
      setReady(true);
    });
  }, [router]);

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailStatus(null);
    try {
      if (!emailDraft.trim()) throw new Error("Email is required.");
      if (emailDraft.trim().toLowerCase() === currentEmail.toLowerCase()) {
        throw new Error("That's already your email.");
      }
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ email: emailDraft.trim() });
      if (error) throw error;
      setEmailStatus({
        kind: "info",
        text: "Confirmation sent. Click the link in the email to finish the change.",
      });
    } catch (err) {
      setEmailStatus({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to update email.",
      });
    } finally {
      setSavingEmail(false);
    }
  }

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSavingPhone(true);
    setPhoneStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({ phone: phone.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      setPhoneStatus({ kind: "ok", text: "Saved." });
    } catch (err) {
      setPhoneStatus({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to update phone.",
      });
    } finally {
      setSavingPhone(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordStatus(null);
    try {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmPassword("");
      setPasswordStatus({ kind: "ok", text: "Password updated." });
    } catch (err) {
      setPasswordStatus({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to update password.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function saveLimit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletId) {
      setLimitStatus({
        kind: "err",
        text: "No wallet found. Contact support.",
      });
      return;
    }
    setSavingLimit(true);
    setLimitStatus(null);
    try {
      const value = Number(limit);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("Enter a non-negative number.");
      }
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("wallet_applications")
        .update({
          daily_withdrawal_limit_usd: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletId);
      if (error) throw error;
      setLimitStatus({ kind: "ok", text: "Saved." });
    } catch (err) {
      setLimitStatus({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to update limit.",
      });
    } finally {
      setSavingLimit(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-elevated" />
        <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-elevated/50" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-white">
        Profile & Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Update your contact details, password, and withdrawal limit.
      </p>

      <form
        onSubmit={saveEmail}
        className="mt-8 space-y-3 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
          Email
        </h2>
        <Input
          label="Email address"
          type="email"
          value={emailDraft}
          onChange={(e) => setEmailDraft(e.target.value)}
          hint="Changing your email sends a confirmation link to the new address."
          required
        />
        <StatusLine status={emailStatus} />
        <button type="submit" disabled={savingEmail} className="btn-gold w-full">
          {savingEmail ? "Sending verification…" : "Update email"}
        </button>
      </form>

      <form
        onSubmit={savePhone}
        className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
          Phone
        </h2>
        <Input
          label="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 0123"
        />
        <StatusLine status={phoneStatus} />
        <button type="submit" disabled={savingPhone} className="btn-gold w-full">
          {savingPhone ? "Saving…" : "Update phone"}
        </button>
      </form>

      <form
        onSubmit={savePassword}
        className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
          Password
        </h2>
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Minimum 8 characters."
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <StatusLine status={passwordStatus} />
        <button type="submit" disabled={savingPassword} className="btn-gold w-full">
          {savingPassword ? "Saving…" : "Update password"}
        </button>
      </form>

      <form
        onSubmit={saveLimit}
        className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
          Daily withdrawal limit
        </h2>
        <Input
          label="USD per 24 hours"
          type="number"
          min="0"
          step="0.01"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          hint="Leave at 0 to keep no limit. Enforcement coming soon."
        />
        <StatusLine status={limitStatus} />
        <button type="submit" disabled={savingLimit} className="btn-gold w-full">
          {savingLimit ? "Saving…" : "Update limit"}
        </button>
      </form>
    </main>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  const color =
    status.kind === "ok"
      ? "text-green-400"
      : status.kind === "info"
        ? "text-zinc-300"
        : "text-red-400";
  return <p className={`text-xs ${color}`}>{status.text}</p>;
}
