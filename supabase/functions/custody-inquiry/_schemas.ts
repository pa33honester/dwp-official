// Deno-compatible mirror of the custody inquiry shape from
// lib/validation/schemas.ts. Keep field names in sync with the client.

import { z } from "https://esm.sh/zod@3.24.1";

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
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    estimatedAssetValue: z.enum(CUSTODY_VALUE_BRACKETS),
    currentAllocation: z.string().optional(),
    hasEntity: z.enum(["yes", "no"]),
    entityName: z.string().optional(),
    agentContact: z.string().optional(),
    assetsToTransfer: z.string().min(2),
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
