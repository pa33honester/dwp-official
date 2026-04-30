"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { llcDetailsSchema, type LLCDetails } from "@/lib/validation/schemas";
import { Input, Select } from "./Field";

const JURISDICTIONS = [
  "Delaware",
  "Wyoming",
  "Nevada",
  "Texas",
  "Florida",
  "Other",
] as const;

const INTENDED_USES = [
  "Digital Asset Treasury",
  "XRP / XLM Holdings",
  "Multi-Coin Holdings",
  "Operating Entity",
  "Trust / Estate",
] as const;

export function LLCDetailsStep({
  defaultValues,
  onBack,
  onSubmit,
}: {
  defaultValues?: Partial<LLCDetails>;
  onBack: () => void;
  onSubmit: (values: LLCDetails) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LLCDetails>({
    resolver: zodResolver(llcDetailsSchema),
    defaultValues: { registeredAgent: true, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gold">
          LLC Details
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Proposed Entity Name"
              placeholder="e.g. Smith Family Digital Holdings LLC"
              error={errors.entityName?.message}
              {...register("entityName")}
            />
          </div>
          <Select
            label="Formation Jurisdiction"
            options={JURISDICTIONS}
            placeholder="Select jurisdiction"
            defaultValue=""
            error={errors.formationJurisdiction?.message}
            {...register("formationJurisdiction")}
          />
          <Select
            label="Intended Use"
            options={INTENDED_USES}
            placeholder="Select intended use"
            defaultValue=""
            error={errors.intendedUse?.message}
            {...register("intendedUse")}
          />
        </div>
        <label className="mt-6 flex items-start gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border bg-surface text-gold focus:ring-gold"
            {...register("registeredAgent")}
          />
          <span>
            DWP will provide a registered agent and all formation documents on
            my behalf.
          </span>
        </label>
      </section>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="btn-outline">
          Back
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-gold">
          Continue
        </button>
      </div>
    </form>
  );
}
