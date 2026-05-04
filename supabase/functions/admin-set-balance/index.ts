// Edge Function: admin sets a user's balance_usd.
// Deploy with: supabase functions deploy admin-set-balance

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = { userId?: string; balanceUsd?: number };

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

  const userId = body.userId;
  const balanceUsd = body.balanceUsd;
  if (!userId || typeof balanceUsd !== "number" || !Number.isFinite(balanceUsd)) {
    return json({ error: "userId and numeric balanceUsd are required" }, 400, cors);
  }
  if (balanceUsd < 0) {
    return json({ error: "balanceUsd must be non-negative" }, 400, cors);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: latest, error: findError } = await admin
    .from("wallet_applications")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findError) return json({ error: findError.message }, 500, cors);

  if (latest) {
    const { error: updateError } = await admin
      .from("wallet_applications")
      .update({ balance_usd: balanceUsd, updated_at: new Date().toISOString() })
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
      balance_usd: balanceUsd,
    });
    if (createError) return json({ error: createError.message }, 500, cors);
  }

  return json({ ok: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
