// Edge Function: admin creates a user account.
// Deploy with: supabase functions deploy admin-create-user

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = {
  email?: string;
  password?: string;
  fullName?: string;
  vaultName?: string;
  balanceUsd?: number;
};

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server not configured" }, 500, cors);
  }

  const check = await requireAdmin(req, supabaseUrl, serviceKey);
  if (!check.ok) return json({ error: check.error }, check.status, cors);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.fullName?.trim();
  if (!email || !password || !fullName) {
    return json({ error: "email, password, fullName are required" }, 400, cors);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400, cors);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already")) {
      return json({ error: "A user with that email already exists" }, 409, cors);
    }
    return json({ error: createError.message }, 500, cors);
  }
  const userId = created?.user?.id;
  if (!userId) return json({ error: "User creation failed" }, 500, cors);

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
  });
  if (profileError) return json({ error: profileError.message }, 500, cors);

  const vaultName = body.vaultName?.trim() || "Main Vault";
  const initialBalance = typeof body.balanceUsd === "number" ? body.balanceUsd : 0;
  const { error: walletError } = await admin.from("wallet_applications").insert({
    user_id: userId,
    vault_name: vaultName,
    purpose: "admin_created",
    use_case: "admin_created",
    estimated_assets: "admin_created",
    status: "approved",
    balance_usd: initialBalance,
  });
  if (walletError) return json({ error: walletError.message }, 500, cors);

  return json({ ok: true, userId }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
