// Deno-compatible mirror of lib/validation/schemas.ts.
// Kept side-by-side because Deno cannot import from node_modules.
// Keep these field shapes in sync with the client schemas.

import { z } from "https://esm.sh/zod@3.24.1";

export const PURPOSES = [
  "Personal Investment",
  "Business / LLC Treasury",
  "Long-Term Wealth Storage",
  "Trading Account",
  "Family Office / Wealth Management",
] as const;

export const USE_CASES = [
  "Holding (Store of Value)",
  "Staking (Earn Yield)",
  "Trading (Active Buying/Selling)",
  "Payments / Transfers",
  "DeFi Participation",
  "NFT / Digital Asset Storage",
] as const;

export const ASSET_BRACKETS = [
  "<$10,000",
  "$10,000 – $50,000",
  "$50,000 – $100,000",
  "$100,000 – $500,000",
  "$500,000+",
] as const;

export const walletAccountSchema = z
  .object({
    fullName: z.string().min(2),
    dateOfBirth: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(8),
    confirmPassword: z.string(),
    memorablePhrase: z.string().min(0),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const walletSetupSchema = z.object({
  vaultName: z.string().min(2),
  purpose: z.enum(PURPOSES),
  useCase: z.enum(USE_CASES),
  estimatedAssets: z.enum(ASSET_BRACKETS),
});

export const llcAccountSchema = z
  .object({
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(8),
    confirmPassword: z.string(),
    fullName: z.string().min(2),
    dateOfBirth: z.string().min(1),
    streetAddress: z.string().min(3),
    country: z.string().min(2),
    stateRegion: z.string().min(1),
    city: z.string().min(1),
    ssnOrEin: z.string().min(4),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const llcDetailsSchema = z.object({
  entityName: z.string().min(2),
  formationJurisdiction: z.string().min(2),
  intendedUse: z.string().min(2),
  registeredAgent: z.boolean().default(true),
});

export const requestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("wallet"),
    account: walletAccountSchema,
    setup: walletSetupSchema,
  }),
  z.object({
    type: z.literal("llc"),
    account: llcAccountSchema,
    details: llcDetailsSchema,
  }),
  z.object({
    type: z.literal("both"),
    account: llcAccountSchema,
    details: llcDetailsSchema,
    setup: walletSetupSchema,
  }),
]);

export type RequestBody = z.infer<typeof requestSchema>;
