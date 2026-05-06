// Supabase Edge Function — handles signup for wallet, LLC, and combined applications.
// Replaces the deleted /api/wallet, /api/llc, /api/confirm-email Next.js routes.
// Deploy with: supabase functions deploy signup-application
// Set secret:  supabase secrets set RESEND_API_KEY=re_...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { Resend } from "https://esm.sh/resend@4.0.1";
import { requestSchema } from "./_schemas.ts";

const ALLOWED_ORIGINS = [
  "https://dwpofficial.org",
  "https://www.dwpofficial.org",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

async function hashPhrase(phrase: string) {
  if (!phrase) return null;
  const data = new TextEncoder().encode(phrase);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const EMAIL_SUBJECTS = {
  wallet: "Your DWP Secured Wallet is ready",
  llc: "Your Digital Asset LLC application has been received",
  both: "Welcome to DWP — Wallet secured & LLC submitted",
} as const;

function emailHtml(template: keyof typeof EMAIL_SUBJECTS, name: string) {
  const open = `<div style="background:#0a0a0a;color:#fff;font-family:Inter,sans-serif;padding:32px;">
    <div style="max-width:560px;margin:0 auto;border:1px solid #2a2520;border-radius:12px;background:#14110f;padding:32px;">
      <h1 style="color:#D4A24C;font-size:22px;margin:0 0 16px 0;">Digital Wealth Partners</h1>`;
  const close = `<p style="color:#a1a1aa;font-size:12px;margin-top:32px;">If you did not request this, you can safely ignore this email.</p></div></div>`;

  if (template === "wallet") {
    return `${open}<p>Hi ${name},</p><p>Your DWP Secured Wallet has been successfully created. You can now connect your wallet or fund it directly to begin using your custody environment.</p>${close}`;
  }
  if (template === "llc") {
    return `${open}<p>Hi ${name},</p><p>Your Digital Asset LLC application has been received and forwarded to our legal team for review. We will be in touch shortly.</p>${close}`;
  }
  return `${open}<p>Hi ${name},</p><p>Your wallet has been successfully secured. Your Digital Asset LLC application has been submitted to our legal team for review.</p><p>In the meantime, you may fund your wallet and begin utilizing your DWP secure wallet while your LLC structure is being finalized.</p>${close}`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid payload", issues: parsed.error.issues }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  const payload = parsed.data;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Server not configured" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const account = payload.account;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.fullName },
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    return new Response(
      JSON.stringify({ error: createError.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  const userId = created?.user?.id;
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "User already exists. Please sign in instead." }),
      { status: 409, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  await admin.from("profiles").upsert({
    id: userId,
    full_name: account.fullName,
    date_of_birth: account.dateOfBirth,
    phone: account.phone,
    memorable_phrase_hash:
      payload.type === "wallet"
        ? await hashPhrase((account as { memorablePhrase?: string }).memorablePhrase ?? "")
        : null,
  });

  if (payload.type === "wallet" || payload.type === "both") {
    const setup = payload.setup;
    const { error } = await admin.from("wallet_applications").insert({
      user_id: userId,
      vault_name: setup.vaultName,
      purpose: setup.purpose,
      use_case: setup.useCase,
      estimated_assets: setup.estimatedAssets,
      status: "approved",
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  if (payload.type === "llc" || payload.type === "both") {
    const llcAccount = payload.account as typeof payload.account & {
      streetAddress: string;
      country: string;
      stateRegion: string;
      city: string;
      ssnOrEin: string;
    };
    const { error } = await admin.from("llc_applications").insert({
      user_id: userId,
      full_legal_name: account.fullName,
      street_address: llcAccount.streetAddress,
      country: llcAccount.country,
      state_region: llcAccount.stateRegion,
      city: llcAccount.city,
      ssn_or_ein: llcAccount.ssnOrEin,
      entity_name: payload.details.entityName,
      formation_jurisdiction: payload.details.formationJurisdiction,
      intended_use: payload.details.intendedUse,
      registered_agent: payload.details.registeredAgent,
      status: "submitted",
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const resend = new Resend(resendKey);
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "DWP <onboarding@resend.dev>";
    try {
      await resend.emails.send({
        from: fromEmail,
        to: account.email,
        subject: EMAIL_SUBJECTS[payload.type],
        html: emailHtml(payload.type, account.fullName),
      });
    } catch (err) {
      console.warn("Resend email failed", err);
    }
  } else {
    console.warn("RESEND_API_KEY not set — skipping email");
  }

  return new Response(JSON.stringify({ ok: true, userId }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
