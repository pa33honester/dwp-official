"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  walletSetupSchema,
  type WalletSetup,
  PURPOSES,
  USE_CASES,
  ASSET_BRACKETS,
} from "@/lib/validation/schemas";
import { Input, Select } from "./Field";

export function WalletSetupStep({
  defaultValues,
  onBack,
  onSubmit,
}: {
  defaultValues?: Partial<WalletSetup>;
  onBack: () => void;
  onSubmit: (values: WalletSetup) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WalletSetup>({
    resolver: zodResolver(walletSetupSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gold">
          Wallet Setup
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Wallet / Vault Name"
              placeholder="e.g. Family Office Treasury"
              error={errors.vaultName?.message}
              {...register("vaultName")}
            />
          </div>
          <Select
            label="Purpose"
            options={PURPOSES}
            placeholder="Select purpose"
            defaultValue=""
            error={errors.purpose?.message}
            {...register("purpose")}
          />
          <Select
            label="Wallet Use Case"
            options={USE_CASES}
            placeholder="Select use case"
            defaultValue=""
            error={errors.useCase?.message}
            {...register("useCase")}
          />
          <div className="md:col-span-2">
            <Select
              label="Estimated Assets to Deposit & Hold"
              options={ASSET_BRACKETS}
              placeholder="Select asset bracket"
              defaultValue=""
              error={errors.estimatedAssets?.message}
              {...register("estimatedAssets")}
            />
          </div>
        </div>
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
