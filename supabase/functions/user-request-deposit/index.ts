// Edge Function: authenticated user submits a deposit request.
// Inserts a pending row in user_deposits — balance is NOT touched until
// admin approves (and verifies the funds actually arrived on-chain).
// Deploy with: supabase functions deploy user-request-deposit

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders } from "../_shared/admin.ts";

type Body = {
  asset?: string;
  amountUsd?: number;
  amountCrypto?: number | null;
  senderInitials?: string;
  txHash?: string | null;
  note?: string | null;
};

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500, cors);

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Missing token" }, 401, cors);
  const token = auth.slice(7);

  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Invalid token" }, 401, cors);
  const userId = userData.user.id;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors);
  }

  const asset = body.asset?.trim().toUpperCase();
  const amountUsd = body.amountUsd;
  const senderInitials = body.senderInitials?.trim();
  const amountCrypto =
    typeof body.amountCrypto === "number" && Number.isFinite(body.amountCrypto)
      ? body.amountCrypto
      : null;
  const txHash = body.txHash?.trim() || null;
  const note = body.note?.trim() || null;

  if (!asset) return json({ error: "asset is required" }, 400, cors);
  if (typeof amountUsd !== "number" || !Number.isFinite(amountUsd) || amountUsd <= 0) {
    return json({ error: "amountUsd must be a positive number" }, 400, cors);
  }
  if (!senderInitials) {
    return json({ error: "senderInitials is required" }, 400, cors);
  }

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
      note,
      sender_initials: senderInitials,
      status: "pending",
      created_by: userId,
    })
    .select("id")
    .single();
  if (insertError) return json({ error: insertError.message }, 500, cors);

  return json({ ok: true, depositId: inserted.id }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
