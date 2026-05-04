// Edge Function: admin records a user deposit into the ledger.
// Optionally bumps wallet_applications.balance_usd by the same amount.
// Deploy with: supabase functions deploy admin-record-deposit

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = {
  userId?: string;
  asset?: string;
  amountUsd?: number;
  amountCrypto?: number | null;
  txHash?: string;
  network?: string | null;
  note?: string | null;
  alsoIncrementBalance?: boolean;
};

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500, cors);

  const check = await requireAdmin(req, supabaseUrl, serviceKey);
  if (!check.ok) return json({ error: check.error }, check.status, cors);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors);
  }

  const userId = body.userId?.trim();
  const asset = body.asset?.trim().toUpperCase();
  const amountUsd = body.amountUsd;
  const txHash = body.txHash?.trim();
  const amountCrypto =
    typeof body.amountCrypto === "number" && Number.isFinite(body.amountCrypto)
      ? body.amountCrypto
      : null;
  const network = body.network?.trim() || null;
  const note = body.note?.trim() || null;
  const alsoIncrementBalance = body.alsoIncrementBalance !== false;

  if (!userId) return json({ error: "userId is required" }, 400, cors);
  if (!asset) return json({ error: "asset is required" }, 400, cors);
  if (typeof amountUsd !== "number" || !Number.isFinite(amountUsd) || amountUsd <= 0) {
    return json({ error: "amountUsd must be a positive number" }, 400, cors);
  }
  if (!txHash) return json({ error: "txHash is required" }, 400, cors);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inserted, error: insertError } = await admin
    .from("user_deposits")
    .insert({
      user_id: userId,
      asset,
      amount_usd: amountUsd,
      amount_crypto: amountCrypto,
      tx_hash: txHash,
      network,
      note,
      created_by: check.user.id,
    })
    .select("id")
    .single();
  if (insertError) return json({ error: insertError.message }, 500, cors);

  if (alsoIncrementBalance) {
    const { data: latest, error: findError } = await admin
      .from("wallet_applications")
      .select("id, balance_usd")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findError) return json({ error: findError.message }, 500, cors);
    if (latest) {
      const next = Number(latest.balance_usd ?? 0) + amountUsd;
      const { error: updateError } = await admin
        .from("wallet_applications")
        .update({ balance_usd: next, updated_at: new Date().toISOString() })
        .eq("id", latest.id);
      if (updateError) return json({ error: updateError.message }, 500, cors);
    } else {
      const { error: createError } = await admin.from("wallet_applications").insert({
        user_id: userId,
        vault_name: "Main Vault",
        purpose: "auto",
        use_case: "auto",
        estimated_assets: "auto",
        status: "approved",
        balance_usd: amountUsd,
      });
      if (createError) return json({ error: createError.message }, 500, cors);
    }
  }

  return json({ ok: true, depositId: inserted.id }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
