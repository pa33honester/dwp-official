"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  custodyInquirySchema,
  type CustodyInquiry,
  CUSTODY_VALUE_BRACKETS,
} from "@/lib/validation/schemas";
import { Input, Select, FieldShell } from "@/components/forms/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function CustodyInquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustodyInquiry>({
    resolver: zodResolver(custodyInquirySchema),
    defaultValues: { hasEntity: "no" },
  });

  const hasEntity = watch("hasEntity");

  async function onSubmit(values: CustodyInquiry) {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: invokeError } = await supabase.functions.invoke(
        "custody-inquiry",
        { body: values },
      );
      if (invokeError) throw invokeError;
      setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-surface/40 p-8 text-center sm:p-12">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <h3 className="font-display text-2xl font-semibold text-white">
          Thank you for your inquiry
        </h3>
        <p className="max-w-md text-sm text-zinc-400">
          A member of our team will review your details and reach out shortly
          to discuss how our custody solutions fit your requirements.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-surface/40 p-6 sm:p-8"
    >
      <h3 className="font-display text-2xl font-semibold text-white">
        Request a custody consultation
      </h3>
      <p className="mt-2 text-sm text-zinc-400">
        Share a few details and our team will follow up to discuss your
        requirements.
      </p>

      {error && (
        <div className="mt-5 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+1 (555) 555-5555"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Select
          label="Estimated Asset Value to Protect"
          options={CUSTODY_VALUE_BRACKETS}
          placeholder="Select bracket"
          defaultValue=""
          error={errors.estimatedAssetValue?.message}
          {...register("estimatedAssetValue")}
        />
        <div className="md:col-span-2">
          <Input
            label="Current Allocation to Digital Assets"
            placeholder="e.g. 15% of total portfolio"
            error={errors.currentAllocation?.message}
            {...register("currentAllocation")}
          />
        </div>

        <FieldShell label="Do you have a LLC, Trust, or Corporation?">
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-white transition hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold/10">
              <input
                type="radio"
                value="yes"
                className="accent-gold"
                {...register("hasEntity")}
              />
              Yes
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-white transition hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold/10">
              <input
                type="radio"
                value="no"
                className="accent-gold"
                {...register("hasEntity")}
              />
              No
            </label>
          </div>
        </FieldShell>

        {hasEntity === "yes" && (
          <>
            <Input
              label="Name of LLC / Trust / Corp"
              placeholder="Entity name"
              error={errors.entityName?.message}
              {...register("entityName")}
            />
            <Input
              label="Agent Phone / Email"
              placeholder="Registered agent contact"
              error={errors.agentContact?.message}
              {...register("agentContact")}
            />
          </>
        )}

        <div className="md:col-span-2">
          <FieldShell
            label="Digital assets you would like to transfer to institutional custody"
            error={errors.assetsToTransfer?.message}
          >
            <textarea
              rows={4}
              placeholder="e.g. 250,000 XRP, 1,000,000 XLM, 5 BTC, 80 ETH"
              className="input min-h-[112px] resize-y"
              {...register("assetsToTransfer")}
            />
          </FieldShell>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="submit" disabled={submitting} className="btn-gold">
          {submitting ? "Submitting…" : "Submit Inquiry"}
        </button>
      </div>
    </form>
  );
}
