"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LLCReviewStep({
  onBack,
  submitting,
  submitted,
  onSubmit,
}: {
  onBack: () => void;
  submitting: boolean;
  submitted: boolean;
  onSubmit: () => void;
}) {
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Application Submitted
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
            Your Digital Asset LLC application has been submitted to our legal
            team for review. We&apos;ll be in touch shortly with next steps.
          </p>
        </div>
        <Link href="/dashboard" className="btn-gold">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
        Review &amp; Submit
      </h2>
      <p className="text-sm text-zinc-400">
        By submitting, you authorize DWP&apos;s legal team to review your
        application and prepare LLC formation documents.
      </p>
      <ul className="space-y-2 rounded-xl border border-border bg-elevated p-5 text-sm text-zinc-300">
        <li>• Your application is encrypted in transit and at rest.</li>
        <li>• Sensitive identifiers (SSN/EIN) are stored encrypted.</li>
        <li>
          • A DWP attorney will reach out within 1–2 business days for
          verification.
        </li>
      </ul>
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="btn-outline">
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="btn-gold"
        >
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
