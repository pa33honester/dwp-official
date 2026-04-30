"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { walletAccountSchema, type WalletAccount } from "@/lib/validation/schemas";
import { Input } from "./Field";

export function WalletAccountStep({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<WalletAccount>;
  onSubmit: (values: WalletAccount) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WalletAccount>({
    resolver: zodResolver(walletAccountSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gold">
          Account Information
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Full Legal Name"
            placeholder="As shown on government ID"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Date of Birth"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register("dateOfBirth")}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 555-5555"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <div className="md:col-span-2">
            <Input
              label="Memorable Phrase"
              placeholder="A phrase only you will remember"
              hint="Used as an additional layer of identification — never shared on-chain."
              error={errors.memorablePhrase?.message}
              {...register("memorablePhrase")}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="btn-gold">
          Continue
        </button>
      </div>
    </form>
  );
}
