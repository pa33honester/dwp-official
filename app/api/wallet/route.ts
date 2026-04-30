import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/email";
import {
  walletAccountSchema,
  walletSetupSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

const bodySchema = z.object({
  account: walletAccountSchema,
  setup: walletSetupSchema,
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
        memorable_phrase_hash: payload.account.memorablePhrase
          ? await hashPhrase(payload.account.memorablePhrase)
          : null,
      });

      await supabase.from("wallet_applications").insert({
        user_id: userId,
        vault_name: payload.setup.vaultName,
        purpose: payload.setup.purpose,
        use_case: payload.setup.useCase,
        estimated_assets: payload.setup.estimatedAssets,
        status: "approved",
      });
    }
  } else {
    console.info("Wallet application received (Supabase not configured)", {
      email: payload.account.email,
      vault: payload.setup.vaultName,
    });
  }

  if (!payload.combined) {
    await sendConfirmationEmail({
      to: payload.account.email,
      name: payload.account.fullName,
      template: "wallet",
    }).catch((err) => console.warn("Email send failed", err));
  }

  return NextResponse.json({ ok: true, userId });
}

async function hashPhrase(phrase: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(phrase);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
