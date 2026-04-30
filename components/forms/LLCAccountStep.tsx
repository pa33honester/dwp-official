"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { llcAccountSchema, type LLCAccount } from "@/lib/validation/schemas";
import { Input, Select } from "./Field";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Other"] as const;

export function LLCAccountStep({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<LLCAccount>;
  onSubmit: (values: LLCAccount) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LLCAccount>({
    resolver: zodResolver(llcAccountSchema),
    defaultValues: { country: "United States", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <section>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gold">
          Account Information
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gold">
          Personal Information
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
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              placeholder="Street address, apartment, suite, etc."
              error={errors.streetAddress?.message}
              {...register("streetAddress")}
            />
          </div>
          <Select
            label="Country"
            options={COUNTRIES}
            error={errors.country?.message}
            {...register("country")}
          />
          <Input
            label="State / Region"
            placeholder="Select State / Region"
            error={errors.stateRegion?.message}
            {...register("stateRegion")}
          />
          <Input
            label="Local Area (City)"
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Social Security Number or EIN"
            error={errors.ssnOrEin?.message}
            {...register("ssnOrEin")}
          />
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
