// Edge Function: admin rejects a pending deposit request.
// Sets status='rejected'. No balance change (nothing was reserved).
// Deploy with: supabase functions deploy admin-reject-deposit

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = { depositId?: string; adminNote?: string };

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

  const depositId = body.depositId?.trim();
  const adminNote = body.adminNote?.trim() || null;
  if (!depositId) return json({ error: "depositId is required" }, 400, cors);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: d, error: findError } = await admin
    .from("user_deposits")
    .select("id, status")
    .eq("id", depositId)
    .maybeSingle();
  if (findError) return json({ error: findError.message }, 500, cors);
  if (!d) return json({ error: "Deposit not found" }, 404, cors);
  if (d.status !== "pending") {
    return json({ error: `Deposit is already ${d.status}` }, 400, cors);
  }

  const { error: updateError } = await admin
    .from("user_deposits")
    .update({
      status: "rejected",
      admin_note: adminNote,
      reviewed_by: check.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", depositId);
  if (updateError) return json({ error: updateError.message }, 500, cors);

  return json({ ok: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
