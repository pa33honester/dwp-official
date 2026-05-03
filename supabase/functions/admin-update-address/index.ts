// Edge Function: admin upserts a deposit address row.
// Deploy with: supabase functions deploy admin-update-address

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, requireAdmin } from "../_shared/admin.ts";

type Body = {
  ticker?: string;
  name?: string;
  color?: string;
  address?: string;
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

  const ticker = body.ticker?.trim().toUpperCase();
  if (!ticker) return json({ error: "ticker is required" }, 400, cors);
  if (typeof body.address !== "string") {
    return json({ error: "address is required (may be empty)" }, 400, cors);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const row: Record<string, unknown> = {
    ticker,
    address: body.address.trim(),
    updated_at: new Date().toISOString(),
  };
  if (body.name?.trim()) row.name = body.name.trim();
  if (body.color?.trim()) row.color = body.color.trim();

  const { error } = await admin
    .from("deposit_addresses")
    .upsert(row, { onConflict: "ticker" });
  if (error) return json({ error: error.message }, 500, cors);

  return json({ ok: true }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
