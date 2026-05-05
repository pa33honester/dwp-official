// Edge Function: admin marks a pending withdrawal as completed with tx_hash.
// Balance was already decremented at request time; nothing more to deduct.
// Deploy with: supabase functions deploy admin-approve-withdrawal

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = { withdrawalId?: string; txHash?: string; adminNote?: string };

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
  const txHash = body.txHash?.trim();
  const adminNote = body.adminNote?.trim() || null;

  if (!withdrawalId) return json({ error: "withdrawalId is required" }, 400, cors);
  if (!txHash) return json({ error: "txHash is required" }, 400, cors);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: w, error: findError } = await admin
    .from("user_withdrawals")
    .select("id, status")
    .eq("id", withdrawalId)
    .maybeSingle();
  if (findError) return json({ error: findError.message }, 500, cors);
  if (!w) return json({ error: "Withdrawal not found" }, 404, cors);
  if (w.status !== "pending") {
    return json({ error: `Withdrawal is already ${w.status}` }, 400, cors);
  }

  const { error: updateError } = await admin
    .from("user_withdrawals")
    .update({
      status: "completed",
      tx_hash: txHash,
      admin_note: adminNote,
      reviewed_by: check.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId);
  if (updateError) return json({ error: updateError.message }, 500, cors);

  return json({ ok: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
