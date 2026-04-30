"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApplicationShell } from "@/components/ApplicationShell";
import { WalletAccountStep } from "@/components/forms/WalletAccountStep";
import { WalletSetupStep } from "@/components/forms/WalletSetupStep";
import { WalletApprovalStep } from "@/components/forms/WalletApprovalStep";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WalletAccount, WalletSetup } from "@/lib/validation/schemas";

const STEPS = [
  { label: "Account Setup" },
  { label: "Wallet Details" },
  { label: "Approval" },
];

export default function WalletSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<WalletAccount | undefined>();
  const [setup, setSetup] = useState<WalletSetup | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitAll(setupValues: WalletSetup) {
    if (!account) return;
    setError(null);
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "signup-application",
        { body: { type: "wallet", account, setup: setupValues } },
      );
      if (invokeError || !(data as { ok?: boolean })?.ok) {
        throw new Error(invokeError?.message ?? "Submission failed");
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (signInError) {
        console.warn("signInWithPassword failed", signInError);
      }
      setSetup(setupValues);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ApplicationShell
      title="DWP Secured Wallet Application"
      subtitle="Complete your wallet application in 3 simple steps."
      steps={STEPS}
      currentStep={step}
    >
      {error && (
        <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {step === 0 && (
        <WalletAccountStep
          defaultValues={account}
          onSubmit={(values) => {
            setAccount(values);
            setStep(1);
          }}
        />
      )}
      {step === 1 && (
        <WalletSetupStep
          defaultValues={setup}
          onBack={() => setStep(0)}
          onSubmit={submitAll}
        />
      )}
      {step === 1 && submitting && (
        <p className="mt-6 text-center text-sm text-zinc-400">
          Creating your wallet…
        </p>
      )}
      {step === 2 && (
        <WalletApprovalStep onSkip={() => router.push("/dashboard")} />
      )}
    </ApplicationShell>
  );
}
