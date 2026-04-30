"use client";

import { useState } from "react";
import { ApplicationShell } from "@/components/ApplicationShell";
import { LLCAccountStep } from "@/components/forms/LLCAccountStep";
import { LLCDetailsStep } from "@/components/forms/LLCDetailsStep";
import { WalletSetupStep } from "@/components/forms/WalletSetupStep";
import { BothConfirmation } from "@/components/forms/BothConfirmation";
import type {
  LLCAccount,
  LLCDetails,
  WalletSetup,
} from "@/lib/validation/schemas";

const STEPS = [
  { label: "Account Setup" },
  { label: "LLC & Wallet Details" },
  { label: "Review & Submit" },
];

export default function BothSignupPage() {
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<LLCAccount | undefined>();
  const [details, setDetails] = useState<LLCDetails | undefined>();
  const [wallet, setWallet] = useState<WalletSetup | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subStep, setSubStep] = useState<"llc" | "wallet">("llc");

  async function finalize(walletValues: WalletSetup) {
    if (!account || !details) return;
    setSubmitting(true);
    setError(null);
    try {
      await Promise.all([
        fetch("/api/llc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account, details, combined: true }),
        }),
        fetch("/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: {
              fullName: account.fullName,
              dateOfBirth: account.dateOfBirth,
              email: account.email,
              phone: account.phone,
              memorablePhrase: "",
              password: account.password,
              confirmPassword: account.confirmPassword,
            },
            setup: walletValues,
            combined: true,
          }),
        }),
      ]);
      setWallet(walletValues);
      setSubmitted(true);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ApplicationShell
      title="Digital Asset LLC & Wallet Application"
      subtitle="Complete your combined wallet + LLC application in 3 simple steps."
      steps={STEPS}
      currentStep={step}
    >
      {error && (
        <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {step === 0 && (
        <LLCAccountStep
          defaultValues={account}
          onSubmit={(values) => {
            setAccount(values);
            setStep(1);
            setSubStep("llc");
          }}
        />
      )}
      {step === 1 && subStep === "llc" && (
        <LLCDetailsStep
          defaultValues={details}
          onBack={() => setStep(0)}
          onSubmit={(values) => {
            setDetails(values);
            setSubStep("wallet");
          }}
        />
      )}
      {step === 1 && subStep === "wallet" && (
        <WalletSetupStep
          defaultValues={wallet}
          onBack={() => setSubStep("llc")}
          onSubmit={finalize}
        />
      )}
      {step === 2 && submitted && <BothConfirmation />}
      {step === 1 && submitting && (
        <p className="mt-6 text-center text-sm text-zinc-400">
          Submitting your application…
        </p>
      )}
    </ApplicationShell>
  );
}
