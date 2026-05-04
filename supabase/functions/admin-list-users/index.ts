// Edge Function: admin lists users with profile + most recent wallet info.
// Deploy with: supabase functions deploy admin-list-users

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500, cors);

  const check = await requireAdmin(req, supabaseUrl, serviceKey);
  if (!check.ok) return json({ error: check.error }, check.status, cors);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authUsers: Array<{
    id: string;
    email: string | undefined;
    created_at: string;
    role: string | null;
  }> = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return json({ error: error.message }, 500, cors);
    for (const u of data.users) {
      const role =
        ((u.app_metadata as Record<string, unknown> | null)?.role as string | undefined) ?? null;
      authUsers.push({ id: u.id, email: u.email, created_at: u.created_at, role });
    }
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 50) break; // safety
  }

  const userIds = authUsers.map((u) => u.id);

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  if (profilesError) return json({ error: profilesError.message }, 500, cors);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]));

  const { data: wallets, error: walletsError } = await admin
    .from("wallet_applications")
    .select("user_id, vault_name, balance_usd, created_at")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });
  if (walletsError) return json({ error: walletsError.message }, 500, cors);
  const walletMap = new Map<string, { vaultName: string | null; balanceUsd: number }>();
  for (const w of wallets ?? []) {
    const uid = w.user_id as string;
    if (!walletMap.has(uid)) {
      walletMap.set(uid, {
        vaultName: (w.vault_name as string | null) ?? null,
        balanceUsd: Number(w.balance_usd ?? 0),
      });
    }
  }

  const users = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    fullName: profileMap.get(u.id) ?? null,
    vaultName: walletMap.get(u.id)?.vaultName ?? null,
    balanceUsd: walletMap.get(u.id)?.balanceUsd ?? 0,
    hasWallet: walletMap.has(u.id),
    role: u.role,
    createdAt: u.created_at,
  }));

  return json({ users }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
