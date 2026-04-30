import { NextResponse } from "next/server";
import { z } from "zod";
import { sendConfirmationEmail } from "@/lib/email";

const bodySchema = z.object({
  to: z.string().email(),
  name: z.string().min(1),
  template: z.enum(["wallet", "llc", "both"]),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid payload", details: String(err) },
      { status: 400 },
    );
  }
  const result = await sendConfirmationEmail(payload).catch((err) => ({
    error: err instanceof Error ? err.message : String(err),
  }));
  return NextResponse.json(result);
}
