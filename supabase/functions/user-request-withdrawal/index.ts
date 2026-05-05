// Edge Function: authenticated user submits a withdrawal request.
// Validates available balance + daily limit, decrements balance, inserts row.
// Deploy with: supabase functions deploy user-request-withdrawal

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders } from "../_shared/admin.ts";

type Body = {
  asset?: string;
  amountUsd?: number;
  amountCrypto?: number | null;
  destinationAddress?: string;
  network?: string | null;
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
  const destinationAddress = body.destinationAddress?.trim();
  const amountCrypto =
    typeof body.amountCrypto === "number" && Number.isFinite(body.amountCrypto)
      ? body.amountCrypto
      : null;
  const network = body.network?.trim() || null;
  const note = body.note?.trim() || null;

  if (!asset) return json({ error: "asset is required" }, 400, cors);
  if (typeof amountUsd !== "number" || !Number.isFinite(amountUsd) || amountUsd <= 0) {
    return json({ error: "amountUsd must be a positive number" }, 400, cors);
  }
  if (!destinationAddress) {
    return json({ error: "destinationAddress is required" }, 400, cors);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: wallet, error: walletError } = await admin
    .from("wallet_applications")
    .select("id, balance_usd, locked_balance_usd, daily_withdrawal_limit_usd")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (walletError) return json({ error: walletError.message }, 500, cors);
  if (!wallet) return json({ error: "No wallet found for user" }, 404, cors);

  const balance = Number(wallet.balance_usd ?? 0);
  const locked = Number(wallet.locked_balance_usd ?? 0);
  const limit = Number(wallet.daily_withdrawal_limit_usd ?? 0);

  const { data: pendingRows, error: pendingError } = await admin
    .from("user_withdrawals")
    .select("amount_usd")
    .eq("user_id", userId)
    .eq("status", "pending");
  if (pendingError) return json({ error: pendingError.message }, 500, cors);
  const pendingSum = (pendingRows ?? []).reduce(
    (acc, r) => acc + Number(r.amount_usd ?? 0),
    0,
  );

  const available = balance - locked - pendingSum;
  if (amountUsd > available) {
    return json(
      { error: `Insufficient available balance ($${available.toFixed(2)} available)` },
      400,
      cors,
    );
  }

  if (limit > 0) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRows, error: recentError } = await admin
      .from("user_withdrawals")
      .select("amount_usd")
      .eq("user_id", userId)
      .in("status", ["pending", "completed"])
      .gte("created_at", since);
    if (recentError) return json({ error: recentError.message }, 500, cors);
    const recentSum = (recentRows ?? []).reduce(
      (acc, r) => acc + Number(r.amount_usd ?? 0),
      0,
    );
    if (recentSum + amountUsd > limit) {
      return json(
        {
          error: `Daily withdrawal limit exceeded ($${(limit - recentSum).toFixed(2)} remaining today)`,
        },
        400,
        cors,
      );
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from("user_withdrawals")
    .insert({
      user_id: userId,
      asset,
      amount_usd: amountUsd,
      amount_crypto: amountCrypto,
      destination_address: destinationAddress,
      network,
      note,
      status: "pending",
    })
    .select("id")
    .single();
  if (insertError) return json({ error: insertError.message }, 500, cors);

  const { error: updateError } = await admin
    .from("wallet_applications")
    .update({
      balance_usd: balance - amountUsd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id);
  if (updateError) return json({ error: updateError.message }, 500, cors);

  return json({ ok: true, withdrawalId: inserted.id }, 200, cors);
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
