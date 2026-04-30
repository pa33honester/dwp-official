"use client";

import { useState } from "react";
import { ApplicationShell } from "@/components/ApplicationShell";
import { LLCAccountStep } from "@/components/forms/LLCAccountStep";
import { LLCDetailsStep } from "@/components/forms/LLCDetailsStep";
import { LLCReviewStep } from "@/components/forms/LLCReviewStep";
import type { LLCAccount, LLCDetails } from "@/lib/validation/schemas";

const STEPS = [
  { label: "Account Setup" },
  { label: "LLC Details" },
  { label: "Review & Submit" },
];

export default function LLCSignupPage() {
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<LLCAccount | undefined>();
  const [details, setDetails] = useState<LLCDetails | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!account || !details) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetch("/api/llc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, details }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ApplicationShell
      title="Digital Asset LLC Application"
      subtitle="Complete your LLC formation application in 3 simple steps."
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
          }}
        />
      )}
      {step === 1 && (
        <LLCDetailsStep
          defaultValues={details}
          onBack={() => setStep(0)}
          onSubmit={(values) => {
            setDetails(values);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <LLCReviewStep
          onBack={() => setStep(1)}
          submitting={submitting}
          submitted={submitted}
          onSubmit={handleSubmit}
        />
      )}
    </ApplicationShell>
  );
}
