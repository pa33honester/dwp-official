import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "DWP <onboarding@resend.dev>";

type Template = "wallet" | "llc" | "both";

const subjects: Record<Template, string> = {
  wallet: "Your DWP Secured Wallet is ready",
  llc: "Your Digital Asset LLC application has been received",
  both: "Welcome to DWP — Wallet secured & LLC submitted",
};

function htmlBody(template: Template, name: string) {
  const base = `
    <div style="background:#0a0a0a;color:#fff;font-family:Inter,sans-serif;padding:32px;">
      <div style="max-width:560px;margin:0 auto;border:1px solid #2a2520;border-radius:12px;background:#14110f;padding:32px;">
        <h1 style="color:#D4A24C;font-size:22px;margin:0 0 16px 0;">DigitalWealth Partners</h1>
  `;
  const close = `
        <p style="color:#a1a1aa;font-size:12px;margin-top:32px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  if (template === "wallet") {
    return `${base}
      <p>Hi ${name},</p>
      <p>Your DWP Secured Wallet has been successfully created. You can now connect your wallet or fund it directly to begin using your custody environment.</p>
    ${close}`;
  }

  if (template === "llc") {
    return `${base}
      <p>Hi ${name},</p>
      <p>Your Digital Asset LLC application has been received and forwarded to our legal team for review. We will be in touch shortly.</p>
    ${close}`;
  }

  return `${base}
    <p>Hi ${name},</p>
    <p>Your wallet has been successfully secured. Your Digital Asset LLC application has been submitted to our legal team for review.</p>
    <p>In the meantime, you may fund your wallet and begin utilizing your DWP secure wallet while your LLC structure is being finalized.</p>
  ${close}`;
}

export async function sendConfirmationEmail({
  to,
  name,
  template,
}: {
  to: string;
  name: string;
  template: Template;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping email send");
    return { skipped: true };
  }
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: subjects[template],
    html: htmlBody(template, name),
  });
  return result;
}
