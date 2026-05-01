// Supabase Edge Function — handles custody consultation inquiries
// submitted from /digital-asset-custody.
// Deploy with: supabase functions deploy custody-inquiry
// Secrets:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set CUSTODY_INQUIRY_TO=team@dwpofficial.net   (optional)

import { Resend } from "https://esm.sh/resend@4.0.1";
import { custodyInquirySchema, type CustodyInquiry } from "./_schemas.ts";

const ALLOWED_ORIGINS = [
  "https://dwpofficial.org",
  "https://www.dwpofficial.org",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

function escape(value: string | undefined) {
  if (!value) return "—";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function teamEmailHtml(p: CustodyInquiry) {
  const row = (label: string, value: string | undefined) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#fff;font-size:14px;">${escape(value)}</td></tr>`;
  const entityRows =
    p.hasEntity === "yes"
      ? row("Entity name", p.entityName) + row("Agent contact", p.agentContact)
      : "";
  return `<div style="background:#0a0a0a;color:#fff;font-family:Inter,sans-serif;padding:32px;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #2a2520;border-radius:12px;background:#14110f;padding:32px;">
      <h1 style="color:#D4A24C;font-size:20px;margin:0 0 8px 0;">New Custody Inquiry</h1>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px 0;">Submitted from /digital-asset-custody</p>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Name", p.fullName)}
        ${row("Email", p.email)}
        ${row("Phone", p.phone)}
        ${row("Asset value", p.estimatedAssetValue)}
        ${row("Current allocation", p.currentAllocation)}
        ${row("Has entity", p.hasEntity === "yes" ? "Yes" : "No")}
        ${entityRows}
      </table>
      <p style="margin-top:20px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Assets to transfer</p>
      <p style="white-space:pre-wrap;background:#0a0a0a;border:1px solid #2a2520;border-radius:8px;padding:12px;margin:6px 0 0 0;color:#fff;font-size:14px;">${escape(p.assetsToTransfer)}</p>
    </div>
  </div>`;
}

function clientAckHtml(name: string) {
  return `<div style="background:#0a0a0a;color:#fff;font-family:Inter,sans-serif;padding:32px;">
    <div style="max-width:560px;margin:0 auto;border:1px solid #2a2520;border-radius:12px;background:#14110f;padding:32px;">
      <h1 style="color:#D4A24C;font-size:22px;margin:0 0 16px 0;">Digital Wealth Partners</h1>
      <p>Hi ${escape(name)},</p>
      <p>Thank you for reaching out about institutional custody. A member of our team will review your details and follow up shortly to discuss how our custody solutions fit your requirements.</p>
      <p style="color:#a1a1aa;font-size:12px;margin-top:32px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const parsed = custodyInquirySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid payload", issues: parsed.error.issues }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  const payload = parsed.data;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("RESEND_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "Server not configured" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const resend = new Resend(resendKey);
  const fromEmail =
    Deno.env.get("RESEND_FROM_EMAIL") ?? "DWP <onboarding@resend.dev>";
  const teamTo =
    Deno.env.get("CUSTODY_INQUIRY_TO") ?? "team@dwpofficial.net";

  try {
    await resend.emails.send({
      from: fromEmail,
      to: teamTo,
      replyTo: payload.email,
      subject: `New custody inquiry — ${payload.fullName}`,
      html: teamEmailHtml(payload),
    });
  } catch (err) {
    console.error("Team notification email failed", err);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  // Best-effort acknowledgement to the inquirer; don't fail the request if this fails.
  try {
    await resend.emails.send({
      from: fromEmail,
      to: payload.email,
      subject: "We received your custody inquiry",
      html: clientAckHtml(payload.fullName),
    });
  } catch (err) {
    console.warn("Client acknowledgement email failed", err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
