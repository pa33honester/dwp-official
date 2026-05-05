// Edge Function: admin rejects a pending withdrawal.
// Refunds the reserved amount back to wallet_applications.balance_usd.
// Deploy with: supabase functions deploy admin-reject-withdrawal

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = { withdrawalId?: string; adminNote?: string };

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

  const withdrawalId = body.withdrawalId?.trim();
  const adminNote = body.adminNote?.trim() || null;
  if (!withdrawalId) return json({ error: "withdrawalId is required" }, 400, cors);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: w, error: findError } = await admin
    .from("user_withdrawals")
    .select("id, status, user_id, amount_usd")
    .eq("id", withdrawalId)
    .maybeSingle();
  if (findError) return json({ error: findError.message }, 500, cors);
  if (!w) return json({ error: "Withdrawal not found" }, 404, cors);
  if (w.status !== "pending") {
    return json({ error: `Withdrawal is already ${w.status}` }, 400, cors);
  }

  const { data: wallet, error: walletError } = await admin
    .from("wallet_applications")
    .select("id, balance_usd")
    .eq("user_id", w.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (walletError) return json({ error: walletError.message }, 500, cors);

  const { error: updateError } = await admin
    .from("user_withdrawals")
    .update({
      status: "rejected",
      admin_note: adminNote,
      reviewed_by: check.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId);
  if (updateError) return json({ error: updateError.message }, 500, cors);

  if (wallet) {
    const refunded = Number(wallet.balance_usd ?? 0) + Number(w.amount_usd ?? 0);
    const { error: refundError } = await admin
      .from("wallet_applications")
      .update({ balance_usd: refunded, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);
    if (refundError) return json({ error: refundError.message }, 500, cors);
  }

  return json({ ok: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
