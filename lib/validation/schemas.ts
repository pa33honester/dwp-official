import { z } from "zod";

export const walletAccountSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Enter a valid phone number"),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
    memorablePhrase: z.string().min(4, "Memorable phrase is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type WalletAccount = z.infer<typeof walletAccountSchema>;

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

export const walletSetupSchema = z.object({
  vaultName: z.string().min(2, "Vault name is required"),
  purpose: z.enum(PURPOSES),
  useCase: z.enum(USE_CASES),
  estimatedAssets: z.enum(ASSET_BRACKETS),
});

export type WalletSetup = z.infer<typeof walletSetupSchema>;

export const llcAccountSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Enter a valid phone number"),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Full legal name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    streetAddress: z.string().min(3, "Street address is required"),
    country: z.string().min(2),
    stateRegion: z.string().min(1, "State / region is required"),
    city: z.string().min(1, "City is required"),
    ssnOrEin: z.string().min(4, "SSN or EIN is required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LLCAccount = z.infer<typeof llcAccountSchema>;

export const llcDetailsSchema = z.object({
  entityName: z.string().min(2, "Proposed entity name is required"),
  formationJurisdiction: z.string().min(2, "Formation jurisdiction is required"),
  intendedUse: z.string().min(2, "Intended use is required"),
  registeredAgent: z.boolean().default(true),
});

export type LLCDetails = z.infer<typeof llcDetailsSchema>;

export const CUSTODY_VALUE_BRACKETS = [
  "Under $100,000",
  "$100,000 – $500,000",
  "$500,000 – $1M",
  "$1M – $5M",
  "$5M – $10M",
  "$10M+",
] as const;

export const custodyInquirySchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().optional(),
    estimatedAssetValue: z.enum(CUSTODY_VALUE_BRACKETS, {
      errorMap: () => ({ message: "Estimated asset value is required" }),
    }),
    currentAllocation: z.string().optional(),
    hasEntity: z.enum(["yes", "no"], {
      errorMap: () => ({ message: "Please select an option" }),
    }),
    entityName: z.string().optional(),
    agentContact: z.string().optional(),
    assetsToTransfer: z.string().min(2, "Please list the assets you wish to transfer"),
  })
  .refine(
    (d) => d.hasEntity !== "yes" || (d.entityName && d.entityName.length > 1),
    { message: "Entity name is required", path: ["entityName"] },
  )
  .refine(
    (d) => d.hasEntity !== "yes" || (d.agentContact && d.agentContact.length > 3),
    { message: "Agent phone or email is required", path: ["agentContact"] },
  );

export type CustodyInquiry = z.infer<typeof custodyInquirySchema>;
