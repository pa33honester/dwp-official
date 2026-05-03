// Shared helper for admin Edge Functions: validates the caller's JWT against
// Supabase signing keys and confirms `app_metadata.role === 'admin'`.
// Leading-underscore directories are skipped by `supabase functions deploy`,
// so this file is not deployed standalone.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

export const ALLOWED_ORIGINS = [
  "https://dwpofficial.org",
  "https://www.dwpofficial.org",
  "https://dwpofficial.net",
  "https://www.dwpofficial.net",
  "http://localhost:3000",
];

export function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

export type AdminCheckResult =
  | { ok: true; user: { id: string; email?: string | null } }
  | { ok: false; status: number; error: string };

export async function requireAdmin(
  req: Request,
  supabaseUrl: string,
  serviceKey: string,
): Promise<AdminCheckResult> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing token" };
  }
  const token = auth.slice(7);
  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, error: "Invalid token" };
  }
  const role = (data.user.app_metadata as Record<string, unknown> | null)?.role;
  if (role !== "admin") {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, user: { id: data.user.id, email: data.user.email } };
}
