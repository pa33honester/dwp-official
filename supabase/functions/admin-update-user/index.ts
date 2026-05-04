// Edge Function: admin updates a user's profile, auth fields, role, or vault name.
// Each field is optional — only provided fields are written.
// Deploy with: supabase functions deploy admin-update-user

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = {
  userId?: string;
  fullName?: string;
  email?: string;
  password?: string;
  role?: "admin" | "user";
  vaultName?: string;
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
  if (!userId) return json({ error: "userId is required" }, 400, cors);

  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const role = body.role;
  const vaultName = body.vaultName?.trim();

  if (password !== undefined && password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400, cors);
  }
  if (role !== undefined && role !== "admin" && role !== "user") {
    return json({ error: "role must be 'admin' or 'user'" }, 400, cors);
  }
  if (role === "user" && userId === check.user.id) {
    return json({ error: "Cannot demote yourself" }, 400, cors);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authUpdate: Record<string, unknown> = {};
  if (email !== undefined) {
    authUpdate.email = email;
    authUpdate.email_confirm = true;
  }
  if (password !== undefined) authUpdate.password = password;
  if (fullName !== undefined) authUpdate.user_metadata = { full_name: fullName };
  if (role !== undefined) authUpdate.app_metadata = { role };

  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdate);
    if (authError) return json({ error: authError.message }, 500, cors);
  }

  if (fullName !== undefined) {
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({ id: userId, full_name: fullName });
    if (profileError) return json({ error: profileError.message }, 500, cors);
  }

  if (vaultName !== undefined && vaultName.length > 0) {
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
        .update({ vault_name: vaultName, updated_at: new Date().toISOString() })
        .eq("id", latest.id);
      if (updateError) return json({ error: updateError.message }, 500, cors);
    } else {
      const { error: createError } = await admin.from("wallet_applications").insert({
        user_id: userId,
        vault_name: vaultName,
        purpose: "auto",
        use_case: "auto",
        estimated_assets: "auto",
        status: "approved",
        balance_usd: 0,
      });
      if (createError) return json({ error: createError.message }, 500, cors);
    }
  }

  return json({ ok: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
