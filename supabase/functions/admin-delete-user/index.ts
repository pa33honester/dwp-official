// Edge Function: admin hard-deletes a user.
// Cascade FKs handle profiles, wallet_applications, llc_applications, user_deposits.user_id.
// Admins are protected (would FK-violate user_deposits.created_by).
// Deploy with: supabase functions deploy admin-delete-user

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = { userId?: string };

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
  if (!userId) return json({ error: "userId is required" }, 400, cors);
  if (userId === check.user.id) {
    return json({ error: "Cannot delete yourself" }, 400, cors);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: target, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError) return json({ error: getError.message }, 500, cors);
  if (!target?.user) return json({ error: "User not found" }, 404, cors);

  const targetRole = (target.user.app_metadata as Record<string, unknown> | null)?.role;
  if (targetRole === "admin") {
    return json({ error: "Demote admins before deleting" }, 400, cors);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: deleteError.message }, 500, cors);

  return json({ ok: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
