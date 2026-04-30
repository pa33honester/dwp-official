import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/email";
import {
  llcAccountSchema,
  llcDetailsSchema,
} from "@/lib/validation/schemas";

const bodySchema = z.object({
  account: llcAccountSchema,
  details: llcDetailsSchema,
  combined: z.boolean().optional(),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    payload = bodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid payload", details: String(err) },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();
  let userId: string | null = null;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email: payload.account.email,
        password: payload.account.password,
        email_confirm: false,
        user_metadata: { full_name: payload.account.fullName },
      });
    if (createError && !createError.message.includes("already")) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 },
      );
    }
    userId = created?.user?.id ?? null;

    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: payload.account.fullName,
        date_of_birth: payload.account.dateOfBirth,
        phone: payload.account.phone,
      });

      await supabase.from("llc_applications").insert({
        user_id: userId,
        full_legal_name: payload.account.fullName,
        street_address: payload.account.streetAddress,
        country: payload.account.country,
        state_region: payload.account.stateRegion,
        city: payload.account.city,
        ssn_or_ein: payload.account.ssnOrEin,
        entity_name: payload.details.entityName,
        formation_jurisdiction: payload.details.formationJurisdiction,
        intended_use: payload.details.intendedUse,
        registered_agent: payload.details.registeredAgent,
        status: "submitted",
      });
    }
  } else {
    console.info("LLC application received (Supabase not configured)", {
      email: payload.account.email,
      entity: payload.details.entityName,
    });
  }

  await sendConfirmationEmail({
    to: payload.account.email,
    name: payload.account.fullName,
    template: payload.combined ? "both" : "llc",
  }).catch((err) => console.warn("Email send failed", err));

  return NextResponse.json({ ok: true, userId });
}
